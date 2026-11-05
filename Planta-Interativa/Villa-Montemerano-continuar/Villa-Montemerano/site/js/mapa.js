// Mapa aéreo 2D: imagem do entorno com pan/zoom, polígonos clicáveis para os 20 andares e chamarizes (Lazer, Hall, Garagens) e pins.
import { D, VIEWS, $, isMobile, reduceM } from "./data.js";
import { panzoom, EASE } from "./panzoom.js";
import { select, closeCard } from "./ficha.js";
import { state } from "./state.js";

const M = D.mapa, view = $("mview"), world = $("mworld"), svg = $("msvg"), pinsEl = $("pins"), tip = $("tip");
world.style.width = M.w + "px"; world.style.height = M.h + "px";
const NS = "http://www.w3.org/2000/svg";

const svgElements = [];

// 1. Criar polígonos dos chamarizes (Hall, Garagens, Lazer)
if (D.chamarizes) {
  for (const c of D.chamarizes) {
    if (!c.poly2d) continue;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "h chamariz-h " + (c.id === "lazer" ? "lazer-h" : "base-h"));
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", c.titulo + ": ver detalhes");
    g.dataset.id = c.id;
    const d = "M" + c.poly2d.map(p => p.join(",")).join("L") + "Z";
    const hit = document.createElementNS(NS, "path");
    hit.setAttribute("class", "hit"); hit.setAttribute("d", d); hit.setAttribute("stroke", "transparent"); hit.setAttribute("stroke-width", "8");
    const shape = document.createElementNS(NS, "path");
    shape.setAttribute("class", "shape"); shape.setAttribute("d", d);
    g.append(hit, shape);
    svg.append(g);
    g.addEventListener("click", e => { e.stopPropagation(); select(c.id) });
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(c.id) } });
    svgElements.push({ id: c.id, label: c.titulo, poly: c.poly2d, el: g });
  }
}

// 2. Criar polígonos individuais para cada um dos 20 andares
if (D.andares) {
  for (const a of D.andares) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "h andar-h");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", `${a.label}: Apto ${a.aptos[0].id} e ${a.aptos[1].id}`);
    g.dataset.id = a.id;
    const d = "M" + a.poly2d.map(p => p.join(",")).join("L") + "Z";
    const hit = document.createElementNS(NS, "path");
    hit.setAttribute("class", "hit"); hit.setAttribute("d", d); hit.setAttribute("stroke", "transparent"); hit.setAttribute("stroke-width", "4");
    const shape = document.createElementNS(NS, "path");
    shape.setAttribute("class", "shape"); shape.setAttribute("d", d);
    g.append(hit, shape);
    svg.append(g);
    g.addEventListener("click", e => { e.stopPropagation(); select(a.id) });
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(a.id) } });
    svgElements.push({ id: a.id, label: a.label, sub: `Aptos ${a.aptos[0].id} · ${a.aptos[0].area} m² e ${a.aptos[1].id} · ${a.aptos[1].area} m²`, poly: a.poly2d, el: g });
  }
}

const pip = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c };
const itemAt = (u, v) => svgElements.find(it => pip(u, v, it.poly));

const padFn = () => { const m = isMobile(); return { t: m ? 90 : 120, b: m ? 100 : 70, l: 24, r: !m && state.cardOpen ? 470 : 24 } };

const pins = (M.pins || []).map(p => {
  const el = document.createElement("button"); el.className = "pin"; el.type = "button"; el.textContent = p.t;
  el.onclick = () => select(p.id.replace("chamariz-", ""));
  pinsEl.append(el); return { ...p, el };
});

function placePins(cam) {
  for (const p of pins) {
    const [x, y] = [cam.TX + p.p[0] * cam.S, cam.TY + p.p[1] * cam.S];
    p.el.hidden = state.mode !== "mapa" || x < -60 || x > innerWidth + 60 || y < 0 || y > innerHeight;
    p.el.style.transform = `translate(${x}px,${y}px) translate(-50%,calc(-100% - 10px))`;
  }
}

let hiLoaded = false;
function hiRes(cam) {
  if (hiLoaded || cam.S * (devicePixelRatio || 1) < 1.15) return;
  hiLoaded = true;
  const im = new Image();
  im.onload = () => { $("mimg").src = im.src; const fx = $("torre-fx"); if (fx) { fx.style.backgroundImage = `url(${im.src})`; const m = "url(media/hero/torre-mascara-4200.png)"; fx.style.webkitMaskImage = m; fx.style.maskImage = m } };
  im.onerror = () => { hiLoaded = false };
  im.src = "media/hero/aerea-hero-4200.webp";
}

function onCam(cam) {
  placePins(cam);
  hiRes(cam);
}

const pz = panzoom(view, world, {
  w: M.w, h: M.h, fit: "cover", max: 5,
  pad: padFn,
  slack: () => ({ l: 0, r: !isMobile() && state.cardOpen ? 470 : 0 }),
  reduce: reduceM,
  onChange: onCam,
  onTap: (x, y) => {
    const r = view.getBoundingClientRect(), c = pz.cam;
    const it = itemAt((x - r.left - c.TX) / c.S, (y - r.top - c.TY) / c.S);
    if (it) select(it.id);
    else if (state.cardOpen && isMobile()) closeCard();
  }
});

view.addEventListener("pointermove", e => {
  if (e.pointerType !== "mouse" || e.buttons) { tip.hidden = true; return }
  const r = view.getBoundingClientRect(), c = pz.cam;
  const it = itemAt((e.clientX - r.left - c.TX) / c.S, (e.clientY - r.top - c.TY) / c.S);
  if (it) {
    tip.hidden = false; tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY + 12 + "px";
    tip.innerHTML = `<b>${it.label}</b>${it.sub ? `<span class="tip-sub">${it.sub}</span>` : ""}`;
    // não deixa o rótulo sair da tela pelo lado direito
    const w = tip.offsetWidth; if (e.clientX + 12 + w > innerWidth - 8) tip.style.left = (e.clientX - 12 - w) + "px";
    view.style.cursor = "pointer";
  } else {
    tip.hidden = true;
    view.style.cursor = "";
  }
});

view.addEventListener("pointerleave", () => { tip.hidden = true });

$("zin").onclick = () => pz.zoomAt(1.5, innerWidth / 2, innerHeight / 2);
$("zout").onclick = () => pz.zoomAt(1 / 1.5, innerWidth / 2, innerHeight / 2);

const narrow = () => isMobile() && innerHeight > innerWidth;
export function goView(key, ms, ease) {
  const v = VIEWS.find(x => x[0] === key) || VIEWS[0];
  const box = key === "geral" && narrow() ? [1100, 230, 1620, 1010] : (v[2] || [0, 0, M.w, M.h]);
  return pz.frame(box, ms, undefined, ease);
}

export function focusArea(id) {
  let box = [1180, 230, 1540, 1000];
  if (id === "lazer") box = [1150, 850, 1550, 1010];
  else if (id === "hall") box = [1180, 950, 1500, 1050];
  else if (id.startsWith("andar-")) {
    const num = +id.slice(6);
    const a = D.andares?.find(x => x.num === num);
    if (a) {
      const yMid = a.pin2d[1];
      box = [1160, Math.max(240, yMid - 160), 1540, Math.min(1050, yMid + 160)];
    }
  }
  pz.frame(box, 900, 1.4);
}

export function homeView(ms) { goView("geral", ms) }
export function layout(first) {
  world.classList.add("ready");
  pz.cam.S = Math.max(pz.cam.S, pz.minS());
  if (first) { pz.cam.S = pz.minS(); pz.apply(); intro() }
  else pz.apply();
}

/* ---------- abertura cinematográfica ----------
   0,0s  foto inteira, escurecida, título grande
   0,9s  o título sobe para o cabeçalho e a câmera voa até a torre (expo-out, 2,6 s)
   2,2s  os chamarizes entram em cascata
   Qualquer toque, tecla ou roda interrompe e deixa o usuário no comando. */
/* ---------- voo regional (Google Earth): Costa Esmeralda -> Porto Belo -> Perequê ----------
   Roda uma vez antes da abertura da foto. Pula com o botão, Esc/Enter/Espaço ou toque no vídeo.
   Qualquer falha (sem autoplay, rede lenta, erro) cai direto na abertura normal. */
const VOO_SRC = "media/voo/voo-regiao.mp4", VOO_POSTER = "media/voo/voo-poster.jpg";
const VOO_LEGENDAS = [[0, "Costa Esmeralda"], [1.05, "Porto Belo"], [2.05, "Balneário Perequê"]];
function vooPermitido() {
  if (reduceM() || location.hash.slice(1)) return false;
  const c = navigator.connection;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return false;
  return true;
}
function voo(seguir) {
  const body = document.body;
  body.classList.add("intro", "voo");
  const el = document.createElement("div");
  el.id = "voo"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Voo pela região até o Balneário Perequê");
  el.innerHTML = '<video muted playsinline preload="auto" disablepictureinpicture></video>' +
    '<div class="voo-leg" aria-live="polite"></div>' +
    '<div class="voo-prog" aria-hidden="true"><i></i></div>' +
    '<button type="button" class="voo-skip">Pular voo <span aria-hidden="true">›</span></button>';
  document.body.append(el);
  const v = el.querySelector("video"), leg = el.querySelector(".voo-leg"), bar = el.querySelector(".voo-prog i"), btn = el.querySelector(".voo-skip");
  v.poster = VOO_POSTER;
  let fim = false, ultima = -1, limite;
  const sair = () => {
    if (fim) return; fim = true; clearTimeout(limite);
    removeEventListener("keydown", tecla, true);
    el.classList.add("sai");
    // a abertura da foto começa por baixo enquanto o vídeo se dissolve
    body.classList.remove("voo");
    seguir();
    setTimeout(() => { v.pause(); v.removeAttribute("src"); v.load(); el.remove() }, 1300);
  };
  const tecla = e => { if (["Escape", "Enter", " "].includes(e.key)) { e.preventDefault(); sair() } };
  addEventListener("keydown", tecla, true);
  btn.addEventListener("click", e => { e.stopPropagation(); sair() });
  el.addEventListener("pointerdown", sair);
  v.addEventListener("ended", sair);
  v.addEventListener("error", sair);
  v.addEventListener("timeupdate", () => {
    const t = v.currentTime, d = v.duration || 3;
    bar.style.transform = `scaleX(${Math.min(1, t / d)})`;
    let i = -1; VOO_LEGENDAS.forEach(([s], k) => { if (t >= s) i = k });
    if (i !== ultima && i >= 0) { ultima = i; leg.classList.remove("on"); void leg.offsetWidth; leg.textContent = VOO_LEGENDAS[i][1]; leg.classList.add("on") }
    // dissolve um pouco antes do último quadro (que é parado)
    if (d - t < 0.25) sair();
  });
  // rede lenta / bloqueio: se não começou a tocar em 4,5 s, segue sem o vídeo
  limite = setTimeout(() => { if (v.currentTime < 0.2) sair() }, 4500);
  v.addEventListener("playing", () => { clearTimeout(limite); el.classList.add("tocando") }, { once: true });
  v.src = VOO_SRC;
  const p = v.play(); if (p && p.catch) p.catch(sair);
}

function intro() { if (vooPermitido()) voo(introFoto); else introFoto() }
function introFoto() {
  const body = document.body, hash = location.hash.slice(1);
  const done = () => { body.classList.remove("intro", "intro-go"); body.classList.add("intro-done"); showPins() };
  if (reduceM() || hash) { homeView(1); done(); return }
  body.classList.add("intro");
  // começa perto da torre (retrato: no topo dela) e recua até a visão geral — a foto "respira" atrás do título
  const start = narrow() ? [1150, 250, 1500, 640] : [1020, 300, 1480, 800];
  pz.frame(start, 1, 4);
  let live = true;
  const off = () => { removeEventListener("pointerdown", skip, true); removeEventListener("keydown", skip, true); removeEventListener("wheel", skip, true) };
  const skip = e => { if (!live) return; if (e && e.type === 'pointerdown') { e.stopPropagation(); e.preventDefault(); const eat = ev => { ev.stopPropagation(); ev.preventDefault() }; ['pointerup', 'click', 'mouseup'].forEach(t => addEventListener(t, eat, { capture: true, once: true })) } live = false; clearTimeout(t1); clearTimeout(t2); off(); body.classList.add('intro-go'); goView('geral', 1100, EASE.expoOut); setTimeout(done, 350) };
  addEventListener("pointerdown", skip, true); addEventListener("keydown", skip, true); addEventListener("wheel", skip, true);
  const t1 = setTimeout(() => { if (!live) return; body.classList.add("intro-go"); goView("geral", 2800, EASE.expoOut) }, 1500);
  const t2 = setTimeout(() => { if (!live) return; live = false; off(); done() }, 4500);
}
function showPins() { pins.forEach((p, i) => setTimeout(() => p.el.classList.add("show"), 120 + i * 140)) }
if (!document.body.classList.contains("intro")) pins.forEach(p => p.el.classList.add("show"));

/* ---------- spotlight: o entorno escurece, a torre fica acesa (técnica do véu do Bossa) ---------- */
{
  const defs = document.createElementNS(NS, "defs"), mask = document.createElementNS(NS, "mask"); mask.setAttribute("id", "mm-hole");
  const base = document.createElementNS(NS, "rect"); [["x", -3000], ["y", -3000], ["width", 8000], ["height", 7000]].forEach(([k, v]) => base.setAttribute(k, v)); base.setAttribute("fill", "#fff");
  const holes = document.createElementNS(NS, "g"); holes.setAttribute("fill", "#000"); holes.setAttribute("stroke", "#000"); holes.setAttribute("stroke-width", "3"); holes.setAttribute("stroke-linejoin", "round");
  const hole = poly => { const q = document.createElementNS(NS, "path"); q.setAttribute("d", "M" + poly.map(p => p.join(",")).join("L") + "Z"); holes.append(q) };
  (D.andares || []).forEach(a => hole(a.poly2d)); (D.chamarizes || []).forEach(c => c.poly2d && hole(c.poly2d));
  mask.append(base, holes); defs.append(mask);
  const veil = document.createElementNS(NS, "rect"); [["x", -3000], ["y", -3000], ["width", 8000], ["height", 7000]].forEach(([k, v]) => veil.setAttribute(k, v));
  veil.setAttribute("id", "mm-veil"); veil.setAttribute("fill", "#0a1220"); veil.setAttribute("mask", "url(#mm-hole)");
  svg.prepend(defs, veil);
  const on = () => view.classList.add("spot"), off = () => view.classList.remove("spot");
  svg.addEventListener("pointerover", e => { if (e.target.closest(".h")) on() });
  svg.addEventListener("pointerout", e => { if (e.target.closest(".h")) off() });
}

const img = $("mimg");
const ready = () => { world.classList.add("ready"); layout(true) };
img.complete ? ready() : img.addEventListener("load", ready, { once: true });
addEventListener("resize", () => layout(false));

export { pz, placePins };
