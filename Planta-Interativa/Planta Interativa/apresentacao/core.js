/* utilidades: molas, sol, formatação, folha arrastável, telas cheias */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rad = Math.PI / 180, REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (v, d = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const hhmm = h => { const m = Math.round(h * 60); return String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* mola: parte do valor e da velocidade atuais, então é interrompível sem salto (apple-design §3-5) */
function spring(from, to, { response = .4, damping = 1, velocity = 0 } = {}, onUpdate, onDone) {
  if (REDUCED) { onUpdate(to, 0); onDone && onDone(); return () => {}; }
  const w = 2 * Math.PI / response, k = w * w, c = 2 * damping * w;
  let x = from, v = velocity, t0 = performance.now(), raf;
  const step = now => {
    const dt = Math.min(.032, (now - t0) / 1000); t0 = now;
    v += (-k * (x - to) - c * v) * dt; x += v * dt; onUpdate(x, v);
    if (Math.abs(x - to) < .05 && Math.abs(v) < .5) { onUpdate(to, 0); onDone && onDone(); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
}
const project = (v, d = .998) => (v / 1000) * d / (1 - d); // onde um arremesso vai parar
const rubber = (o, dim, c = .55) => (o * dim * c) / (dim + c * Math.abs(o));

/* sol: fórmulas astronômicas padrão, sem API */
const SEASONS = { verao: { m: 12, d: 21, n: "Verão" }, equi: { m: 3, d: 21, n: "Outono · Primavera" }, inverno: { m: 6, d: 21, n: "Inverno" } };
function sunPos(ms, lat, lon) {
  const n = ms / 86400000 + 2440587.5 - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, eps = (23.439 - 4e-7 * n) * rad;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24, H = (gmst * 15 + lon) * rad - ra, ph = lat * rad;
  const el = Math.asin(Math.sin(ph) * Math.sin(dec) + Math.cos(ph) * Math.cos(dec) * Math.cos(H)) / rad;
  const az = (Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(ph) - Math.tan(dec) * Math.cos(ph)) / rad + 180 + 360) % 360;
  return { el, az };
}
const sunAt = (season, h) => { const s = SEASONS[season]; return sunPos(Date.UTC(2026, s.m - 1, s.d) + (h - PROJ.tz) * 3600e3, PROJ.lat, PROJ.lon); };
const FAC_REL = { top: 0, right: 90, bottom: 180, left: 270 };
const facBearing = f => (PROJ.topoPlantaBearing + FAC_REL[f]) % 360;
const lit = (f, s) => s.el > 2 && Math.abs(((s.az - facBearing(f) + 540) % 360) - 180) < 80;
function sunDay(season) { // 5h..20h em passos de 15 min
  const out = []; for (let h = 5; h < 20; h += .25) out.push({ h, s: sunAt(season, h) }); return out;
}
function unitSun(tipo, season) {
  const f = PROJ.tipos[tipo].fachadas, flags = sunDay(season).map(({ s }) => f.some(x => lit(x, s)));
  const hrs = flags.filter(Boolean).length * .25, i0 = flags.indexOf(true), i1 = flags.lastIndexOf(true);
  return { flags, hours: hrs, first: i0 < 0 ? null : 5 + i0 * .25, last: i1 < 0 ? null : 5 + i1 * .25 + .25 };
}
function sunTimes(season) {
  const d = sunDay(season).filter(x => x.s.el > -.8); return d.length ? { rise: d[0].h, set: d[d.length - 1].h + .25 } : { rise: 6, set: 18 };
}
(() => { let best = 0; for (let h = 11; h < 14; h += 1 / 60) best = Math.max(best, sunAt("verao", h).el); // auto-teste do sol
  console.assert(Math.abs(best - (90 - Math.abs(PROJ.lat + 23.44))) < .8, "sol fora do esperado", best); })();

/* contador numérico */
function countUp(el, to, fmt, dur = 1400, pre = "", suf = "") {
  const f = { int: v => Math.round(v).toLocaleString("pt-BR"), pct: v => Math.round(v) + "%", dec: v => num(v, 1), brl: v => brl(v), ord: v => Math.round(v) + "º" }[fmt] || (v => Math.round(v));
  if (REDUCED) { el.textContent = pre + f(to) + suf; return; }
  const t0 = performance.now(); const step = now => { const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + f(to * e) + suf; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* folha arrastável com projeção de velocidade e rubber-band */
class Sheet {
  constructor(el, grab, snaps) { this.el = el; this.snaps = snaps; this.y = 1e4; this.cancel = null; this.state = "closed"; this.vh = 0;
    const down = e => { if (e.target.closest("button")) return; this.cancel && this.cancel(); grab.setPointerCapture(e.pointerId); this.t = [[e.clientY, performance.now()]]; this.y0 = this.y; this.py = e.clientY; this.drag = true; };
    const move = e => { if (!this.drag) return; this.t.push([e.clientY, performance.now()]); if (this.t.length > 6) this.t.shift();
      let ny = this.y0 + (e.clientY - this.py); const lo = this.pos("open"), hi = this.pos("closed");
      if (ny < lo) ny = lo - rubber(lo - ny, 300); this.set(ny); };
    const up = e => { if (!this.drag) return; this.drag = false; const a = this.t[0], b = this.t[this.t.length - 1], dt = Math.max(16, b[1] - a[1]);
      const v = (b[0] - a[0]) / dt * 1000, end = this.y + project(v); this.to(this.nearest(end), v); };
    grab.addEventListener("pointerdown", down); grab.addEventListener("pointermove", move); grab.addEventListener("pointerup", up); grab.addEventListener("pointercancel", up);
  }
  pos(n) { const h = this.el.offsetHeight; return n === "open" ? 0 : n === "peek" ? Math.max(0, h - this.snaps.peek) : h + 260; }
  nearest(y) { return ["open", "peek", "closed"].map(n => [Math.abs(this.pos(n) - y), n]).sort((a, b) => a[0] - b[0])[0][1]; }
  set(y) { this.y = y; this.el.style.transform = `translateY(${y}px)`; }
  to(name, v = 0) { this.state = name; this.cancel && this.cancel(); this.el.style.visibility = "visible";
    this.cancel = spring(this.y, this.pos(name), { response: .38, damping: name === "closed" ? 1 : .86, velocity: v }, y => this.set(y), () => { if (name === "closed") this.el.style.visibility = "hidden"; }); }
  open(name = "open") { if (this.y > 1e3) { this.el.style.visibility = "visible"; this.set(this.pos("closed")); } this.to(name); }
}

/* telas cheias */
function openFull(el) { el.classList.add("on"); requestAnimationFrame(() => el.classList.add("in")); }
function closeFull(el) { el.classList.remove("in"); setTimeout(() => el.classList.remove("on"), 300); }
$$("[data-close]").forEach(b => b.onclick = () => closeFull(b.closest(".full")));

let galCur = 0, galFilter = "Todas";
function openLB(i) { galCur = (i + GALERIA.length) % GALERIA.length; $("#lb").classList.add("on"); $("#lbimg").src = "media/" + GALERIA[galCur][0] + ".jpg"; $("#lbcap").textContent = GALERIA[galCur][1] + " · imagem ilustrativa"; }
function closeLB() { $("#lb").classList.remove("on"); }
$("#lbx").onclick = closeLB; $("#lbp").onclick = () => openLB(galCur - 1); $("#lbn").onclick = () => openLB(galCur + 1);
$("#lb").onclick = e => e.target.id === "lb" && closeLB();
addEventListener("keydown", e => { if ($("#lb").classList.contains("on")) { if (e.key === "Escape") closeLB(); if (e.key === "ArrowLeft") openLB(galCur - 1); if (e.key === "ArrowRight") openLB(galCur + 1); }
  else if (e.key === "Escape") $$(".full.on").forEach(closeFull); });
let tx = 0; $("#lb").addEventListener("touchstart", e => tx = e.touches[0].clientX, { passive: true });
$("#lb").addEventListener("touchend", e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) openLB(galCur + (d < 0 ? 1 : -1)); });
function buildGallery() {
  $("#gtabs").innerHTML = ["Todas", "Fachada", "Lazer", "Apartamento"].map(c => `<button class="chip ${c === galFilter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
  $$("#gtabs .chip").forEach(b => b.onclick = () => { galFilter = b.dataset.c; buildGallery(); });
  $("#ggrid").innerHTML = GALERIA.map((g, i) => [g, i]).filter(([g]) => galFilter === "Todas" || g[2] === galFilter)
    .map(([g, i]) => `<button class="gi" data-i="${i}"><img src="media/${g[0]}.jpg" alt="${g[1]}" loading="lazy"><span>${g[1]}</span></button>`).join("");
  $$("#ggrid .gi").forEach(b => b.onclick = () => openLB(+b.dataset.i));
}
function buildLazer() {
  const w = $("#lzwrap"); LAZER.forEach(([n, a, x, y], i) => { const b = document.createElement("button"); b.className = "pin"; b.textContent = i + 1; b.title = n;
    b.style.cssText = `left:${((x - 497) / 1459 * 100).toFixed(2)}%;top:${((y - 79) / 1272 * 100).toFixed(2)}%`; b.onclick = () => selLazer(i); w.appendChild(b); });
  $("#lzlist").innerHTML = LAZER.map(([n, a], i) => `<li><button data-i="${i}"><b>${i + 1}</b> ${n}<em>${num(a)} m²</em></button></li>`).join("");
  $$("#lzlist button").forEach(b => b.onclick = () => selLazer(+b.dataset.i)); selLazer(6);
}
function selLazer(i) { const [n, a, , , g] = LAZER[i];
  $$("#lzwrap .pin").forEach((p, k) => p.classList.toggle("sel", k === i)); $$("#lzlist button").forEach(b => b.classList.toggle("sel", +b.dataset.i === i));
  $("#lzcard").innerHTML = `<img src="media/${g}.jpg" alt="${n}"><div><b>${n}</b><span>${num(a)} m²</span></div>`;
  $("#lzcard img").onclick = () => { const k = GALERIA.findIndex(x => x[0] === g); if (k >= 0) openLB(k); }; }
buildGallery(); buildLazer();
