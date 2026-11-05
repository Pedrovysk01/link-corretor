// Visualização 3D Real da Villa Montemerano (Three.js WebGL com OrbitControls)
// Arquitetura fiel à técnica do Bossa (app/js/relevo3d.js):
// - Volumes 3D texturizados com os renders ortográficos oficiais das 4 fachadas e do terraço de lazer.
// - 20 pavimentos tipo modelados como fatias individuais clicáveis e destacáveis em 3D.
// - Chamarizes modelados: Térreo (Hall), Garagens e Lazer (659 m²).
// - Raycaster em tempo real com contorno dourado pulsante (EdgesGeometry) e tooltip no hover.
// - Interpolação suave de câmera (fly / tween) ao clicar em qualquer andar ou chamariz.

import { D, $, isMobile, reduceM } from "./data.js";
import { select, closeCard, card } from "./ficha.js";
import { state } from "./state.js";

const v3d = $("v3d"), v3msg = $("v3msg"), tip = $("tip"), pinsEl = $("pins");
const ACESO = ap => D.mostrarStatus && ap && (ap.status === "v" || ap.status === "r");
let sunLight = null, ambLight = null, fillLight = null, lampMeshes = [], facadeMatsRef = null, lazerMatRef = null, plinthRef = null;
export const R3 = { on: false, ready: false, loading: false, renderer: null, scene: null, camera: null, controls: null, dirty: true };

// Dimensões do edifício em metros (1 unidade = 1 metro)
const PODIUM_W = 31.4, PODIUM_D = 24.0, PODIUM_H = 14.0;
const TOWER_W = 20.0, TOWER_D = 18.8, FLOOR_H = 3.2, N_FLOORS = 20;
// Posição da torre sobre o embasamento: encostada na frente e esquerda, deixando o terraço aberto à direita e fundos
const TOWER_OFF_X = -4.8, TOWER_OFF_Z = 1.6;

let THREE, OrbitControls, scene, camera, renderer, controls, ray, ndc;
let floorMeshes = [], chamarizMeshes = [], highlightLine = null;
let hoveredMesh = null, selectedMesh = null;
let twCam = null, rafId = null;

function setFaceUV(geometry, faceIdx, u0, v0, u1, v1) {
  const uv = geometry.attributes.uv;
  uv.setXY(faceIdx * 4 + 0, u0, v1);
  uv.setXY(faceIdx * 4 + 1, u1, v1);
  uv.setXY(faceIdx * 4 + 2, u0, v0);
  uv.setXY(faceIdx * 4 + 3, u1, v0);
}

export async function build3D() {
  if (R3.ready || R3.loading) return;
  R3.loading = true;
  v3msg.hidden = false;
  v3msg.textContent = "Carregando maquete 3D interativa…";

  THREE = await import("three");
  const mod = await import("three/addons/controls/OrbitControls.js");
  OrbitControls = mod.OrbitControls;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile() ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  v3d.prepend(renderer.domElement);

  scene = new THREE.Scene();
  renderer.setClearColor(0x0e1726, 1);

  camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 1, 2000);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 25;
  controls.maxDistance = 280;
  controls.maxPolarAngle = Math.PI / 2.05; // não atravessar o chão
  controls.minPolarAngle = 0.05;

  // Carregar as texturas oficiais de alta resolução
  const TL = new THREE.TextureLoader();
  const [texFrente, texTras, texLatDir, texLatEsq, texLazer] = await Promise.all([
    TL.loadAsync("media/3d/facada_frente.jpg"),
    TL.loadAsync("media/3d/facada_traseira.jpg"),
    TL.loadAsync("media/3d/facada_lateral_dir.jpg"),
    TL.loadAsync("media/3d/facada_lateral_esq.jpg"),
    TL.loadAsync("media/3d/lazer_deck.jpg")
  ]);

  [texFrente, texTras, texLatDir, texLatEsq, texLazer].forEach(t => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  });

  // Materiais das 4 fachadas
  const matRight = new THREE.MeshLambertMaterial({ map: texLatDir, emissive: 0xffffff, emissiveMap: texLatDir, emissiveIntensity: 0.25 });
  const matLeft = new THREE.MeshLambertMaterial({ map: texLatEsq, emissive: 0xffffff, emissiveMap: texLatEsq, emissiveIntensity: 0.25 });
  const matTop = new THREE.MeshLambertMaterial({ color: 0xd9d3c7 });
  const matBot = new THREE.MeshLambertMaterial({ color: 0x9e978a });
  const matFront = new THREE.MeshLambertMaterial({ map: texFrente, emissive: 0xffffff, emissiveMap: texFrente, emissiveIntensity: 0.25 });
  const matBack = new THREE.MeshLambertMaterial({ map: texTras, emissive: 0xffffff, emissiveMap: texTras, emissiveIntensity: 0.25 });
  const facadeMats = [matRight, matLeft, matTop, matBot, matFront, matBack];
  facadeMatsRef = facadeMats; lazerMatRef = null;
  for (const m of [matRight, matLeft, matFront, matBack]) m.emissiveIntensity = 0.08;

  // Pedestal / Piso arquitetônico elegante com sombra de contato
  const plinthGeo = new THREE.CylinderGeometry(55, 58, 2.5, 48);
  const plinthMat = new THREE.MeshLambertMaterial({ color: 0x8f9aab });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat); plinthRef = plinth;
  plinth.position.y = -1.25;
  plinth.receiveShadow = true;
  scene.add(plinth);

  // Anel de sombra de contato suave no chão
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 256;
  const sctx = shadowCanvas.getContext("2d");
  const sgrad = sctx.createRadialGradient(128, 128, 30, 128, 128, 128);
  sgrad.addColorStop(0, "rgba(0,0,0,0.65)");
  sgrad.addColorStop(0.5, "rgba(0,0,0,0.25)");
  sgrad.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = sgrad;
  sctx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(75, 75), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  shadowPlane.material.opacity = 0.35;
  scene.add(shadowPlane);

  // 1. EMBASAMENTO (Térreo + Garagens)
  const baseGeo = new THREE.BoxGeometry(PODIUM_W, PODIUM_H, PODIUM_D);
  // UVs da base: v0=0.0, v1=0.1929
  setFaceUV(baseGeo, 0, 40 / 325, 0.0, 280 / 325, 0.1929); // Right
  setFaceUV(baseGeo, 1, 21 / 325, 0.0, 258 / 325, 0.1929); // Left
  setFaceUV(baseGeo, 4, 7 / 325, 0.0, 320 / 325, 0.1929);  // Front
  setFaceUV(baseGeo, 5, 25 / 325, 0.0, 316 / 325, 0.1929); // Back
  const baseMesh = new THREE.Mesh(baseGeo, facadeMats);
  baseMesh.position.set(0, PODIUM_H / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  baseMesh.userData = { type: "chamariz", id: "hall", label: "Térreo · Hall de Entrada & Garagens" };
  scene.add(baseMesh);
  chamarizMeshes.push(baseMesh);

  // 2. LAJE DE LAZER (Terraço com piscina e decks)
  const lazerGeo = new THREE.PlaneGeometry(PODIUM_W, PODIUM_D);
  const lazerMat = new THREE.MeshLambertMaterial({ map: texLazer, emissive: 0xffffff, emissiveMap: texLazer, emissiveIntensity: 0.06 }); lazerMatRef = lazerMat;
  const lazerMesh = new THREE.Mesh(lazerGeo, lazerMat);
  lazerMesh.rotation.x = -Math.PI / 2;
  lazerMesh.position.set(0, PODIUM_H + 0.05, 0);
  lazerMesh.receiveShadow = true;
  lazerMesh.userData = { type: "chamariz", id: "lazer", label: "Pavimento de Lazer · 659 m²" };
  scene.add(lazerMesh);
  chamarizMeshes.push(lazerMesh);

  // Guarda-corpo em vidro transparente ao redor do lazer
  const railGeo = new THREE.BoxGeometry(PODIUM_W + 0.1, 1.2, PODIUM_D + 0.1);
  const railMat = new THREE.MeshPhysicalMaterial({ color: 0x8ec7dc, transparent: true, opacity: 0.38, roughness: 0.1, transmission: 0.6 });
  const railMesh = new THREE.Mesh(railGeo, railMat);
  railMesh.position.set(0, PODIUM_H + 0.6, 0);
  scene.add(railMesh);

  // 3. TORRE RESIDENCIAL: 20 PAVIMENTOS TIPO INDIVIDUAIS
  floorMeshes = [];
  const H_IMG = 985.0;
  // Cada andar são DUAS metades espelhadas: esquerda (x<0) = Final 01, direita (x>0) = Final 02, como no prédio visto de frente.
  // A textura da frente/trás é cortada ao meio para cada metade; as laterais ficam inteiras no lado correspondente.
  lampMeshes = [];
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.0, depthWrite: false });
  for (let i = 0; i < N_FLOORS; i++) {
    const numAndar = 4 + i;
    const dados = (D.andares || []).find(a => a.num === numAndar);
    const yTopImg = 85.0 + (19 - i) * 35.5;
    const yBotImg = yTopImg + 35.5;
    const v0 = (H_IMG - yBotImg) / H_IMG;
    const v1 = (H_IMG - yTopImg) / H_IMG;
    const posY = PODIUM_H + i * FLOOR_H + FLOOR_H / 2;
    for (let lado = 0; lado < 2; lado++) {
      const ap = dados ? dados.aptos[lado] : null;
      const fGeo = new THREE.BoxGeometry(TOWER_W / 2, FLOOR_H - 0.04, TOWER_D);
      const uf0 = 61 / 325, uf1 = 261 / 325, um = (uf0 + uf1) / 2;   // frente: metade esquerda / direita
      const ub0 = 73 / 325, ub1 = 270 / 325, ubm = (ub0 + ub1) / 2;  // trás (espelhada: a esquerda de quem olha de trás é a direita)
      setFaceUV(fGeo, 0, 64 / 325, v0, 253 / 325, v1); // Right (só visível na metade direita)
      setFaceUV(fGeo, 1, 47 / 325, v0, 239 / 325, v1); // Left (só visível na metade esquerda)
      setFaceUV(fGeo, 4, lado ? um : uf0, v0, lado ? uf1 : um, v1); // Front
      setFaceUV(fGeo, 5, lado ? ub0 : ubm, v0, lado ? ubm : ub1, v1); // Back
      const fMesh = new THREE.Mesh(fGeo, facadeMats);
      fMesh.position.set(TOWER_OFF_X + (lado ? 1 : -1) * TOWER_W / 4, posY, TOWER_OFF_Z);
      fMesh.castShadow = true;
      fMesh.receiveShadow = true;
      fMesh.userData = { type: "andar", num: numAndar, id: `andar-${numAndar}`, apto: lado, aptoId: ap ? ap.id : `${numAndar}0${lado + 1}`, area: ap ? ap.area : (lado ? "128,60" : "116,60"), aceso: ACESO(ap),
        label: `${numAndar}º Pavimento`, alt: posY };
      scene.add(fMesh);
      floorMeshes.push(fMesh);
      if (ACESO(ap)) { // lâmpada acesa: um ponto pequeno numa janela da frente da unidade, sempre visível
        // pequeno retângulo quente colado no vidro da janela da frente (sem flutuar): 0,55 × 0,35 m
        const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), lampMat.clone());
        lamp.position.set(fMesh.position.x + (lado ? 1 : -1) * TOWER_W * 0.11, posY - 0.2, TOWER_OFF_Z + TOWER_D / 2 + 0.03);
        lamp.material.opacity = 0.85; lamp.material.color.set(0xffd27a); lamp.userData = { lamp: true };
        scene.add(lamp); lampMeshes.push(lamp);
      }
    }
  }

  // 4. COROAMENTO & CAIXA D'ÁGUA (Rooftop / Topo)
  const crownH = 7.5;
  const crownGeo = new THREE.BoxGeometry(TOWER_W * 0.88, crownH, TOWER_D * 0.85);
  setFaceUV(crownGeo, 0, 70 / 325, 0.9137, 245 / 325, 1.0);
  setFaceUV(crownGeo, 1, 55 / 325, 0.9137, 230 / 325, 1.0);
  setFaceUV(crownGeo, 4, 65 / 325, 0.9137, 255 / 325, 1.0);
  setFaceUV(crownGeo, 5, 75 / 325, 0.9137, 265 / 325, 1.0);
  const crownMesh = new THREE.Mesh(crownGeo, facadeMats);
  crownMesh.position.set(TOWER_OFF_X, PODIUM_H + N_FLOORS * FLOOR_H + crownH / 2, TOWER_OFF_Z);
  crownMesh.castShadow = true;
  scene.add(crownMesh);

  // Caixa d'água central com logo Justus
  const logoGeo = new THREE.BoxGeometry(6.5, 4.5, 5.0);
  const logoMat = new THREE.MeshLambertMaterial({ color: 0xdfd8ca });
  const logoMesh = new THREE.Mesh(logoGeo, logoMat);
  logoMesh.position.set(TOWER_OFF_X, PODIUM_H + N_FLOORS * FLOOR_H + crownH + 2.25, TOWER_OFF_Z);
  scene.add(logoMesh);

  // Malha de destaque dourada (EdgesGeometry) reutilizável
  const edgeLineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(TOWER_W / 2 + 0.15, FLOOR_H + 0.05, TOWER_D + 0.15));
  const edgeLineMat = new THREE.LineBasicMaterial({ color: 0xf0c27f, linewidth: 3, transparent: true, opacity: 0.95 });
  highlightLine = new THREE.LineSegments(edgeLineGeo, edgeLineMat);
  highlightLine.visible = false;
  scene.add(highlightLine);

  // Iluminação de Estúdio Arquitetônico
  ambLight = new THREE.HemisphereLight(0xffffff, 0x445566, 0.45);
  scene.add(ambLight);

  sunLight = new THREE.DirectionalLight(0xfff7ea, 0.95);
  sunLight.position.set(65, 120, 85);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -55;
  sunLight.shadow.camera.right = 55;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -30;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 320;
  sunLight.shadow.camera.left = -70; sunLight.shadow.camera.right = 70; sunLight.shadow.camera.top = 110; sunLight.shadow.camera.bottom = -40;
  sunLight.shadow.bias = -0.0003;
  scene.add(sunLight);

  fillLight = new THREE.DirectionalLight(0x90b5d0, 0.45);
  fillLight.position.set(-60, 45, -70);
  scene.add(fillLight);

  // Raycaster para detecção de hover e clique
  ray = new THREE.Raycaster();
  ndc = new THREE.Vector2();

  let downInfo = null;
  renderer.domElement.addEventListener("pointerdown", e => {
    downInfo = [e.clientX, e.clientY, performance.now()];
  });

  renderer.domElement.addEventListener("pointermove", e => {
    if (e.pointerType === "touch" || (downInfo && Math.hypot(e.clientX - downInfo[0], e.clientY - downInfo[1]) > 5)) {
      tip.hidden = true;
      return;
    }
    const hit = pickMesh(e.clientX, e.clientY);
    if (hit) {
      hoveredMesh = hit;
      renderer.domElement.style.cursor = "pointer";
      updateHighlight(hit);
      tip.hidden = false;
      tip.style.left = e.clientX + 14 + "px";
      tip.style.top = e.clientY + 14 + "px";
      if (hit.userData.type === "andar") {
        const u = hit.userData, st = u.aceso ? ((D.andares.find(a => a.num === u.num) || { aptos: [] }).aptos[u.apto].status === "v" ? " · Vendido" : " · Reservado") : "";
        tip.innerHTML = `<b>${u.label} · Apto ${u.aptoId}</b> · ${u.apto ? "Final 02" : "Final 01"} · ${u.area} m²${st}`;
      } else {
        tip.innerHTML = `<b>${hit.userData.label}</b> · toque para conhecer`;
      }
    } else {
      hoveredMesh = null;
      if (!selectedMesh) highlightLine.visible = false;
      renderer.domElement.style.cursor = "grab";
      tip.hidden = true;
    }
    R3.dirty = true;
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    tip.hidden = true;
    hoveredMesh = null;
    if (!selectedMesh) highlightLine.visible = false;
  });

  renderer.domElement.addEventListener("pointerup", e => {
    if (!downInfo) return;
    const dist = Math.hypot(e.clientX - downInfo[0], e.clientY - downInfo[1]);
    const dt = performance.now() - downInfo[2];
    downInfo = null;
    if (dist > 6 || dt > 500) return; // foi arraste, não clique

    const hit = pickMesh(e.clientX, e.clientY);
    if (hit) {
      focusMesh(hit);
      select(hit.userData.id, true, hit.userData.apto);
    } else if (state.cardOpen && isMobile()) {
      closeCard();
    }
  });

  function pickMesh(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const targets = [...floorMeshes, ...chamarizMeshes];
    const hits = ray.intersectObjects(targets, false);
    return hits.length ? hits[0].object : null;
  }

  function updateHighlight(mesh) {
    highlightLine.visible = true;
    if (mesh.userData.type === "andar") {
      highlightLine.scale.set(1, 1, 1);
      highlightLine.position.copy(mesh.position);
    } else if (mesh.userData.id === "lazer") {
      highlightLine.scale.set(PODIUM_W / (TOWER_W / 2), 0.4, PODIUM_D / TOWER_D);
      highlightLine.position.set(0, PODIUM_H, 0);
    } else if (mesh.userData.id === "hall") {
      highlightLine.scale.set(PODIUM_W / (TOWER_W / 2), PODIUM_H / FLOOR_H, PODIUM_D / TOWER_D);
      highlightLine.position.set(0, PODIUM_H / 2, 0);
    }
  }

  // Posição inicial da câmera (Vista diagonal elegante)
  setCamInitial();

  addEventListener("resize", () => {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    R3.dirty = true;
  });

  R3.renderer = renderer;
  R3.scene = scene;
  R3.camera = camera;
  R3.controls = controls;
  R3.ready = true;
  R3.loading = false;
  v3msg.hidden = true;

  loop();
}

function setCamInitial() {
  const isMob = isMobile();
  const d = isMob ? 135 : 110;
  camera.position.set(d * 0.75, isMob ? 65 : 55, d * 0.75);
  controls.target.set(TOWER_OFF_X, isMob ? 42 : 38, TOWER_OFF_Z);
  controls.update();
  R3.dirty = true;
}

export function focusFloor(andarNum, lado = 0) {
  const mesh = floorMeshes.find(m => m.userData.num === andarNum && m.userData.apto === lado) || floorMeshes.find(m => m.userData.num === andarNum);
  if (mesh) focusMesh(mesh);
}

export function focusMesh(mesh) {
  selectedMesh = mesh;
  const targetY = mesh.position.y;
  const isMob = isMobile();
  const d = isMob ? 68 : 55;
  const curAngle = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
  
  const toPos = new THREE.Vector3(
    mesh.position.x + Math.sin(curAngle) * d,
    targetY + (isMob ? 8 : 4),
    mesh.position.z + Math.cos(curAngle) * d
  );
  const toTarget = new THREE.Vector3(mesh.position.x, targetY, mesh.position.z);
  
  flyCamera(toPos, toTarget, 900);
}

function flyCamera(toPos, toTarget, ms = 900) {
  if (reduceM()) {
    camera.position.copy(toPos);
    controls.target.copy(toTarget);
    controls.update();
    R3.dirty = true;
    return;
  }
  twCam = {
    p0: camera.position.clone(),
    t0: controls.target.clone(),
    p1: toPos,
    t1: toTarget,
    start: performance.now(),
    ms
  };
  R3.dirty = true;
}

function loop() {
  if (!R3.on) {
    rafId = null;
    return;
  }
  const t = performance.now();
  let animating = false;

  if (twCam) {
    animating = true;
    const k = Math.min(1, (t - twCam.start) / twCam.ms);
    const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(twCam.p0, twCam.p1, ease);
    controls.target.lerpVectors(twCam.t0, twCam.t1, ease);
    controls.update();
    if (k >= 1) twCam = null;
  }

  const moved = controls.update() || animating || R3.dirty;
  
  if (highlightLine && highlightLine.visible) {
    const pulse = 0.65 + 0.35 * Math.sin(t / 220);
    highlightLine.material.opacity = pulse;
    animating = true;
  }

  if (moved || animating) {
    renderer.render(scene, camera);
    R3.dirty = false;
  }

  rafId = requestAnimationFrame(loop);
}

export async function set3D(on) {
  R3.on = on;
  state.mode = on ? "3d" : "mapa";
  document.querySelectorAll("[data-v]").forEach(b => b.setAttribute("aria-pressed", (b.dataset.v === "3d") === on));
  document.body.classList.toggle("is3d", on);
  v3d.hidden = !on;
  $("mview").hidden = on;
  $("pins").hidden = on;
  tip.hidden = true;

  if (on) {
    if (!R3.ready) {
      await build3D();
    }
    setCamInitial();
    R3.dirty = true;
    if (!rafId) loop();
  } else {
    highlightLine && (highlightLine.visible = false);
    selectedMesh = null;
    hoveredMesh = null;
  }
}


/** Sol na maquete: el/az em graus (az: 0 = norte, 90 = leste), norteDeg = para onde aponta o +z... ver sol.js.
 *  Direção do sol no mundo: x = leste, z = sul (três.js: -z é "para o fundo"). O mapa diz quantos graus o eixo da frente do prédio está do norte. */
export function sol3D(el, az, noite) {
  if (!R3.ready || !sunLight) return;
  const r = Math.PI / 180, elR = Math.max(2, el) * r, azR = az * r;
  const dist = 160;
  // az aqui já é relativo à frente do prédio (0 = de frente, 90 = da direita). -z é a frente.
  sunLight.position.set(Math.sin(azR) * Math.cos(elR) * dist, Math.sin(elR) * dist, -Math.cos(azR) * Math.cos(elR) * dist);
  sunLight.target.position.set(0, 0, 0); if (!sunLight.target.parent) scene.add(sunLight.target);
  sunLight.shadow.needsUpdate = true;
  const dia = Math.max(0, Math.min(1, el / 25));
  sunLight.intensity = noite ? 0 : 0.6 + 1.4 * dia;
  sunLight.color.setHSL(0.09, noite ? 0 : 0.55 * (1 - dia) + 0.1, 0.5 + 0.45 * dia);
  ambLight.intensity = noite ? 0.18 : 0.25 + 0.25 * dia;
  fillLight.intensity = noite ? 0.1 : 0.2;
  renderer.setClearColor(noite ? 0x07101a : el < 12 ? 0x1a1620 : 0x0e1726, 1);
  for (const l of lampMeshes) { l.material.opacity = noite ? 1 : 0.7; l.scale.setScalar(noite ? 1.25 : 1); } // à noite a lâmpada aparece mais
  if (facadeMatsRef) for (const m of facadeMatsRef) if (m.emissiveMap) m.emissiveIntensity = noite ? 0.02 : 0.08 + 0.12 * (1 - dia);
  if (lazerMatRef) lazerMatRef.emissiveIntensity = noite ? 0.02 : 0.06;
  if (plinthRef) plinthRef.material.color.set(noite ? 0x1c2433 : 0x8f9aab);
  renderer.shadowMap.needsUpdate = true;
  R3.dirty = true;
}
