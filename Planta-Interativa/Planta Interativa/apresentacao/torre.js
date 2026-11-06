/* cena do projeto: o render oficial da torre, com andares, hora do dia e sol interativos */
const IMGW = 1600, IMGH = 2250, ASPECT = IMGW / IMGH;
const NF = PROJ.pavFim - PROJ.pavIni + 1;
const TS = { d: "Disponível", r: "Reservado", v: "Vendido" };
const UN = (f, t) => PROJ.units[f + "-" + t];
const NOME = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
const rumo = a => NOME[Math.round(a / 22.5) % 16];
const TS_COL = { d: "#6fd6c8", r: "#f0b44c", v: "#8b90b8" };
const SKY = ["manha", "dia", "tarde", "noite"];
const T = { season: "verao", hour: 12, floor: null, tipo: null, only: false, playing: false, sky: "dia" };
let rsheet, rv = { s: 1, min: 1, tx: 0, ty: 0, w0: 0, h0: 0, L0: 0, cancel: null, vel: null }, ready = false, playRaf = 0;

/* calibração dos andares sobre o render (coordenadas do JPG 1600x2250): fachada frontal + lateral */
const FL = { xl: 472, xc: 892, xr: 1088, yl0: 1576, yl: 68.8, yc0: 1496, yc: 86, yf0: 1504, yf: 49.1 };
const yL = k => FL.yl0 - FL.yl * k, yC = k => FL.yc0 - FL.yc * k, yF = k => FL.yf0 - FL.yf * k;
function floorPolys(f) {
  const k = f - PROJ.pavIni;
  return [[[FL.xl, yL(k + 1)], [FL.xc, yC(k + 1)], [FL.xc, yC(k)], [FL.xl, yL(k)]], [[FL.xc, yC(k + 1)], [FL.xr, yF(k + 1)], [FL.xr, yF(k)], [FL.xc, yC(k)]]];
}
const pts = p => p.map(q => q.join(",")).join(" ");
const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) c = !c; return c; };
const floorAt = (u, v) => { for (let f = PROJ.pavIni; f <= PROJ.pavFim; f++) if (floorPolys(f).some(p => inPoly(u, v, p))) return f; return null; };
const freeOn = f => Object.keys(PROJ.tipos).filter(t => UN(f, t).status === "d").length;

/* estágio: tamanho e posição */
function layout() {
  const vw = innerWidth, vh = innerHeight, h0 = vh, w0 = h0 * ASPECT, fit = w0 > vw ? vw / w0 : 1;
  rv.w0 = w0 * fit; rv.h0 = h0 * fit; rv.min = Math.max(1, vh / rv.h0); rv.L0 = (vw - rv.w0) / 2; rv.top0 = (vh - rv.h0) / 2;
  const st = $("#rstage"); st.style.width = rv.w0 + "px"; st.style.height = rv.h0 + "px"; st.style.left = rv.L0 + "px"; st.style.top = rv.top0 + "px"; st.style.marginLeft = 0;
  clampView(); applyView();
}
function bounds(s) {
  const vw = innerWidth, vh = innerHeight, w = rv.w0 * s, h = rv.h0 * s;
  return { x: w <= vw ? [vw / 2 - rv.L0 - w / 2, vw / 2 - rv.L0 - w / 2] : [vw - rv.L0 - w, -rv.L0], y: h <= vh ? [vh / 2 - rv.top0 - h / 2, vh / 2 - rv.top0 - h / 2] : [vh - rv.top0 - h, -rv.top0] };
}
function clampView() { const b = bounds(rv.s); rv.tx = clamp(rv.tx, ...b.x); rv.ty = clamp(rv.ty, ...b.y); }
function applyView() { $("#rstage").style.transform = `translate(${rv.tx}px,${rv.ty}px) scale(${rv.s})`; }
function viewTo(s, tx, ty, resp = .9) { // voo de câmera interrompível: parte do estado atual
  rv.cancel && rv.cancel(); const s0 = rv.s, x0 = rv.tx, y0 = rv.ty; s = clamp(s, rv.min, 4); const b = bounds(s); tx = clamp(tx, ...b.x); ty = clamp(ty, ...b.y);
  rv.cancel = spring(0, 1, { response: resp, damping: 1 }, k => { rv.s = s0 + (s - s0) * k; rv.tx = x0 + (tx - x0) * k; rv.ty = y0 + (ty - y0) * k; applyView(); });
}
const toImg = (cx, cy) => { const r = $("#rstage").getBoundingClientRect(); return [(cx - r.left) / r.width * IMGW, (cy - r.top) / r.height * IMGH]; };
function zoomAt(cx, cy, ns) { ns = clamp(ns, rv.min, 4); const k = ns / rv.s, r = $("#rstage").getBoundingClientRect(), ox = cx - r.left, oy = cy - r.top;
  rv.tx -= ox * (k - 1); rv.ty -= oy * (k - 1); rv.s = ns; clampView(); applyView(); }
function focusFloor(f) { // câmera até o andar, deixando espaço para a folha
  const k = f - PROJ.pavIni, u = (FL.xl + FL.xc) / 2 + 60, v = (yL(k + .5) + yC(k + .5)) / 2, s = innerWidth > 900 ? 2.6 : 2.2, sx = rv.w0 / IMGW, sy = rv.h0 / IMGH;
  const cxScreen = innerWidth > 900 ? innerWidth * .36 : innerWidth / 2, cyScreen = innerWidth > 900 ? innerHeight / 2 : innerHeight * .3;
  viewTo(s, cxScreen - rv.L0 - s * u * sx, cyScreen - rv.top0 - s * v * sy, 1.0);
}
function resetView() { const b = bounds(rv.min); viewTo(rv.min, b.x[0], b.y[0], .9); }

/* céu / hora do dia */
function skyFor(h) { const t = sunTimes(T.season); return h < 9.5 ? "manha" : h < t.set - 1.4 ? "dia" : h < t.set + .4 ? "tarde" : "noite"; }
function setSky(n) { T.sky = n; $$("#rstage img").forEach(i => i.classList.toggle("on", i.dataset.s === n)); $("#tback").src = $(`#rstage img[data-s="${n}"]`).src; }
function applyHour() {
  const s = sunAt(T.season, T.hour), t = sunTimes(T.season); setSky(skyFor(T.hour));
  $("#hud").innerHTML = `<b>${hhmm(T.hour)} · ${SEASONS[T.season].n}</b><span>${s.el > 0 ? `Sol a ${Math.round(s.el)}° de altura, vindo de ${rumo(s.az)}.` : "Sol abaixo do horizonte."} Nasce às ${hhmm(t.rise)} e se põe às ${hhmm(t.set)}.</span>
    <div class="legend"><span><i style="background:#6fd6c8"></i>Disponível</span><span><i style="background:#f0b44c"></i>Reservado</span><span><i style="background:#8b90b8"></i>Vendido</span></div>`;
  $$("#pbar [data-h]").forEach(b => b.classList.toggle("on", !T.playing && b.dataset.k === T.sky));
}
const HOURS = () => { const t = sunTimes(T.season); return { manha: 7.5, dia: 12, tarde: +(t.set - .8).toFixed(2), noite: 21.5 }; };

/* sobreposição dos andares */
function paintOverlay(hover) {
  const g = $("#rover"); let h = "";
  const draw = (f, cls) => floorPolys(f).forEach(p => h += `<polygon class="${cls}" points="${pts(p)}"/>`);
  if (hover && hover !== T.floor) draw(hover, "fh");
  if (T.floor) draw(T.floor, "fs");
  if (T.only) for (let f = PROJ.pavIni; f <= PROJ.pavFim; f++) if (freeOn(f)) floorPolys(f).forEach(p => h += `<polygon class="fa" points="${pts(p)}"/>`);
  g.innerHTML = `<defs><filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>` + h;
}

/* folha: andar, planta e ficha */
function selectFloor(f, tipo = null) {
  T.floor = f; T.tipo = tipo; paintOverlay(); $$("#floors button").forEach(b => b.classList.toggle("on", +b.dataset.f === f)); focusFloor(f); sheetRender(); rsheet.open("peek");
}
function selectUnit(f, t) { T.floor = f; T.tipo = t; paintOverlay(); $$("#floors button").forEach(b => b.classList.toggle("on", +b.dataset.f === f)); if (rv.s < 1.5) focusFloor(f); sheetRender(); rsheet.open("peek"); }
const seaFacing = t => PROJ.tipos[t].fachadas.includes("bottom");
function sheetRender() {
  const f = T.floor, free = freeOn(f), t = T.tipo;
  let h = `<div class="eyebrow">${f}º pavimento</div><h3>${f}º andar</h3><div class="row"><span class="dim">${free} de 6 disponíveis · toque em um apartamento da planta</span></div>
    <div class="plan" id="plan"><img src="media/planta-tipo.jpg" alt="Planta do pavimento tipo">${Object.entries(PROJ.tipos).map(([k, v]) => { const u = UN(f, k); return `<button data-t="${k}" data-s="${u.status}" class="${t === k ? "sel" : ""}" style="left:${v.box[0]}%;top:${v.box[1]}%;width:${v.box[2] - v.box[0]}%;height:${v.box[3] - v.box[1]}%" aria-label="Apartamento ${f}${k}"><span>${k}</span></button>`; }).join("")}</div>`;
  if (t) h += ficha(f, t);
  $("#sbody").innerHTML = h;
  $$("#plan button").forEach(b => b.onclick = () => { T.tipo = b.dataset.t; sheetRender(); const sb = $("#sbody"); setTimeout(() => sb.scrollTo({ top: sb.querySelector(".fk") ? sb.querySelector(".fk").offsetTop - 12 : 0, behavior: REDUCED ? "auto" : "smooth" }), 60); });
  const fl = $$("#sbody .flow button"); window.__segs && fl.forEach(b => b.onclick = () => { const s = window.__segs[+b.dataset.i]; fl.forEach(x => x.classList.toggle("on", x === b)); $("#pinfo").innerHTML = `<b>${s[0]} · ${brl2(s[3])}</b><br><span class="dim">${s[4]} · ${Math.round(s[1] * 100)}% do valor</span>`; });
  const bv = $("#b-vista"); bv && (bv.onclick = () => { openVista(f, t); rsheet.to("closed"); });
}
function ficha(f, t) {
  const u = UN(f, t), v = PROJ.tipos[t], sn = unitSun(t, T.season), pg = PROJ.pagamento, price = u.price;
  const segs = window.__segs = [["Entrada", pg.entrada, "#caa86b", price * pg.entrada, "no ato"], ["Início da obra", pg.obra, "#e6cf9e", price * pg.obra, "no início da obra"], ["Reforços", pg.reforcoPct, "#6fd6c8", price * pg.reforcoPct, `${pg.reforcoParcelas}x de ${brl2(price * pg.reforcoPct / pg.reforcoParcelas)}`],
    ["Chaves", pg.chaves, "#9db4ff", price * pg.chaves, "na entrega"], ["Saldo", pg.saldoPct, "#c8bdf5", price * pg.saldoPct, `${pg.saldoParcelas}x de ${brl2(price * pg.saldoPct / pg.saldoParcelas)}`]];
  const msg = encodeURIComponent(`Olá! Tenho interesse no ${PROJ.nome} ${PROJ.sub}: apartamento ${f}${t} (${num(v.area)} m²), ${f}º pavimento. Podemos conversar?`);
  return `<div class="fk" style="margin-top:20px"><div class="eyebrow">Tipo ${t}</div><h3>Apartamento ${f}${t}</h3>
    <div class="row"><span class="badge s-${u.status}">${TS[u.status]}</span><span class="dim">${num(v.area)} m² · 2 suítes · lavabo · sacada integrada</span></div>
    <div class="big">${u.status === "v" ? "Unidade vendida" : brl(price)}</div><div class="dim">Valor de referência${u.status === "v" ? "" : ` · ${brl(price / v.area)}/m²`}</div>
    <div class="eyebrow" style="margin-top:18px">Sol direto · ${SEASONS[T.season].n}</div>
    <div class="row" style="margin-top:4px"><b style="font:500 30px var(--serif)">${sn.hours ? num(sn.hours, 1) + " h" : "—"}</b><span class="dim">${sn.hours ? `${hhmm(sn.first)} às ${hhmm(sn.last)}` : "sem sol direto"}</span></div>
    <div class="spark">${sn.flags.map(x => `<i class="${x ? "l" : ""}"></i>`).join("")}</div><div class="dim"><span>05h</span><span>12h</span><span>20h</span></div>
    ${u.status === "v" ? "" : `<div class="pay"><div class="eyebrow">Condição de pagamento · correção ${pg.indice}</div>
    <div class="flow">${segs.map((s, i) => `<button style="--w:${s[1] * 100};--c:${s[2]}" data-i="${i}" aria-label="${s[0]}">${Math.round(s[1] * 100)}%</button>`).join("")}</div>
    <div class="pinfo" id="pinfo">Toque em um trecho para ver os valores.</div></div>`}
    ${seaFacing(t) ? `<button class="chip on" id="b-vista" style="width:100%;padding:13px;font-size:14px">Ver a vista do mar deste andar</button>` : ""}
    <a class="wa" target="_blank" rel="noopener" href="https://wa.me/${PROJ.whatsapp}?text=${msg}">Tenho interesse neste apartamento</a>
    <p class="dim" style="margin-top:14px">Valores e disponibilidade de referência. Imagens e plantas ilustrativas.</p></div>`;
}

/* vista do mar (panorama que se arrasta) */
const V = { x: 0, w: 0, cancel: null, drag: null, open: false };
function vistaBounds() { const img = $("#pano-d"), vh = innerHeight * 1.14; V.w = img.naturalWidth ? img.naturalWidth / img.naturalHeight * vh : innerWidth * 2; return [Math.min(0, innerWidth - V.w), 0]; }
function vistaApply() { $("#pano").style.transform = `translate3d(${V.x}px,0,0)`; }
function openVista(f, t) {
  const el = sunAt(T.season, T.hour).el, night = clamp((8 - el) / 10, 0, 1), d = $("#pano-d"), n = $("#pano-n"), vh = innerHeight * 1.14;
  d.src = "media/ai/vista-dia.jpg"; n.src = "media/ai/vista-noite.jpg"; d.style.height = n.style.height = vh + "px"; n.style.opacity = night;
  $("#pano").style.top = (-(innerHeight * .14) * ((f - PROJ.pavIni) / (NF - 1))) + "px"; $("#vcap").textContent = `Vista do ${f}º andar · lado do mar`;
  const start = () => { const [lo] = vistaBounds(); V.x = lo / 2; vistaApply(); }; d.complete && d.naturalWidth ? start() : d.addEventListener("load", start, { once: true });
  $("#vista").classList.add("on"); V.open = true; stopPlay();
}
function closeVista() { $("#vista").classList.remove("on"); V.open = false; V.cancel && V.cancel(); }
(() => { const v = $("#vista"); let hist = [];
  v.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; V.cancel && V.cancel(); v.setPointerCapture(e.pointerId); V.drag = { x0: e.clientX, p0: V.x }; hist = [[e.clientX, performance.now()]]; });
  v.addEventListener("pointermove", e => { if (!V.drag) return; hist.push([e.clientX, performance.now()]); if (hist.length > 6) hist.shift(); const [lo, hi] = vistaBounds(); let x = V.drag.p0 + e.clientX - V.drag.x0;
    if (x > hi) x = hi + rubber(x - hi, 400); else if (x < lo) x = lo - rubber(lo - x, 400); V.x = x; vistaApply(); });
  const up = () => { if (!V.drag) return; V.drag = null; const a = hist[0], b = hist[hist.length - 1], vel = (b[0] - a[0]) / Math.max(16, b[1] - a[1]) * 1000, [lo, hi] = vistaBounds();
    V.cancel = spring(V.x, clamp(V.x + project(vel), lo, hi), { response: .55, damping: .9, velocity: vel }, x => { V.x = x; vistaApply(); }); };
  v.addEventListener("pointerup", up); v.addEventListener("pointercancel", up);
  $("#vback").onclick = closeVista; addEventListener("keydown", e => { if (e.key === "Escape" && V.open) closeVista(); }); })();

/* controles */
function startPlay() { T.playing = true; $("#b-play").classList.add("on"); $$("#pbar [data-h]").forEach(b => b.classList.remove("on")); const t = sunTimes(T.season), from = t.rise - .2, to = t.set + 1.6, t0 = performance.now();
  const step = now => { if (!T.playing) return; const h = from + (to - from) * ((now - t0) / 16000); T.hour = h; applyHour(); if (h >= to) { stopPlay(); T.hour = 12; applyHour(); return; } playRaf = requestAnimationFrame(step); }; playRaf = requestAnimationFrame(step); }
function stopPlay() { T.playing = false; cancelAnimationFrame(playRaf); const b = $("#b-play"); b && b.classList.remove("on"); }
function buildUi() {
  const bar = $("#pbar"); const hs = HOURS();
  bar.innerHTML = [["manha", "Manhã"], ["dia", "Meio-dia"], ["tarde", "Fim de tarde"], ["noite", "Noite"]].map(([k, n]) => `<button class="chip" data-h="${hs[k]}" data-k="${k}">${n}</button>`).join("")
    + `<button class="chip" id="b-play">▶ Dia todo</button><i class="sep"></i><button class="chip" id="b-season">${SEASONS[T.season].n}</button><button class="chip" id="b-only">Só disponíveis</button><i class="sep"></i><button class="chip" id="b-fit">Torre inteira</button>`;
  $$("#pbar [data-h]").forEach(b => b.onclick = () => { stopPlay(); T.hour = +HOURS()[b.dataset.k]; applyHour(); });
  $("#b-play").onclick = () => T.playing ? stopPlay() : startPlay();
  $("#b-only").onclick = e => { T.only = !T.only; e.currentTarget.classList.toggle("on", T.only); paintOverlay(); };
  $("#b-season").onclick = e => { const ks = Object.keys(SEASONS); T.season = ks[(ks.indexOf(T.season) + 1) % ks.length]; e.currentTarget.textContent = SEASONS[T.season].n; applyHour(); if (T.tipo) sheetRender(); };
  $("#b-fit").onclick = () => { resetView(); };
  $("#floors").innerHTML = Array.from({ length: NF }, (_, i) => PROJ.pavFim - i).map(f => `<button data-f="${f}" class="${freeOn(f) ? "" : "none"}" title="${freeOn(f)} disponíveis">${f}<i></i></button>`).join("");
  $$("#floors button").forEach(b => b.onclick = () => selectFloor(+b.dataset.f));
  $("#b-lazer").onclick = () => openFull($("#f-lazer")); $("#b-gal").onclick = () => openFull($("#f-gal"));
  rsheet = new Sheet($("#sheet"), $("#grab"), { peek: 380 }); $("#sheetx").onclick = () => { rsheet.to("closed"); T.tipo = null; };
}
function gestures() {
  const st = $("#rview"), pts = new Map(); let last = null, hist = [], pinch = 0, moved = 0, tip = $("#rtip");
  st.addEventListener("pointerdown", e => { rv.cancel && rv.cancel(); st.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; last = [e.clientX, e.clientY]; hist = [[e.clientX, e.clientY, performance.now()]];
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } stopPlay(); });
  st.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) { const [u, v] = toImg(e.clientX, e.clientY), f = floorAt(u, v); paintOverlay(f); st.style.cursor = f ? "pointer" : "grab";
      if (f) { tip.hidden = false; tip.textContent = `${f}º andar · ${freeOn(f)} disponíveis`; tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px"; } else tip.hidden = true; return; }
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, rv.s * d / pinch); pinch = d; moved = 99; return; }
    const dx = e.clientX - last[0], dy = e.clientY - last[1]; moved += Math.abs(dx) + Math.abs(dy); last = [e.clientX, e.clientY]; hist.push([e.clientX, e.clientY, performance.now()]); if (hist.length > 6) hist.shift();
    const b = bounds(rv.s); let nx = rv.tx + dx, ny = rv.ty + dy;
    nx = nx > b.x[1] ? b.x[1] + rubber(nx - b.x[1], 300) * .6 : nx < b.x[0] ? b.x[0] - rubber(b.x[0] - nx, 300) * .6 : nx; ny = ny > b.y[1] ? b.y[1] + rubber(ny - b.y[1], 300) * .6 : ny < b.y[0] ? b.y[0] - rubber(b.y[0] - ny, 300) * .6 : ny;
    rv.tx = nx; rv.ty = ny; applyView(); });
  const up = e => { const was = pts.size; pts.delete(e.pointerId); if (was !== 1) return;
    if (moved < 8) { const [u, v] = toImg(e.clientX, e.clientY), f = floorAt(u, v); if (f) selectFloor(f); return; }
    const a = hist[0], c = hist[hist.length - 1], dt = Math.max(16, c[2] - a[2]), vx = (c[0] - a[0]) / dt * 1000, vy = (c[1] - a[1]) / dt * 1000, b = bounds(rv.s);
    const tx = clamp(rv.tx + project(vx), ...b.x), ty = clamp(rv.ty + project(vy), ...b.y), x0 = rv.tx, y0 = rv.ty;
    rv.cancel = spring(0, 1, { response: .6, damping: .92 }, k => { rv.tx = x0 + (tx - x0) * k; rv.ty = y0 + (ty - y0) * k; applyView(); }); };
  st.addEventListener("pointerup", up); st.addEventListener("pointercancel", e => pts.delete(e.pointerId)); st.addEventListener("pointerleave", () => { tip.hidden = true; paintOverlay(); });
  st.addEventListener("wheel", e => { e.preventDefault(); rv.cancel && rv.cancel(); zoomAt(e.clientX, e.clientY, rv.s * Math.exp(-e.deltaY * .0016)); }, { passive: false });
  st.addEventListener("dblclick", e => { rv.s > rv.min * 1.4 ? resetView() : (() => { const ns = 2.4, r = $("#rstage").getBoundingClientRect(), k = ns / rv.s; viewTo(ns, rv.tx - (e.clientX - r.left) * (k - 1), rv.ty - (e.clientY - r.top) * (k - 1), .8); })(); });
}

SCENES.projeto = {
  enter() {
    if (!ready) { ready = true; buildUi(); gestures(); addEventListener("resize", () => { layout(); }); }
    layout(); rv.s = rv.min; { const b = bounds(rv.min); rv.tx = b.x[0]; rv.ty = b.y[0]; } clampView(); applyView(); applyHour(); paintOverlay();
  },
  leave() { stopPlay(); rsheet && rsheet.to("closed"); closeVista(); }
};
if (typeof cur !== "undefined" && cur === "projeto") SCENES.projeto.enter();
window.__pj = { selectFloor, selectUnit, openVista, T, setSky, applyHour, viewTo, paintOverlay, FL };
