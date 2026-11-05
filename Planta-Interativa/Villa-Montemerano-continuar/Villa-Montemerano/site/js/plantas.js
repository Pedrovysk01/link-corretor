// Plantas oficiais em tela cheia, com pan/zoom como mapa, zonas clicáveis e pins dos ambientes do lazer.
import { D, $, esc, reduceM } from "./data.js";
import { panzoom } from "./panzoom.js";
import { select } from "./ficha.js";
import { openExpKey } from "./exp.js";

const NS = "http://www.w3.org/2000/svg";
const pl = $("pl"), world = $("plworld"), img = $("plimg"), svg = $("plsvg"), pinsEl = $("plpins"), tabs = $("pl-tabs");
const P = D.plantas, ROOMS = { a116: "Apartamento 116,60 m²", a128: "Apartamento 128,60 m²" };
let pz = null, pins = [], from = null, cur = "tipo", view = $("plview");

tabs.innerHTML = Object.entries(P).map(([k, v]) => `<button class="chip" data-pl="${k}" aria-pressed="false">${esc(v.titulo)}</button>`).join("");

function place(cam) {
  for (const q of pins) { q.el.style.transform = `translate(${cam.TX + q.u * cam.S}px,${cam.TY + q.v * cam.S}px) translate(-50%,-50%)` }
}
// o controlador lê largura/altura na criação; ao trocar de planta recria-se a vista (sem ouvintes antigos)
function controller(p) {
  const fresh = view.cloneNode(false); fresh.append(world); view.replaceWith(fresh); view = fresh;
  world.style.width = p.w + "px"; world.style.height = p.h + "px";
  pz = panzoom(view, world, { w: p.w, h: p.h, fit: "contain", max: 4, reduce: reduceM, pad: () => ({ t: 84, b: 56, l: 12, r: 12 }), onChange: place });
  $("plin").onclick = () => pz.zoomAt(1.5, innerWidth / 2, innerHeight / 2);
  $("plout").onclick = () => pz.zoomAt(1 / 1.5, innerWidth / 2, innerHeight / 2);
}
function content(key) {
  const p = P[key];
  svg.setAttribute("viewBox", `0 0 ${p.w} ${p.h}`); svg.style.width = p.w + "px"; svg.style.height = p.h + "px"; svg.innerHTML = ""; pinsEl.innerHTML = ""; pins = [];
  $("pl-hint").textContent = key === "tipo"
    ? "Toque em um apartamento para ver a ficha. Arraste e use a roda do mouse para aproximar."
    : "Toque em um ambiente para ver as imagens. Arraste e use a roda do mouse para aproximar.";
  const pin = (txt, u, v, fn) => { const el = document.createElement("button"); el.className = "pin"; el.type = "button"; el.textContent = txt; el.onclick = fn; pinsEl.append(el); pins.push({ el, u, v }) };
  if (key === "tipo") {
    for (const z of p.zonas) {
      const [x0, y0, x1, y1] = z.rect, r = document.createElementNS(NS, "rect"), go = () => { closePlanta(); select(z.apto) };
      r.setAttribute("x", x0 * p.w); r.setAttribute("y", y0 * p.h); r.setAttribute("width", (x1 - x0) * p.w); r.setAttribute("height", (y1 - y0) * p.h);
      r.setAttribute("class", "zona"); r.setAttribute("tabindex", "0"); r.setAttribute("role", "button"); r.setAttribute("aria-label", ROOMS[z.apto] + ": ver ficha");
      r.addEventListener("click", e => { e.stopPropagation(); go() });
      r.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go() } });
      svg.append(r); pin(ROOMS[z.apto], (x0 + x1) / 2 * p.w, 0.52 * p.h, go);
    }
  } else {
    for (const q of D.lazerPins) pin(q.n + (q.m2 ? " · " + q.m2 + " m²" : ""), q.p[0] * p.w, q.p[1] * p.h, () => { closePlanta(); openExpKey(q.id) });
  }
}
function mount(key) {
  const p = P[key]; cur = key;
  tabs.querySelectorAll("[data-pl]").forEach(b => b.setAttribute("aria-pressed", b.dataset.pl === key));
  $("pl-title").textContent = p.titulo; img.alt = "Planta oficial: " + p.titulo;
  controller(p); content(key);
  const fit = () => { pz.cam.S = pz.minS(); pz.apply() };
  img.onload = fit; img.src = p.src; if (img.complete && img.naturalWidth) fit();
}
export function openPlanta(key = "tipo") {
  from = document.activeElement; pl.hidden = false; document.body.classList.add("plopen");
  mount(key); requestAnimationFrame(() => pl.classList.add("on")); $("pl-x").focus({ preventScroll: true });
}
export function closePlanta() {
  if (pl.hidden) return;
  pl.classList.remove("on"); document.body.classList.remove("plopen"); setTimeout(() => { pl.hidden = true }, 250);
  from?.focus?.({ preventScroll: true }); from = null;
}
tabs.addEventListener("click", e => { const b = e.target.closest("[data-pl]"); if (b) mount(b.dataset.pl) });
$("pl-x").onclick = closePlanta;
addEventListener("resize", () => { if (!pl.hidden && pz) { pz.cam.S = Math.max(pz.cam.S, pz.minS()); pz.apply() } });
export const plOpen = () => !pl.hidden;
export const plCurrent = () => cur;
