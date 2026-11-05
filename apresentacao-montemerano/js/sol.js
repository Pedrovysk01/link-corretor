// Posição solar real para o Villa Montemerano (Balneário Perequê, Porto Belo/SC), com bússola, nascer e pôr do sol,
// e um botão de play que faz o sol percorrer o dia. Na visão de cima a foto muda de tom (manhã, meio-dia, tarde, pôr, noite);
// na maquete 3D a luz e a sombra acompanham o sol (relevo3d.sol3D). Fórmulas da NOAA, com equação do tempo.
import { D, $, reduceM } from "./data.js";
import { IC } from "./icons.js";
import { sol3D, R3 } from "./relevo3d.js";
import { state } from "./state.js";
import { montarCena, pintarCena } from "./sol-cena.js";

const GEO = Object.assign({ lat: -27.14, lon: -48.55, tz: -3, norte: 55 }, D.mapa.geo || {}); // norte: azimute para onde aponta o TOPO da foto
const RAD = Math.PI / 180;

function solar(date, h) {
  const jd = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5 + 2440587.5 + (h - GEO.tz) / 24, T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * .0003032)) % 360, M = 357.52911 + T * (35999.05029 - .0001537 * T), e = .016708634 - T * (.000042037 + .0000001267 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (.004817 + .000014 * T)) + Math.sin(2 * M * RAD) * (.019993 - .000101 * T) + Math.sin(3 * M * RAD) * .000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - .00569 - .00478 * Math.sin(om * RAD);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (.00059 - T * .001813))) / 60) / 60 + .00256 * Math.cos(om * RAD);
  const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lam * RAD)) / RAD, y = Math.tan(eps / 2 * RAD) ** 2;
  const eot = 4 / RAD * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - .5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
  return { dec, eot };
}
export function sunPos(date, h) {
  const { dec, eot } = solar(date, h); const ha = ((h * 60 + eot + 4 * GEO.lon - 60 * GEO.tz + 1440) % 1440) / 4 - 180;
  const el = 90 - Math.acos(Math.sin(GEO.lat * RAD) * Math.sin(dec * RAD) + Math.cos(GEO.lat * RAD) * Math.cos(dec * RAD) * Math.cos(ha * RAD)) / RAD;
  const az = Math.atan2(Math.sin(ha * RAD), Math.cos(ha * RAD) * Math.sin(GEO.lat * RAD) - Math.tan(dec * RAD) * Math.cos(GEO.lat * RAD)) / RAD + 180;
  return { el, az: (az + 360) % 360 };
}
export function sunDay(date) {
  const { dec, eot } = solar(date, 12); const noon = (720 - 4 * GEO.lon - eot + GEO.tz * 60) / 60;
  const ha = Math.acos(Math.cos(90.833 * RAD) / (Math.cos(GEO.lat * RAD) * Math.cos(dec * RAD)) - Math.tan(GEO.lat * RAD) * Math.tan(dec * RAD)) / RAD / 15;
  return { noon, rise: noon - ha, set: noon + ha };
}

const SEASONS = { hoje: ["Hoje", () => new Date()], verao: ["Verão", () => new Date(new Date().getFullYear(), 11, 21)], inverno: ["Inverno", () => new Date(new Date().getFullYear(), 5, 21)] };
let season = "hoje", DATE = SEASONS.hoje[1](), DAY = sunDay(DATE);
const hm = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` };
const dirName = a => ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"][Math.round(((a % 360) + 360) % 360 / 45) % 8];
const scr = az => { const t = (az - GEO.norte) * RAD; return [Math.sin(t), -Math.cos(t)] }; // direção na tela para um azimute
const keyAt = (h, s) => h > DAY.set + .25 || h < DAY.rise - .25 ? "noite" : h > DAY.noon && s.el < 9 ? "por" : h < 9.5 ? "manha" : h < 14 ? "dia" : "tarde";
const GRADES = { manha: "brightness(1.02) saturate(1.06) sepia(.14) contrast(1.03)", dia: "none", tarde: "saturate(1.08) sepia(.1)",
  por: "brightness(.86) saturate(1.35) sepia(.4) contrast(1.06) hue-rotate(-10deg)", noite: "brightness(.34) saturate(.7) sepia(.5) hue-rotate(175deg) contrast(1.15)" };
const LABEL = { manha: "Manhã", dia: "Meio-dia", tarde: "Tarde", por: "Pôr do sol", noite: "Noite" };

function compassSVG(s, size) {
  const c = size / 2, R = size / 2 - 6;
  const nx = c + Math.sin(-GEO.norte * RAD) * (R - 2), ny = c - Math.cos(-GEO.norte * RAD) * (R - 2);
  const up = s.el > 0; const [dx, dy] = scr(s.az); const rr = R * (1 - Math.max(0, s.el) / 90) * .92;
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${R}" fill="${up ? "#f7efe0" : "#1d2a3a"}" stroke="rgba(22,48,46,.25)"/>
    <line x1="${c}" y1="${c}" x2="${nx}" y2="${ny}" stroke="${up ? "#16302e" : "#e7e1d3"}" stroke-width="1.4"/><text x="${nx}" y="${ny - 3}" font-size="${size * .22}" text-anchor="middle" font-family="Figtree,sans-serif" font-weight="600" fill="${up ? "#16302e" : "#e7e1d3"}">N</text>
    ${up ? `<circle cx="${c + dx * rr}" cy="${c + dy * rr}" r="${size * .14}" fill="#e7a23f" stroke="#fff" stroke-width="1.5"/>` : `<circle cx="${c + R * .3}" cy="${c - R * .3}" r="${size * .12}" fill="#e7e1d3"/>`}</svg>`;
}

// ---------- estado e aplicação ----------
state.sun = { h: 12, pos: sunPos(DATE, 12), key: "dia" };
const img = () => $("mimg"), fx = () => $("torre-fx");
let noiteLayer = null;
function setSun(h) {
  const s = sunPos(DATE, h), k = keyAt(h, s), noite = k === "noite";
  state.sun = { h, pos: s, key: k };
  if (img()) img().style.filter = GRADES[k];
  if (fx()) fx().style.filter = GRADES[k];
  document.body.classList.toggle("noite", noite);
  pintarCena(s, h, DAY);
  if (R3.ready) sol3D(s.el, (s.az - GEO.norte + 360) % 360, noite); // na maquete, a frente do prédio aponta para o topo da foto
  const txt = noite ? `Noite · ${hm(h)}` : `${LABEL[k]} · ${hm(h)} · sol de ${dirName(s.az)}`;
  const sub = `Nasce às ${hm(DAY.rise)} (${dirName(sunPos(DATE, DAY.rise + .3).az)}) · põe às ${hm(DAY.set)} (${dirName(sunPos(DATE, DAY.set - .3).az)}) · ${SEASONS[season][0]}`;
  const box = $("sunbox"); if (box) box.innerHTML = compassSVG(s, 34) + `<b>${noite ? "Noite" : hm(h)}</b>`;
  paintBar(h, s, txt, sub);
}

// ---------- barra: play, hora arrastável, época ----------
const H0 = 5, H1 = 20, SX = h => (h - H0) / (H1 - H0) * 360, SY = el => 62 - Math.max(0, el) * .6;
let bar, sky, range, play, out, sub, run = null;
function skyPath() {
  let d = ""; for (let h = H0; h <= H1 + 1e-6; h += .1) { const s = sunPos(DATE, h); d += (d ? "L" : "M") + SX(h).toFixed(1) + " " + SY(s.el).toFixed(1) }
  sky.querySelector(".arc").setAttribute("d", d);
  sky.querySelector(".rise").textContent = `nasce ${hm(DAY.rise)}`; sky.querySelector(".set").textContent = `põe ${hm(DAY.set)}`;
  sky.querySelector(".rise").setAttribute("x", SX(DAY.rise)); sky.querySelector(".set").setAttribute("x", SX(DAY.set));
}
function paintBar(h, s, txt, sb) {
  if (!bar || bar.hidden) return;
  const dot = sky.querySelector(".dot"), up = s.el > 0; dot.setAttribute("cx", SX(h).toFixed(1)); dot.setAttribute("cy", SY(s.el).toFixed(1)); dot.classList.toggle("moon", !up);
  if (document.activeElement !== range) range.value = h; out.textContent = txt; sub.textContent = sb;
  $("sb-compass").innerHTML = compassSVG(s, 52);
}
function stopDay() { if (!run) return; cancelAnimationFrame(run.raf); clearTimeout(run.tm); run = null; play.innerHTML = IC.play; play.setAttribute("aria-label", "Ver o dia passar"); }
function playDay() {
  stopDay(); const from = Math.max(H0, DAY.rise - .4); let h = state.sun.h >= H1 - .05 || state.sun.h < from ? from : state.sun.h;
  play.innerHTML = IC.pause; play.setAttribute("aria-label", "Pausar");
  if (reduceM()) { const hs = [7.25, DAY.noon, 15.25, DAY.set - .33, 20]; let i = 0; run = {}; const step = () => { setSun(hs[i]); if (++i < hs.length) run.tm = setTimeout(step, 1600); else stopDay() }; step(); return }
  const T = 12000 * (H1 - h) / (H1 - from), t0 = performance.now(), h0 = h; let last = 0; run = {};
  const tick = now => { const k = Math.min(1, (now - t0) / T); if (now - last >= 33 || k === 1) { last = now; setSun(h0 + (H1 - h0) * k) } if (k < 1) run.raf = requestAnimationFrame(tick); else stopDay() };
  run.raf = requestAnimationFrame(tick);
}
export function openSun(on) {
  bar.hidden = !on; document.body.classList.toggle("sunopen", on);
  document.querySelectorAll('[data-act="sol"]').forEach(b => b.setAttribute("aria-pressed", on));
  if (on) { skyPath(); setSun(state.sun.h); playDay() } else { stopDay(); setSun(12) }
}
export const sunOpen = () => !!bar && !bar.hidden;

// ---------- montagem ----------
function montar() {
  bar = document.createElement("div"); bar.className = "sunbar"; bar.id = "sunbar"; bar.hidden = true; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Sol ao longo do dia");
  bar.innerHTML = `<button class="sb-play" id="sbplay" aria-label="Ver o dia passar">${IC.play}</button>
    <div class="sb-compass" id="sb-compass" aria-hidden="true"></div>
    <div class="sb-sky"><svg id="sbsky" viewBox="-12 -6 384 86" aria-hidden="true"><line class="hz" x1="-12" y1="62" x2="372" y2="62"/><path class="arc" d=""/><text class="rise" x="0" y="77">nasce</text><text class="set" x="360" y="77">põe</text><circle class="dot" r="7" cx="0" cy="62"/></svg>
      <input type="range" id="sbtime" min="${H0}" max="${H1}" step="0.05" value="12" aria-label="Hora do dia"></div>
    <div class="sb-side"><output id="sbtxt" aria-live="off"></output><small id="sbsub"></small>
      <div class="sb-seasons" role="group" aria-label="Época do ano"><button data-season="hoje" aria-pressed="true">Hoje</button><button data-season="verao" aria-pressed="false">Verão</button><button data-season="inverno" aria-pressed="false">Inverno</button></div></div>
    <button class="x" id="sbx" aria-label="Fechar">×</button>`;
  document.querySelector("main").append(bar);
  montarCena($("msvg"));
  sky = $("sbsky"); range = $("sbtime"); play = $("sbplay"); out = $("sbtxt"); sub = $("sbsub");
  range.addEventListener("input", () => { stopDay(); setSun(+range.value) });
  play.addEventListener("click", () => run ? stopDay() : playDay());
  $("sbx").addEventListener("click", () => openSun(false));
  bar.addEventListener("click", e => { const b = e.target.closest("[data-season]"); if (!b) return; season = b.dataset.season; DATE = SEASONS[season][1](); DAY = sunDay(DATE);
    bar.querySelectorAll("[data-season]").forEach(x => x.setAttribute("aria-pressed", x === b)); skyPath(); const was = !!run; stopDay(); setSun(state.sun.h); if (was) playDay() });
  // botão "Sol" na legenda (ao lado do "i")
  const leg = document.querySelector(".legend");
  if (leg) { const b = document.createElement("button"); b.className = "lsun"; b.id = "sunbox"; b.dataset.act = "sol"; b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-controls", "sunbar"); b.title = "Posição do sol"; leg.insertBefore(b, leg.querySelector("#infobtn")); }
  document.addEventListener("click", e => { if (e.target.closest('[data-act="sol"]')) openSun(bar.hidden) });
  setSun(12);
}
montar();
