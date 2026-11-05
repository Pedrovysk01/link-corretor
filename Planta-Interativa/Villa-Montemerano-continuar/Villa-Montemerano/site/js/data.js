// Dados do empreendimento: lidos de data/empreendimento.json (catálogo, plantas e imagens da pasta Justus).
let D;
try { D = await fetch("data/empreendimento.json").then(r => { if (!r.ok) throw new Error("empreendimento.json: " + r.status); return r.json() }) }
catch (err) { document.body.classList.add("erro"); throw err }
export { D };
export const EXP = D.experiencias, VIEWS = D.mapa.views;
export const IMG = k => `media/hi/${k}.jpg`, IMGM = k => `media/hi/m-${k}.jpg`, TH = k => `media/hi/t-${k}.jpg`;
export const isMobile = () => matchMedia("(max-width:720px)").matches;
export const reduceM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const $ = id => document.getElementById(id);
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
