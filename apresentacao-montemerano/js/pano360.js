// Visualizador 360° (panorama equirretangular 2:1). Arrastar gira, roda/pinça aproxima.
// Monta dentro de um contêiner; devolve { zoom(f), reset(), dispose() }.
import { reduceM } from "./data.js";

let THREE = null;
const tresP = () => THREE ? Promise.resolve(THREE) : import("three").then(m => (THREE = m));
const cacheTex = new Map();

export function mountPano(host, src, { auto = true, onReady } = {}) {
  const el = document.createElement("div");
  el.className = "p360";
  el.innerHTML = `<div class="p360-load" aria-hidden="true"></div><span class="p360-tag" aria-hidden="true">360°</span><span class="p360-dica">Arraste para olhar em volta</span>`;
  host.appendChild(el);
  let morto = false, ren = null, raf = 0, ro = null;
  let lon = 0, lat = 0, fov = 75, giro = auto && !reduceM(), parado = 0;
  const FOV_MIN = 48, FOV_MAX = 95;  // 4096 px = ~11 px/grau: abaixo de ~48° a imagem passa a ser esticada
  const api = {
    zoom: f => { fov = Math.min(FOV_MAX, Math.max(FOV_MIN, fov / f)); },
    reset: () => { fov = 75; lat = 0; },
    dispose: () => { morto = true; cancelAnimationFrame(raf); ro && ro.disconnect(); if (ren) { ren.dispose(); ren.forceContextLoss(); } el.remove(); }
  };
  // ponteiros: um dedo gira, dois dedos aproximam. Nada vaza para o pai (pan/troca de imagem).
  const pts = new Map(); let dist0 = 0;
  const parar = e => e.stopPropagation();
  el.addEventListener("pointerdown", e => { parar(e); el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); giro = false; el.classList.add("mexeu");
    if (pts.size === 2) { const [a, b] = [...pts.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  el.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; parar(e); const p = pts.get(e.pointerId);
    if (pts.size === 2) { pts.set(e.pointerId, [e.clientX, e.clientY]); const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (dist0) api.zoom(d / dist0); dist0 = d; return; }
    const k = fov / el.clientHeight; lon -= (e.clientX - p[0]) * k; lat = Math.max(-80, Math.min(80, lat + (e.clientY - p[1]) * k)); pts.set(e.pointerId, [e.clientX, e.clientY]); });
  const fim = e => { parar(e); pts.delete(e.pointerId); if (pts.size < 2) dist0 = 0; parado = performance.now(); };
  el.addEventListener("pointerup", fim); el.addEventListener("pointercancel", fim);
  el.addEventListener("wheel", e => { e.preventDefault(); e.stopPropagation(); api.zoom(Math.exp(-e.deltaY * .0012)); }, { passive: false });
  el.addEventListener("click", parar); el.addEventListener("dblclick", parar);

  tresP().then(T => {
    if (morto) return;
    ren = new T.WebGLRenderer({ antialias: true });
    ren.setPixelRatio(Math.min(devicePixelRatio, 2));
    ren.outputColorSpace = T.SRGBColorSpace;
    el.prepend(ren.domElement);
    const cena = new T.Scene(), cam = new T.PerspectiveCamera(fov, 1, .1, 100);
    const geo = new T.SphereGeometry(10, 64, 40); geo.scale(-1, 1, 1);
    const mat = new T.MeshBasicMaterial({ color: 0xffffff });
    cena.add(new T.Mesh(geo, mat));
    const tam = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    ro = new ResizeObserver(tam); ro.observe(el); tam();
    let tex = cacheTex.get(src);
    const pronto = t => { if (morto) return; mat.map = t; mat.needsUpdate = true; el.classList.add("pronto"); onReady && onReady(); };
    if (tex) pronto(tex);
    else new T.TextureLoader().load(src, t => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = ren.capabilities.getMaxAnisotropy(); cacheTex.set(src, t); pronto(t); });
    const alvo = new T.Vector3();
    const loop = () => {
      if (morto) return; raf = requestAnimationFrame(loop);
      if (!giro && auto && !reduceM() && !pts.size && parado && performance.now() - parado > 6000) giro = true;
      if (giro) lon += .035;
      if (cam.fov !== fov) { cam.fov += (fov - cam.fov) * .2; if (Math.abs(cam.fov - fov) < .05) cam.fov = fov; cam.updateProjectionMatrix(); }
      const phi = T.MathUtils.degToRad(90 - lat), th = T.MathUtils.degToRad(lon);
      alvo.set(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      cam.lookAt(alvo); ren.render(cena, cam);
    };
    loop();
  });
  return api;
}
