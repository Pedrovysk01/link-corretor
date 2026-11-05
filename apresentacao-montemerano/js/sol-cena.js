// Cena do sol na visão de cima: o disco do sol no céu da foto (nasce e se põe no horizonte das montanhas), a sombra da torre
// e do embasamento no chão, e o céu mudando de cor. Tudo em SVG sobre a foto (#msvg), no espaço do viewBox 1800×1214.
//
// Geometria da foto: a câmera olha para o horizonte (linha das montanhas em y≈HORIZON). O topo da foto aponta para o azimute
// `norte` (mapa.geo). O azimute do sol vira uma posição horizontal no céu: olhando para o azimute AZ_FOTO, um sol a +90° fica
// na borda direita, a −90° na borda esquerda; atrás da câmera (|Δaz| > 100°) o sol fica fora da foto e só a luz e a sombra aparecem.
import { D, $ } from "./data.js";

const NS = "http://www.w3.org/2000/svg";
const M = D.mapa, G = Object.assign({ norte: 55 }, M.geo || {});
const W = M.w, H = M.h;
// silhueta céu/montanhas medida na foto (data/horizonte.json): o sol some atrás dela
const CEU = "M0,0 L0,291 L20,291 L40,291 L60,291 L80,291 L100,291 L120,294 L140,297 L160,302 L180,307 L200,311 L220,312 L240,312 L260,310 L280,308 L300,307 L320,308 L340,309 L360,310 L380,310 L400,311 L420,311 L440,312 L460,312 L480,311 L500,309 L520,305 L540,300 L560,294 L580,290 L600,286 L620,284 L640,282 L660,282 L680,283 L700,284 L720,286 L740,287 L760,288 L780,290 L800,293 L820,295 L840,297 L860,298 L880,299 L900,297 L920,294 L940,292 L960,292 L980,291 L1000,291 L1020,292 L1040,293 L1060,293 L1080,293 L1100,293 L1120,292 L1140,290 L1160,288 L1180,287 L1200,287 L1220,288 L1240,289 L1260,290 L1280,287 L1300,283 L1320,278 L1340,274 L1360,269 L1380,267 L1400,264 L1420,261 L1440,257 L1460,253 L1480,251 L1500,250 L1520,249 L1540,249 L1560,247 L1580,245 L1600,241 L1620,236 L1640,232 L1660,228 L1680,225 L1700,223 L1720,223 L1740,222 L1760,222 L1780,222 L1800,221 L1800,0 Z";
const HORIZ = [[0, 291], [20, 291], [40, 291], [60, 291], [80, 291], [100, 291], [120, 294], [140, 297], [160, 302], [180, 307], [200, 311], [220, 312], [240, 312], [260, 310], [280, 308], [300, 307], [320, 308], [340, 309], [360, 310], [380, 310], [400, 311], [420, 311], [440, 312], [460, 312], [480, 311], [500, 309], [520, 305], [540, 300], [560, 294], [580, 290], [600, 286], [620, 284], [640, 282], [660, 282], [680, 283], [700, 284], [720, 286], [740, 287], [760, 288], [780, 290], [800, 293], [820, 295], [840, 297], [860, 298], [880, 299], [900, 297], [920, 294], [940, 292], [960, 292], [980, 291], [1000, 291], [1020, 292], [1040, 293], [1060, 293], [1080, 293], [1100, 293], [1120, 292], [1140, 290], [1160, 288], [1180, 287], [1200, 287], [1220, 288], [1240, 289], [1260, 290], [1280, 287], [1300, 283], [1320, 278], [1340, 274], [1360, 269], [1380, 267], [1400, 264], [1420, 261], [1440, 257], [1460, 253], [1480, 251], [1500, 250], [1520, 249], [1540, 249], [1560, 247], [1580, 245], [1600, 241], [1620, 236], [1640, 232], [1660, 228], [1680, 225], [1700, 223], [1720, 223], [1740, 222], [1760, 222], [1780, 222], [1800, 221]];
const horizEm = x => { const i = Math.max(0, Math.min(HORIZ.length - 2, Math.floor(x / 20))); const [x0, y0] = HORIZ[i], [x1, y1] = HORIZ[i + 1]; return y0 + (y1 - y0) * Math.max(0, Math.min(1, (x - x0) / 20)) };
const FOV = 175;              // a foto é aérea e larga: o pôr do sol (≈−75° do eixo) cai sobre a serra da esquerda, dentro do quadro               // campo horizontal aproximado da foto, em graus
const AZ_FOTO = G.norte;      // azimute para onde a câmera olha (o topo da foto)
const PX_POR_GRAU_EL = 7;     // perto do horizonte o sol sobe devagar na foto; acima de ~30° sai pelo topo   // quanto o sol sobe por grau de elevação (perspectiva da foto)
// chão (perspectiva): direção na tela para um azimute, achatada na vertical porque a foto é inclinada (~55° de visada)
const ACHATE = 0.55;
const scr = az => { const t = (az - G.norte) * Math.PI / 180; return [Math.sin(t), -Math.cos(t) * ACHATE] };

let layer = null, sky = null, sol = null, brilho = null, halo = null, sombra = null, sombraPodio = null, luzQuente = null;

function el(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e }

export function montarCena(svgPoligonos) {
  if (layer) return;
  const svg = el("svg", { id: "msol", viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" });
  svgPoligonos.before(svg);
  const defs = el("defs", {});
  defs.innerHTML = `
    <radialGradient id="sol-g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffbe8"/><stop offset=".7" stop-color="#ffe29a"/><stop offset="1" stop-color="#ffc25a"/></radialGradient>
    <radialGradient id="brilho-g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2c8" stop-opacity=".95"/><stop offset=".45" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo-g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset=".5" stop-color="#ff9a4a" stop-opacity=".18"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="ceu-g" x1="0" y1="0" x2="0" y2="1"><stop id="ceu-a" offset="0" stop-color="#1a4f9c" stop-opacity="0"/><stop id="ceu-b" offset="1" stop-color="#ffb070" stop-opacity="0"/></linearGradient>
    <linearGradient id="warm-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb060" stop-opacity="0"/><stop id="warm-s" offset="1" stop-color="#ffb060" stop-opacity="0"/></linearGradient>
    <filter id="blur-s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
    <filter id="blur-sol" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>`;
  layer = el("g", { id: "sol-cena", "pointer-events": "none" });
  sky = el("path", { d: CEU, fill: "url(#ceu-g)" });
  halo = el("circle", { r: 180, fill: "url(#halo-g)", opacity: 0 });
  sol = el("circle", { r: 26, fill: "url(#sol-g)", opacity: 0 });
  brilho = el("circle", { r: 60, fill: "url(#brilho-g)", opacity: 0 });
  // montanhas: tudo abaixo do horizonte cobre o sol -> o sol fica num grupo com clip no céu
  const clip = el("clipPath", { id: "ceu-clip" }); clip.append(el("path", { d: CEU }));
  defs.append(clip);
  const chao = el("clipPath", { id: "chao-clip" }); chao.append(el("path", { d: CEU.replace("M0,0 ", `M0,${H} `).replace(/ L1800,0 Z$/, ` L${W},${H} Z`) }));
  defs.append(chao);
  const gSol = el("g", { "clip-path": "url(#ceu-clip)" }); gSol.append(halo, brilho, sol);
  sombra = el("path", { fill: "#07111c", opacity: 0, filter: "url(#blur-s)" });
  sombraPodio = el("path", { fill: "#07111c", opacity: 0, filter: "url(#blur-s)" });
  const gSombra = el("g", { "clip-path": "url(#chao-clip)" }); gSombra.append(sombraPodio, sombra);
  luzQuente = el("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#warm-g)", opacity: 0, style: "mix-blend-mode:screen" });
  layer.append(sky, gSol, gSombra, luzQuente);
  svg.append(defs, layer);
}

const hull = P => { P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const L = [], U = [];
  for (const p of P) { while (L.length >= 2 && cr(L[L.length - 2], L[L.length - 1], p) <= 0) L.pop(); L.push(p) }
  for (const p of P.slice().reverse()) { while (U.length >= 2 && cr(U[U.length - 2], U[U.length - 1], p) <= 0) U.pop(); U.push(p) }
  return L.slice(0, -1).concat(U.slice(0, -1)) };
const path = P => "M" + P.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + "Z";

// pegada da torre no chão (base do prédio na foto) e do embasamento; altura em px da foto
const TORRE_BASE = [[1233, 945], [1381, 987], [1468, 913], [1468, 880], [1381, 950], [1233, 911]]; // pé da torre (4º andar) na foto
const TORRE_H = 600;   // px da base ao topo da torre na foto
const PODIO_BASE = [[1190, 1050], [1236, 978], [1472, 984], [1523, 1000], [1523, 1100], [1190, 1108]];
const PODIO_H = 110;

export function pintarCena(s, hora, dia) {
  if (!layer) return;
  const up = s.el > 0, noite = !up && (hora > dia.set + .3 || hora < dia.rise - .3);
  // ---- sol no céu ----
  let daz = ((s.az - AZ_FOTO) % 360 + 360) % 360; if (daz > 180) daz -= 360;
  const visivel = up && Math.abs(daz) < FOV / 2 + 12;
  const x = W / 2 + (daz / (FOV / 2)) * (W / 2);
  const y = horizEm(Math.max(0, Math.min(W, x))) + 10 - Math.pow(Math.max(0, s.el - 1), 1.1) * PX_POR_GRAU_EL;
  for (const c of [sol, brilho, halo]) { c.setAttribute("cx", x); c.setAttribute("cy", y) }
  const baixo = Math.max(0, 1 - s.el / 18); // perto do horizonte: maior, mais laranja, halo mais forte
  sol.setAttribute("r", 34 + baixo * 26);
  halo.setAttribute("r", 260 + baixo * 260);
  sol.setAttribute("opacity", visivel ? 1 : 0); brilho.setAttribute("opacity", visivel ? 1 : 0); brilho.setAttribute("r", 70 + baixo * 50);
  halo.setAttribute("opacity", visivel ? .6 + baixo * .4 : 0);
  // ---- céu ----
  const ca = $("ceu-a"), cb = $("ceu-b");
  if (noite) { ca.setAttribute("stop-color", "#050a16"); ca.setAttribute("stop-opacity", ".85"); cb.setAttribute("stop-color", "#0b1a2e"); cb.setAttribute("stop-opacity", ".7") }
  else if (s.el < 14) { const k = 1 - Math.max(0, s.el) / 14; ca.setAttribute("stop-color", "#3a5f9f"); ca.setAttribute("stop-opacity", (.3 * k).toFixed(2)); cb.setAttribute("stop-color", "#ff8c45"); cb.setAttribute("stop-opacity", (.7 * k).toFixed(2)) }
  else { ca.setAttribute("stop-opacity", "0"); cb.setAttribute("stop-opacity", "0") }
  // ---- luz quente vinda do lado do sol ----
  const [dx, dy] = scr(s.az);
  const wg = document.getElementById("warm-g");
  wg.setAttribute("x1", (.5 - dx * .6).toFixed(3)); wg.setAttribute("x2", (.5 + dx * .6).toFixed(3)); wg.setAttribute("y1", (.5 - dy * 1.2).toFixed(3)); wg.setAttribute("y2", (.5 + dy * 1.2).toFixed(3));
  const warm = up ? Math.max(0, .5 - s.el / 70) : 0;
  $("warm-s").setAttribute("stop-opacity", warm.toFixed(2)); luzQuente.setAttribute("opacity", up ? 1 : 0);
  // ---- sombras no chão: comprimento = altura / tan(elevação), na direção oposta ao sol ----
  if (!up || s.el < 1.5) { sombra.setAttribute("opacity", 0); sombraPodio.setAttribute("opacity", 0); return }
  const tanE = Math.tan(s.el * Math.PI / 180);
  const L = Math.min(900, TORRE_H / tanE * .75), Lp = Math.min(240, PODIO_H / tanE * .75);
  // a sombra cai no chão, do lado oposto ao sol. Na foto (vista de cima e inclinada), "para o fundo" é para cima da tela;
  // como a câmera está alta, a sombra nunca pode subir pela torre: limita a componente vertical para não ultrapassar o pé do prédio.
  const sx = -dx * L, sy = Math.max(-dy * L, -40);
  const topo = TORRE_BASE.map(p => [p[0] + sx, p[1] + sy]);
  sombra.setAttribute("d", path(hull(TORRE_BASE.concat(topo))));
  // a sombra não deve cobrir a própria torre: fica atrás dos polígonos clicáveis (que não pintam), então tudo bem
  const topoP = PODIO_BASE.map(p => [p[0] - dx * Lp, p[1] - dy * Lp]);
  sombraPodio.setAttribute("d", path(hull(PODIO_BASE.concat(topoP))));
  const op = Math.min(.62, .3 + s.el / 90);
  sombra.setAttribute("opacity", op.toFixed(2)); sombraPodio.setAttribute("opacity", (op * .8).toFixed(2));
}
