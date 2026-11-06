// Dados do mapa: lidos de data/units.json e data/content.json e preparados para o resto do app.
let U, C;
try {
  [U, C] = await Promise.all(["data/units.json", "data/content.json"].map(f => fetch(f).then(r => { if (!r.ok) throw new Error(`${f}: ${r.status}`); return r.json() })));
} catch (err) { document.getElementById("world").classList.add("ready"); throw err } // sem dados: ao menos o render aparece

export const TYPES = U.types, PRIV = U.priv, AVAIL = U.available, RESERVED = U.reserved, FLOW = U.payment, TFILM = U.typeFilm;
export const BOOK = C.book, EXP = C.experiences, VIEWS = C.views, FILM_GERAL = C.filmGeral;

export const UNITS = [];
for (const t in U.geo) {
  const { size: [w, h, r], centers } = U.geo[t];
  centers.forEach(([x, y], i) => {
    const n = i + 1, key = `${t}-${n}`, price = AVAIL[key] ?? null;
    UNITS.push({ key, type: t, n, label: `${t === "Vista" ? "Vista Mar" : t} ${String(n).padStart(2, "0")}`, priv: PRIV[t][i], constr: TYPES[t].constr,
      status: price ? "d" : RESERVED[key] ? "r" : "v", price, x, y, w, h, r });
  });
}
export const avail = UNITS.filter(u => u.status === "d");

export const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const mi = v => "R$ " + (v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " mi";
export const num = v => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const isMobile = () => matchMedia("(max-width:720px)").matches;
export const reduceM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const IMG = k => typeof k === "number" ? `media/book/p${k}.jpg` : `media/hi/${k}.jpg`,
  IMGM = k => typeof k === "number" ? `media/book/p${k}.jpg` : `media/hi/m-${k}.jpg`,
  TH = k => typeof k === "number" ? `media/book/t${k}.jpg` : `media/hi/t-${k}.jpg`;

// áreas comuns: retângulos {rect:[cx,cy,w,h]} viram polígonos; caixa envolvente para enquadrar
const RC = (cx, cy, w, h) => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
export const AREAS = C.areas.map(a => ({ ...a, polys: a.polys.map(p => p.rect ? RC(...p.rect) : p) }));
export const CLUB = AREAS[0];
for (const a of AREAS) {
  Object.assign(a, { type: a.key, area: true, status: "c" });
  const xs = a.polys.flat().map(p => p[0]), ys = a.polys.flat().map(p => p[1]);
  a.bx = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; a.w = a.bx[2] - a.bx[0]; a.h = a.bx[3] - a.bx[1];
  TYPES[a.key] = { name: a.label }; TFILM[a.key] = a.film;
}

const pip = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c };
function segD(x, y, [ax, ay], [bx, by]) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let k = l ? ((x - ax) * dx + (y - ay) * dy) / l : 0; k = Math.max(0, Math.min(1, k)); return Math.hypot(x - ax - k * dx, y - ay - k * dy) }
export const areaAt = (x, y, pad = 0) => AREAS.find(a => a.polys.some(P => pip(x, y, P)) || (pad && a.polys.some(P => P.some((q, i) => segD(x, y, q, P[(i + 1) % P.length]) < pad))));
// distância em metros (0,2463 m/px), arredondada de 10 em 10
export const areaDist = (a, u) => { let m = 1e9; for (const P of a.polys) { if (pip(u.x, u.y, P)) return 0; P.forEach((q, i) => { m = Math.min(m, segD(u.x, u.y, q, P[(i + 1) % P.length])) }) } return Math.max(10, Math.round(m * 0.2463 / 10) * 10) };
