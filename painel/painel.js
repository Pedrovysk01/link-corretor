/* Link Corretor — painel (dono e corretor), centrado em CLIENTES identificados e no corretor de origem (comissão).
   JS puro, sem build. Todo texto vindo do servidor entra como texto, nunca como HTML. */
"use strict";

const ICONES = {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.3c2 .8 3.2 2.7 3.2 5.7"/>',
  people: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  sliders: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v1M14 21h3M21 18v3h-2"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>', out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', panelL: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 10l-2 2 2 2"/>', panelR: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16M9 10l2 2-2 2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', down: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>', check: '<path d="M5 12l5 5 9-10"/>', back: '<path d="M15 5l-7 7 7 7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  swap: '<path d="M4 7h12l-3-3M20 17H8l3 3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const ic = (n) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ic"); s.setAttribute("aria-hidden", "true"); s.innerHTML = ICONES[n] || ""; return s; };
const LOGO = () => h("span", { class: "ic-box" }, ic("link"));

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "value" || k === "checked" || k === "disabled" || k === "selected") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  const add = (c) => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(add); else el.append(c instanceof Node ? c : document.createTextNode(String(c))); };
  kids.forEach(add); return el;
}
const $ = (s, r = document) => r.querySelector(s);
const S = { me: null, empresa: "", logo: "", logoShape: "round", theme: null, rota: null, arg: null, nv: null, no: null, tok: 0 };
const CANAIS = { whatsapp: "WhatsApp", instagram: "Instagram", qr: "QR Code", email: "E-mail", site: "Site", outro: "Outro" };
const STATUS = { novo: "Novo", contatado: "Contatado", visita: "Visita marcada", proposta: "Proposta", fechado: "Fechado", perdido: "Perdido" };

async function api(metodo, caminho, corpo) {
  let r;
  try { r = await fetch(caminho, { method: metodo, credentials: "same-origin", headers: corpo ? { "Content-Type": "application/json" } : {}, body: corpo ? JSON.stringify(corpo) : undefined }); }
  catch { throw new Error("Sem conexão com o servidor. Confira se o painel continua aberto no computador."); }
  let j = null; try { j = await r.json(); } catch { /* sem JSON */ }
  if (r.status === 401 && S.me) { S.me = null; entrada(); throw new Error("Sua sessão terminou. Entre de novo."); }
  if (!r.ok) throw new Error((j && j.erro) || "Algo deu errado. Tente de novo.");
  return j;
}
// Aviso lateral de cliente novo: aparece depois do atraso configurado (padrão 5 min) e fica na tela até ser fechado ou aberto.
// Avisos de cliente novo: no máximo 9 cartões na tela; todos ficam guardados no sino do topo (contador vermelho, "+9" acima de nove)
// até a construtora abrir o cliente ou limpar. O sino só aparece quando há aviso pendente.
const MAX_AVISOS = 9;
const quandoMin = (m) => m < 1 ? "agora" : m === 1 ? "há 1 min" : `há ${m} min`;
S.pendentes = [];
function avisoCliente(l) {
  if (!S.pendentes.some((x) => x.id === l.id)) S.pendentes.unshift(l);
  pintarSino();
  if ($("#avisos").querySelectorAll(".aviso-cliente").length >= MAX_AVISOS) return;  // os demais ficam só no sino
  const a = h("div", { class: "aviso aviso-cliente", role: "status", "data-id": l.id },
    h("button", { class: "aviso-x", type: "button", "aria-label": "Fechar aviso", onclick: () => a.remove() }, "×"),
    h("p", { class: "aviso-eyebrow" }, `Cliente abriu e se cadastrou · ${quandoMin(l.minutos)}`),
    h("b", null, l.name),
    h("span", null, l.empreendimento),
    h("small", null, dono() ? `Veio do corretor ${l.corretor}${l.canal ? " · " + l.canal : ""}` : "Veio do seu link"),
    h("a", { class: "aviso-ver", href: `#/cliente/${l.id}`, onclick: () => { a.remove(); visto(l.id); } }, "Ver cliente"));
  $("#avisos").append(a); setTimeout(() => a.remove(), 60000);
}
function visto(id) { S.pendentes = S.pendentes.filter((x) => x.id !== id); pintarSino(); }
function pintarSino() {
  const b = $("#sino"); if (!b) return;
  const n = S.pendentes.length; b.hidden = n === 0; b.setAttribute("aria-label", n ? `${n} cliente(s) novo(s) para ver` : "Sem avisos");
  const bd = b.querySelector(".badge"); bd.textContent = n > MAX_AVISOS ? `+${MAX_AVISOS}` : String(n);
  const p = $("#sino-painel"); if (p && !p.hidden) pintarSinoPainel();
}
function pintarSinoPainel() {
  const p = $("#sino-painel"); if (!p) return;
  p.replaceChildren(h("div", { class: "row between", style: "padding:4px 8px 8px" }, h("strong", null, `${S.pendentes.length} cliente(s) novo(s)`), h("button", { class: "btn ghost sm", type: "button", onclick: () => { S.pendentes = []; pintarSino(); p.hidden = true; } }, "Limpar")),
    ...S.pendentes.map((l) => h("a", { class: "sino-item", href: `#/cliente/${l.id}`, onclick: () => { visto(l.id); p.hidden = true; } }, avatar(l.name, "sm"), h("div", { style: "min-width:0" }, h("b", { class: "wrap" }, l.name), h("span", { class: "muted small" }, `${l.empreendimento}${dono() ? " · " + l.corretor : ""} · ${quandoMin(l.minutos)}`)))));
}
function aviso(msg, erro) { const a = h("div", { class: "aviso" + (erro ? " erro" : ""), role: erro ? "alert" : "status" }, msg); $("#avisos").append(a); setTimeout(() => a.remove(), erro ? 6500 : 4500); }
async function copiar(txt, ok = "Copiado.") {
  try { await navigator.clipboard.writeText(txt); }
  catch { const t = h("textarea", { style: "position:fixed;opacity:0" }); t.value = txt; document.body.append(t); t.select(); try { document.execCommand("copy"); } catch { /* sem clipboard */ } t.remove(); }
  aviso(ok);
}

const fmtN = (n) => Number(n || 0).toLocaleString("pt-BR");
const utc = (ts) => new Date(String(ts).replace(" ", "T") + "Z");
function quando(ts) {
  if (!ts) return "—"; const d = utc(ts), s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "agora"; if (s < 3600) return `há ${Math.floor(s / 60)} min`; if (s < 86400) return `há ${Math.floor(s / 3600)} h`; if (s < 86400 * 7) return `há ${Math.floor(s / 86400)} d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
const dataHora = (ts) => (ts ? utc(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");
const dur = (s) => (!s || s < 60 ? `${Math.max(1, Math.round((s || 0) / 1))} s`.replace(/^1 s$/, "< 1 min") : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`);
function fone(v) { const d = String(v || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""); if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return v || ""; }
const urlLink = (code) => `${location.origin}/r/${code}`;
const wa = (num, txt) => `https://wa.me/${String(num).replace(/\D/g, "")}?text=${encodeURIComponent(txt)}`;
const dono = () => S.me && S.me.role === "owner";
const pill = (txt, cls) => h("span", { class: "pill " + (cls || "") }, txt);
const statusPill = (s) => pill(STATUS[s] || s, "s-" + s);
const ini = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
const avatar = (nome, cls) => h("span", { class: "av " + (cls || ""), "aria-hidden": "true" }, ini(nome));
const vazio = (icone, titulo, texto, acao) => h("div", { class: "vazio" }, h("span", { class: "ic-box" }, ic(icone)), h("strong", null, titulo), texto && h("p", null, texto), acao);
let _id = 0;
function campo(rotulo, input, dica) { const id = "c" + ++_id; input.id = id; return h("div", { class: "field" }, h("label", { for: id }, rotulo), input, dica && h("span", { class: "hint" }, dica)); }
const caixa = (rotulo, marcado, nome) => h("label", { class: "check" }, h("input", { type: "checkbox", name: nome, checked: !!marcado }), h("span", null, rotulo));
const nav = (rota) => { location.hash = "#/" + rota; };

// ───────── diálogo ─────────
function dialogo(titulo, corpo, botoes, { onSubmit } = {}) {
  const dlg = h("dialog", { class: "modal", "aria-labelledby": "dlg-t" }), erro = h("p", { class: "err", role: "alert" });
  const fechar = () => { dlg.close(); dlg.remove(); };
  const topo = h("div", { class: "dlg-h" }, h("h2", { id: "dlg-t" }, titulo), h("button", { type: "button", class: "btn icon ghost", "aria-label": "Fechar", onclick: fechar }, ic("x")));
  const miolo = h("div", { class: "dlg-b" }, corpo, erro), rodape = h("div", { class: "dlg-f" }, botoes || []);
  const wrap = onSubmit
    ? h("form", { novalidate: true, onsubmit: async (e) => { e.preventDefault(); const sub = $("button[type=submit]", dlg); sub && (sub.disabled = true); erro.textContent = "";
        try { await onSubmit(new FormData(e.target), fechar); } catch (x) { erro.textContent = x.message; } sub && (sub.disabled = false); } }, topo, miolo, rodape)
    : h("div", { class: "dlg" }, topo, miolo, rodape);
  dlg.append(wrap); dlg.addEventListener("click", (e) => { if (e.target === dlg) fechar(); }); dlg.addEventListener("cancel", () => setTimeout(() => dlg.remove(), 0));
  document.body.append(dlg); dlg.showModal(); return { fechar, dlg, erro };
}
const btnFechar = (txt = "Cancelar") => h("button", { type: "button", class: "btn", onclick: (e) => { const d = e.target.closest("dialog"); d.close(); d.remove(); } }, txt);
const btnOk = (txt) => h("button", { type: "submit", class: "btn primary" }, txt);

// ───────── casca ─────────
function menu() {
  const m = [{ r: "", t: "Resumo", i: "dash" }, { r: "clientes", t: "Clientes", i: "people" }];
  if (dono()) m.push({ r: "corretores", t: "Corretores", i: "users" }, { r: "empreendimentos", t: "Empreendimentos", i: "building" });
  m.push({ r: "links", t: dono() ? "Links" : "Meus links", i: "link" }, { r: "perguntas", t: "Perguntas à IA", i: "chat" });
  if (dono()) m.push({ r: "config", t: "Configurações", i: "sliders" });
  m.push({ r: "conta", t: "Minha conta", i: "user" }); return m;
}
const partes = () => location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
const rotaAtual = () => partes()[0] || "";
const logoEmpresa = (cls) => S.logo ? h("img", { class: "logo-img shape-" + (S.logoShape || "round"), src: S.logo, alt: "" }) : h("span", { class: "av " + (cls || ""), "aria-hidden": "true" }, ini(S.empresa || "LC"));

// ───────── tema a partir da logo ─────────
const hex2rgb = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
const rgb2hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const contraste = (a, b) => { const [x, y] = [lum(...a), lum(...b)]; return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const mix = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p);
const PAPEIS = [["accent", "Acento"], ["bar", "Barra"], ["button", "Botões"]];
const TEMA_VARS = ["--ink", "--brass", "--brass-hi", "--brass-deep", "--brass-ink", "--brass-soft", "--ring", "--accent-text", "--bar-bg", "--bar-text", "--bar-muted", "--bar-line", "--bar-fill", "--accent", "--accent-ink",
  "--logo-backing", "--bg", "--surface2", "--line", "--line-strong", "--muted", "--float", "--float-hi", "--sh-0", "--av-bg", "--av-text", "--text"];
const legivel = (rgb) => (contraste(rgb, [255, 255, 255]) >= contraste(rgb, [22, 48, 46]) ? "#ffffff" : "#16302e");  // texto branco ou escuro, o que contrastar mais
function temaValido(th) { const ok = (x) => typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x); return !!th && ok(th.accent) && ok(th.bar) && ok(th.button); }
function aplicarTema(th) {
  const r = document.documentElement.style; TEMA_VARS.forEach((k) => r.removeProperty(k));
  if (!temaValido(th)) return;  // tema ausente, antigo ({accent, ink}) ou corrompido = padrão
  try { aplicarTemaReal(th, r); } catch (e) { TEMA_VARS.forEach((k) => r.removeProperty(k)); console.warn("tema ignorado:", e); }
}
function aplicarTemaReal(th, r) {
  const escuro = matchMedia("(prefers-color-scheme: dark)").matches;
  const acc = hex2rgb(th.accent), bar = hex2rgb(th.bar), btn = hex2rgb(th.button), paper = escuro ? [11, 20, 18] : [243, 239, 230];
  const rgba = (c, a) => `rgba(${c.map(Math.round).join(",")},${a})`;
  // acento: destaques, gráficos, item ativo
  r.setProperty("--brass", th.accent); r.setProperty("--brass-hi", rgb2hex(...mix(acc, [255, 255, 255], .35))); r.setProperty("--brass-deep", rgb2hex(...mix(acc, [0, 0, 0], .18)));
  let bi = acc; for (let i = 0; i < 14 && contraste(bi, paper) < 4.5; i++) bi = mix(bi, escuro ? [255, 255, 255] : [0, 0, 0], .16);
  r.setProperty("--brass-ink", rgb2hex(...bi)); r.setProperty("--brass-soft", rgba(acc, .16)); r.setProperty("--ring", rgba(acc, .35)); r.setProperty("--accent-text", legivel(acc));
  // barra lateral e topo: a cor escolhida, texto branco ou escuro
  const bt = legivel(bar), btRgb = hex2rgb(bt);
  r.setProperty("--bar-bg", th.bar); r.setProperty("--bar-text", bt); r.setProperty("--logo-backing", lum(...bar) < .35 ? "rgba(255,255,255,.92)" : "transparent"); r.setProperty("--bar-muted", rgba(btRgb, .66)); r.setProperty("--bar-line", rgba(btRgb, .16)); r.setProperty("--bar-fill", rgba(btRgb, .09));
  // botões principais
  r.setProperty("--accent", th.button); r.setProperty("--accent-ink", legivel(btn)); r.setProperty("--av-bg", th.button); r.setProperty("--av-text", legivel(btn));
  // estrutura segue a paleta: fundo, linhas, cinzas e sombras tingidos pela cor da barra (a mais presente)
  const tinta = lum(...bar) < .25 ? bar : lum(...btn) < .25 ? btn : [22, 48, 46];
  if (!escuro) {
    r.setProperty("--bg", rgb2hex(...mix(paper, tinta, .035))); r.setProperty("--surface2", rgba(tinta, .07)); r.setProperty("--line", rgba(tinta, .14)); r.setProperty("--line-strong", rgba(tinta, .28));
    r.setProperty("--muted", rgb2hex(...mix(tinta, paper, .35))); r.setProperty("--text", rgb2hex(...mix(tinta, [0, 0, 0], .15))); r.setProperty("--ink", rgb2hex(...tinta));
  } else {
    r.setProperty("--bg", rgb2hex(...mix([11, 20, 18], tinta, .18))); r.setProperty("--surface2", rgba([243, 239, 230], .07));
  }
  r.setProperty("--float", `0 1px 2px ${rgba(tinta, escuro ? .35 : .06)},0 8px 24px -6px ${rgba(tinta, escuro ? .55 : .16)},0 20px 40px -16px ${rgba(tinta, escuro ? .5 : .14)}`);
  r.setProperty("--float-hi", `0 2px 4px ${rgba(tinta, .08)},0 16px 36px -8px ${rgba(tinta, escuro ? .65 : .24)},0 32px 56px -20px ${rgba(tinta, escuro ? .6 : .2)}`);
  r.setProperty("--sh-0", `0 1px 2px ${rgba(tinta, .14)},0 2px 8px ${rgba(tinta, .06)}`);
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => aplicarTema(S.theme));
function coresDaLogo(src) {
  return new Promise((res) => {
    const img = new Image(); img.onload = () => {
      const L = 64, c = h("canvas", { width: L, height: L }), x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, L, L);
      const d = x.getImageData(0, 0, L, L).data, bins = new Map();
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue; const r = d[i], g = d[i + 1], b = d[i + 2], max = Math.max(r, g, b), min = Math.min(r, g, b), sat = max ? (max - min) / max : 0, l = (max + min) / 510;
        if (l > .96 || l < .04) continue;  // ignora branco/preto puros (fundo)
        const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4), e = bins.get(k) || { n: 0, r: 0, g: 0, b: 0, s: 0 }; e.n++; e.r += r; e.g += g; e.b += b; e.s += sat; bins.set(k, e);
      }
      const cs = [...bins.values()].map((e) => ({ rgb: [e.r / e.n, e.g / e.n, e.b / e.n], n: e.n, sat: e.s / e.n })).sort((a, b) => b.n - a.n);
      // agrupa parecidas
      const grupos = []; for (const c0 of cs) { const g = grupos.find((g) => Math.hypot(...g.rgb.map((v, i) => v - c0.rgb[i])) < 48); if (g) { g.n += c0.n; } else grupos.push({ ...c0 }); }
      grupos.sort((a, b) => b.n - a.n);
      const acento = [...grupos].sort((a, b) => (b.sat * Math.sqrt(b.n)) - (a.sat * Math.sqrt(a.n)))[0] || grupos[0];
      const escura = [...grupos].filter((g) => lum(...g.rgb) < .12).sort((a, b) => b.n - a.n)[0];
      res({ acento: acento && rgb2hex(...acento.rgb), escura: escura && rgb2hex(...escura.rgb), todas: grupos.slice(0, 6).map((g) => rgb2hex(...g.rgb)) });
    }; img.onerror = () => res(null); img.src = src;
  });
}
function casca() {
  const itens = menu(), atual = rotaAtual();
  const link = (m) => h("a", { href: "#/" + m.r, "aria-current": m.r === atual ? "page" : null, title: m.t, onclick: () => document.body.classList.remove("sb-open") }, ic(m.i), h("span", null, m.t));
  const mini = document.body.classList.contains("sb-mini");
  const lateral = h("aside", { class: "side", id: "menu-lateral" },
    h("a", { class: "brand", href: "#/", "aria-label": S.empresa || "Início" }, logoEmpresa(), h("span", null, S.empresa || "Link Corretor")),
    h("div", { class: "nav-label" }, "Menu"),
    h("nav", { class: "nav", "aria-label": "Principal" }, itens.map(link)),
    h("div", { class: "foot" },
      h("div", { class: "quem" }, avatar(S.me.name, "sm"), h("div", { style: "min-width:0" }, h("strong", { class: "wrap" }, S.me.name), h("span", { class: "muted" }, dono() ? "Dono" : "Corretor"))),
      h("button", { type: "button", class: "sb-hide", "aria-label": mini ? "Mostrar barra" : "Ocultar barra", title: mini ? "Mostrar barra" : "Ocultar barra", onclick: () => { const on = !document.body.classList.contains("sb-mini"); document.body.classList.toggle("sb-mini", on); try { on ? localStorage.setItem("lc_sbmini", "1") : localStorage.removeItem("lc_sbmini"); } catch { /* sem storage */ } casca(); rotear(); } }, ic(mini ? "panelR" : "panelL"), h("span", null, mini ? "Mostrar barra" : "Ocultar barra"))));
  const topo = h("header", { class: "topo" },
    h("div", { class: "esq" },
      h("button", { class: "icon-btn", "aria-label": "Alternar menu lateral", "aria-controls": "menu-lateral", onclick: () => { if (window.innerWidth <= 1024) document.body.classList.toggle("sb-open"); else document.querySelector(".side .sb-hide")?.click(); } }, ic("menu")),
      h("a", { class: "brandbar", href: "#/" }, logoEmpresa("sm"), h("small", null, S.empresa || "Link Corretor"))),
    h("div", { class: "dir" },
      h("button", { class: "icon-btn sino", id: "sino", type: "button", hidden: !S.pendentes.length, "aria-haspopup": "true", "aria-expanded": "false", "aria-label": "Avisos", title: "Clientes novos", onclick: (e) => { const p = $("#sino-painel"); p.hidden = !p.hidden; e.currentTarget.setAttribute("aria-expanded", String(!p.hidden)); if (!p.hidden) { $("#avisos").querySelectorAll(".aviso-cliente").forEach((a) => a.remove()); pintarSinoPainel(); } } }, ic("bell"), h("span", { class: "badge", "aria-hidden": "true" }, "0")),  // abrir o sino recolhe os cartões: a lista tem todos
      h("div", { class: "card sino-painel", id: "sino-painel", hidden: true, role: "dialog", "aria-label": "Clientes novos" }),
      h("a", { class: "user-btn", href: "#/conta", title: "Minha conta" }, avatar(S.me.name, "sm"), h("div", { style: "min-width:0" }, h("b", null, S.me.name), h("small", null, S.me.email))),
      h("button", { class: "icon-btn", "aria-label": "Sair", title: "Sair", onclick: sair }, ic("out"))));
  const scrim = h("div", { class: "scrim", onclick: () => document.body.classList.remove("sb-open") });
  const main = h("div", { class: "main" }, topo, h("main", { id: "conteudo", tabindex: "-1" }));
  $("#raiz").replaceChildren(scrim, lateral, main); pintarSino();
}
async function sair() { try { await api("POST", "/api/logout", {}); } catch { /* já saiu */ } S.me = null; entrada(); }

// ───────── entrada ─────────
function entrada() {
  document.title = "Entrar · Link Corretor";
  api("GET", "/api/me").then((m) => { S.empresa = m.empresa; S.logo = m.logo || ""; S.logoShape = m.logo_shape || "round"; S.theme = temaValido(m.theme) ? m.theme : null; aplicarTema(S.theme); if (m.user) { S.me = m.user; iniciar(); return; } $("#raiz").replaceChildren(m.setup ? telaSetup() : telaLogin()); $("#raiz input")?.focus(); })
    .catch((e) => $("#raiz").replaceChildren(h("div", { class: "entrada" }, h("div", { class: "card" }, h("h1", null, "Não consegui abrir o painel"), h("p", { class: "muted" }, e.message)))));
}
function telaLogin() {
  const erro = h("p", { class: "err", role: "alert" });
  return h("div", { class: "entrada" }, h("form", { class: "card", novalidate: true, onsubmit: async (e) => { e.preventDefault(); erro.textContent = ""; const f = new FormData(e.target);
    try { const r = await api("POST", "/api/login", { email: f.get("email"), senha: f.get("senha") }); S.me = r.user; iniciar(); } catch (x) { erro.textContent = x.message; } } },
    h("div", { class: "logo" }, LOGO(), "Link Corretor"), h("div", null, h("h1", null, "Entrar"), h("p", { class: "muted" }, S.empresa || "Clientes por corretor")),
    campo("E-mail", h("input", { type: "email", name: "email", autocomplete: "username", required: true })), campo("Senha", h("input", { type: "password", name: "senha", autocomplete: "current-password", required: true })),
    erro, h("button", { class: "btn primary", type: "submit" }, "Entrar")));
}
function telaSetup() {
  const erro = h("p", { class: "err", role: "alert" });
  return h("div", { class: "entrada" }, h("form", { class: "card", novalidate: true, onsubmit: async (e) => { e.preventDefault(); erro.textContent = ""; const f = new FormData(e.target);
    try { const r = await api("POST", "/api/setup", { empresa: f.get("empresa"), nome: f.get("nome"), email: f.get("email"), senha: f.get("senha"), exemplo: f.get("exemplo") === "on" });
      const m = await api("GET", "/api/me"); S.me = m.user; S.empresa = m.empresa; S.logo = m.logo || ""; S.logoShape = m.logo_shape || "round"; S.theme = temaValido(m.theme) ? m.theme : null; aplicarTema(S.theme); iniciar(); if (r.exemplo) aviso("Dados de exemplo carregados. Os corretores fictícios entram com a senha corretor123."); } catch (x) { erro.textContent = x.message; } } },
    h("div", { class: "logo" }, LOGO(), "Link Corretor"), h("div", null, h("h1", null, "Vamos começar"), h("p", { class: "muted" }, "Crie a conta do dono da construtora ou imobiliária. Leva um minuto.")),
    campo("Nome da empresa", h("input", { type: "text", name: "empresa", autocomplete: "organization", required: true })), campo("Seu nome", h("input", { type: "text", name: "nome", autocomplete: "name", required: true })),
    campo("E-mail", h("input", { type: "email", name: "email", autocomplete: "username", required: true })), campo("Senha", h("input", { type: "password", name: "senha", autocomplete: "new-password", minlength: 8, required: true }), "Mínimo de 8 caracteres."),
    caixa("Preencher com dados de exemplo (corretores, clientes e aberturas fictícios). Dá para apagar depois em Configurações.", true, "exemplo"),
    erro, h("button", { class: "btn primary", type: "submit" }, "Criar conta e entrar")));
}

// ───────── roteador ─────────
const TELAS = { "": ["Resumo", telaResumo], clientes: ["Clientes", telaClientes], cliente: ["Cliente", telaCliente], corretores: ["Corretores", telaCorretores, true], corretor: ["Corretor", telaCorretor, true],
  empreendimentos: ["Empreendimentos", telaProps, true], links: ["Links", telaLinks], perguntas: ["Perguntas à IA", telaPerguntas], config: ["Configurações", telaConfig, true], conta: ["Minha conta", telaConta] };
async function rotear() {
  if (!S.me) return;
  let [r, arg] = partes();
  if (!TELAS[r] || (TELAS[r][2] && !dono())) { r = ""; arg = null; location.replace("#/"); }
  S.rota = r; S.arg = arg; const tok = ++S.tok;
  const menuRota = r === "cliente" ? "clientes" : r === "corretor" ? "corretores" : r;
  if (!$("#conteudo") || $(".side .nav a[aria-current]")?.getAttribute("href") !== "#/" + menuRota) casca();
  const cont = $("#conteudo"); document.title = `${TELAS[r][0]} · Link Corretor`;
  cont.replaceChildren(h("p", { class: "muted", role: "status" }, "Carregando…"));
  try { const el = await TELAS[r][1](arg); if (tok !== S.tok) return; cont.replaceChildren(el); window.scrollTo(0, 0); }
  catch (e) { if (tok === S.tok && S.me) cont.replaceChildren(vazio("x", "Não consegui carregar", e.message, h("button", { class: "btn", onclick: rotear }, "Tentar de novo"))); }
}
const cabeca = (t, sub, ...acoes) => h("div", { class: "page-h" }, h("div", { style: "min-width:0" }, h("h1", { class: "wrap" }, t), sub && h("p", { class: "sub" }, sub)), h("div", { class: "row" }, acoes));
const voltar = (rota, txt) => h("a", { class: "voltar", href: "#/" + rota }, ic("back"), txt);

// ───────── componentes de pessoa ─────────
function detalheInline(c) {
  return api("GET", "/api/clientes/" + c.id).then((d) => h("div", { class: "det-grid" },
    h("div", null, h("span", { class: "eyebrow" }, `Todos os acessos (${d.historico.length})`), d.historico.length ? h("div", { class: "timeline", style: "margin-top:8px" }, d.historico.map((o) => h("div", { class: "tl" }, h("span", { class: "tl-dot" + (o.broker_id !== d.broker_id ? " warn" : "") }),
      h("div", null, h("div", { class: "cell-main" }, dataHora(o.ts)), h("div", { class: "muted small wrap" }, [o.empreendimento, o.device, o.segundos > 30 ? "ficou " + dur(o.segundos) : null, o.broker_id !== d.broker_id ? "link de " + o.corretor : CANAIS[o.channel]].filter(Boolean).join(" · ")))))) : h("p", { class: "muted small", style: "margin-top:8px" }, "Cadastrou-se, mas ainda não abriu a apresentação de novo.")),
    h("div", null, h("span", { class: "eyebrow" }, "Recado e perguntas"), h("p", { class: "wrap small", style: "margin-top:8px;white-space:pre-wrap" }, d.message || "Sem recado."),
      d.perguntas_lista.slice(0, 5).map((x) => h("div", { class: "qa" }, h("span", { class: "q wrap small" }, x.question), x.answer && h("span", { class: "a wrap small" }, x.answer))),
      h("div", { class: "row", style: "margin-top:12px" }, h("a", { class: "btn sm primary", href: "#/cliente/" + c.id }, "Ver mais detalhes"),
        c.phone && h("a", { class: "btn sm", target: "_blank", rel: "noopener", href: wa(c.phone, `Olá ${c.name.split(" ")[0]}, aqui é ${c.corretor} sobre o ${c.empreendimento}.`) }, ic("phone"), "WhatsApp"), selStatus(c)))));
}
function linhaCliente(c, { semCorretor } = {}) {
  const contato = [c.phone && fone(c.phone), c.email].filter(Boolean).join(" · ");
  let det = null;
  const linha = h("div", { class: "pessoa", role: "button", tabindex: "0", "aria-expanded": "false" },
    avatar(c.name),
    h("div", { class: "pessoa-m" }, h("div", { class: "pessoa-n" }, h("span", { class: "wrap" }, c.name), statusPill(c.status), c.outros_corretores > 0 && pill("outro link", "warn")),
      h("div", { class: "pessoa-s wrap" }, contato || "sem contato"), h("div", { class: "pessoa-s wrap" }, [c.empreendimento, !semCorretor && (dono() ? "por " + c.corretor : null), c.shares && c.shares.length ? "comissão " + c.shares.map((s) => `${s.name.split(" ")[0]} ${s.pct}%`).join(" + ") : null].filter(Boolean).join(" · "))),
    h("div", { class: "pessoa-r" }, h("span", { class: "big" }, fmtN(c.aberturas)), h("span", { class: "muted small" }, c.aberturas === 1 ? "abertura" : "aberturas"), h("span", { class: "muted small" }, "última " + quando(c.ultima || c.created))));
  const wrap = h("div", { class: "pessoa-w" }, linha);
  const alternar = async () => {
    if (det) { det.remove(); det = null; linha.setAttribute("aria-expanded", "false"); linha.classList.remove("on"); return; }
    det = h("div", { class: "pessoa-det" }, h("p", { class: "muted small" }, "Carregando…")); wrap.append(det); linha.setAttribute("aria-expanded", "true"); linha.classList.add("on");
    try { det.replaceChildren(await detalheInline(c)); } catch (e) { det.replaceChildren(h("p", { class: "err", style: "display:block" }, e.message)); }
  };
  linha.addEventListener("click", (e) => { if (e.target.closest("a,button,select")) return; alternar(); });
  linha.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === linha) { e.preventDefault(); alternar(); } });
  return wrap;
}
const listaPessoas = (cs, opts) => h("div", { class: "pessoas" }, cs.map((c) => linhaCliente(c, opts)));

// ───────── vista Lista/Tabela e tabela expansível ─────────
const vista = (k) => localStorage.getItem("lc_vista_" + k) || "lista";
function vistaToggle(k) {
  const v = vista(k);
  const b = (val, txt) => h("button", { class: "chip", "aria-pressed": String(v === val), onclick: () => { localStorage.setItem("lc_vista_" + k, val); rotear(); } }, txt);
  return h("div", { class: "chips", role: "group", "aria-label": "Modo de exibição" }, b("lista", "Lista"), b("tabela", "Tabela"));
}
/* cols: [{t, v:(r)=>node|texto, cls}] · expandir(r): Promise<node> mostrado numa linha abaixo ao clicar */
function tabela(cols, rows, expandir) {
  const corpo = h("tbody");
  rows.forEach((r) => {
    const tr = h("tr", { class: expandir ? "exp" : "", tabindex: expandir ? "0" : null }, cols.map((c) => h("td", { class: c.cls || "", "data-l": c.t }, c.v(r))));
    corpo.append(tr);
    if (!expandir) return;
    let aberto = null;
    const alternar = async () => {
      if (aberto) { aberto.remove(); aberto = null; tr.classList.remove("on"); return; }
      aberto = h("tr", { class: "det" }, h("td", { colspan: cols.length }, h("p", { class: "muted small" }, "Carregando…"))); tr.after(aberto); tr.classList.add("on");
      try { aberto.firstChild.replaceChildren(await expandir(r)); } catch (e) { aberto.firstChild.replaceChildren(h("p", { class: "err", style: "display:block" }, e.message)); }
    };
    tr.addEventListener("click", (e) => { if (e.target.closest("a,button,select,input")) return; alternar(); });
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === tr) alternar(); });
  });
  return h("table", { class: "t" }, h("thead", null, h("tr", null, cols.map((c) => h("th", { class: c.cls || "" }, c.t)))), corpo);
}
const selStatus = (c) => h("select", { "aria-label": `Situação de ${c.name}`, class: "sel-status sm", onchange: async (e) => { await api("PATCH", `/api/clientes/${c.id}`, { status: e.target.value }); aviso("Situação atualizada."); } }, Object.entries(STATUS).map(([v, t]) => h("option", { value: v, selected: v === c.status }, t)));
const contatoDe = (c) => [c.phone && fone(c.phone), c.email].filter(Boolean).join(" · ") || "—";
function tabelaClientes(cs, { semCorretor } = {}) {
  const cols = [
    { t: "Cliente", v: (c) => h("div", { class: "row", style: "gap:10px;flex-wrap:nowrap" }, avatar(c.name, "sm"), h("div", { style: "min-width:0" }, h("a", { class: "cell-main wrap", href: "#/cliente/" + c.id }, c.name), h("div", { class: "cell-sub wrap" }, contatoDe(c)))), cls: "main-cell" },
    !semCorretor && dono() ? { t: "Corretor de origem", v: (c) => c.corretor } : null,
    { t: "Empreendimento", v: (c) => c.empreendimento }, { t: "Canal", v: (c) => CANAIS[c.channel] || "—" },
    { t: "Aberturas", v: (c) => fmtN(c.aberturas), cls: "num" }, { t: "Primeira", v: (c) => dataHora(c.primeira || c.created) }, { t: "Última", v: (c) => quando(c.ultima || c.created) },
    { t: "Situação", v: selStatus },
  ].filter(Boolean);
  return tabela(cols, cs, detalheInline);
}

// ───────── resumo ─────────
function grafico(serie, chave, rotulo) {
  const W = 600, H = 130, pad = 22, max = Math.max(1, ...serie.map((d) => d[chave])), n = serie.length, bw = (W - 8) / n;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H + pad}`); svg.setAttribute("class", "chart"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", `${rotulo} por dia: total ${serie.reduce((a, d) => a + d[chave], 0)}`);
  let s = `<line class="gl" x1="0" x2="${W}" y1="${H}" y2="${H}"/>`;
  serie.forEach((d, i) => { const bh = Math.round((d[chave] / max) * (H - 14)), x = 4 + i * bw; s += `<rect class="b" x="${x + bw * .18}" y="${H - bh}" width="${bw * .64}" height="${Math.max(bh, d[chave] ? 2 : 0)}" rx="3"><title>${d.dia.split("-").reverse().slice(0, 2).join("/")}: ${d[chave]}</title></rect>`; });
  const lab = (i, anc) => `<text class="ax" x="${4 + i * bw + bw / 2}" y="${H + 16}" text-anchor="${anc}">${serie[i].dia.split("-").reverse().slice(0, 2).join("/")}</text>`;
  svg.innerHTML = s + lab(0, "start") + lab(n - 1, "end") + `<text class="ax" x="${W}" y="10" text-anchor="end">máx. ${max}</text>`; return svg;
}
async function telaResumo() {
  const dias = Number(sessionStorage.getItem("lc_dias") || 30);
  const d = await api("GET", `/api/dashboard?dias=${dias}`), t = d.totais;
  const sel = h("select", { "aria-label": "Período", onchange: (e) => { sessionStorage.setItem("lc_dias", e.target.value); rotear(); } }, [7, 14, 30, 90].map((n) => h("option", { value: n, selected: n === dias }, `Últimos ${n} dias`)));
  const kpi = (n, l, href) => h(href ? "a" : "div", { class: "card kpi", href }, h("span", { class: "n" }, fmtN(n)), h("span", { class: "l" }, l));
  const el = h("div", { class: "stack" }, cabeca(dono() ? "Resumo" : `Olá, ${S.me.name.split(" ")[0]}`, dono() ? S.empresa : "Seus clientes", sel),
    h("div", { class: "kpis" }, kpi(t.clientes, `Clientes novos (${dias} dias)`, "#/clientes"), kpi(t.aberturas, "Aberturas da apresentação"), kpi(t.retornos, "Voltaram a abrir"), kpi(t.novos_para_atender, "Novos para atender", "#/clientes?status=novo")));
  if (!t.total_clientes) el.append(h("div", { class: "card" }, h("h2", null, "Como funciona"), h("div", { class: "passos" },
    passo(true, "Cada corretor tem links por empreendimento", "O cliente abre o link e se identifica com nome e WhatsApp ou e-mail."),
    passo(true, "Toda abertura fica no nome do cliente", "Quantas vezes abriu, quando e por quanto tempo."),
    passo(true, "O cliente pertence ao primeiro corretor", "A apresentação mostra o tempo todo quem está atendendo. É a prova para a comissão."))));
  el.append(h("div", { class: "cols2" },
    h("div", { class: "card" }, h("h2", null, "Clientes novos por dia"), t.clientes ? grafico(d.serie, "clientes", "Clientes") : vazio("people", "Ainda sem clientes", "Quando alguém se cadastrar por um link, aparece aqui.")),
    h("div", { class: "card" }, h("h2", null, "Aberturas por dia"), t.aberturas ? grafico(d.serie, "aberturas", "Aberturas") : vazio("eye", "Ainda sem aberturas"))));
  const max = Math.max(1, ...d.ranking.map((r) => r.clientes));
  el.append(h("div", { class: "cols2" },
    dono() && h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", null, "Corretores"), h("a", { href: "#/corretores" }, "Ver todos")),
      d.ranking.length ? h("div", { class: "stack", style: "gap:12px;margin-top:12px" }, d.ranking.map((r, i) => h("a", { class: "rank", href: "#/corretor/" + r.id },
        avatar(r.name, "sm"), h("div", { style: "flex:1;min-width:0" }, h("div", { class: "row between" }, h("span", { class: "cell-main wrap" }, `${i + 1}. ${r.name}`), h("span", { class: "muted small" }, `${fmtN(r.clientes)} clientes · ${fmtN(r.aberturas)} aberturas${r.fechados ? " · " + r.fechados + " fechado(s)" : ""}`)),
          h("div", { class: "bar", style: "margin-top:6px" }, h("i", { style: `width:${Math.round((r.clientes / max) * 100)}%` })))))) : vazio("users", "Nenhum corretor ainda", null, h("a", { class: "btn primary", href: "#/corretores" }, "Cadastrar corretor"))),
    h("div", { class: "card" }, h("h2", null, "Por empreendimento"), d.empreendimentos.length ? h("div", { class: "stack", style: "gap:12px" }, d.empreendimentos.map((p) =>
      h("a", { class: "row between", href: "#/clientes?empreendimento=" + p.id, style: "text-decoration:none;color:inherit" }, h("span", { class: "cell-main wrap" }, p.name), h("span", { class: "muted small" }, `${fmtN(p.clientes)} clientes · ${fmtN(p.aberturas)} aberturas`)))) : vazio("building", "Sem empreendimentos"))));
  el.append(h("div", { class: "cols2" },
    h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", null, "Clientes recentes"), h("a", { href: "#/clientes" }, "Ver todos")), d.recentes.length ? listaPessoas(d.recentes) : vazio("people", "Nenhum cliente ainda")),
    h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", null, "O que perguntam à IA"), h("a", { href: "#/perguntas" }, "Ver todas")),
      d.perguntas_recentes.length ? h("div", { style: "margin-top:4px" }, d.perguntas_recentes.map((l) => h("div", { class: "qa" }, h("span", { class: "q wrap" }, l.question), h("span", { class: "muted small" }, `${l.cliente} · ${l.empreendimento} · ${quando(l.ts)}`)))) : vazio("chat", "Nenhuma pergunta ainda"))));
  return el;
}
const passo = (ok, t, sub) => h("div", { class: "passo" + (ok ? " ok" : "") }, h("span", { class: "n" }, ok ? ic("check") : ""), h("div", null, h("strong", null, t), h("div", { class: "muted small" }, sub)));

// ───────── clientes ─────────
function filtrosClientes() { const qs = new URLSearchParams(location.hash.split("?")[1] || ""); return { status: qs.get("status") || "", corretor: qs.get("corretor") || "", empreendimento: qs.get("empreendimento") || "", busca: qs.get("busca") || "" }; }
function setFiltro(k, v) { const qs = new URLSearchParams(location.hash.split("?")[1] || ""); v ? qs.set(k, v) : qs.delete(k); location.hash = "#/clientes" + (qs.toString() ? "?" + qs : ""); }
async function telaClientes() {
  const f = filtrosClientes(), qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const [cs, props, bs] = await Promise.all([api("GET", "/api/clientes" + (qs ? "?" + qs : "")), api("GET", "/api/properties"), dono() ? api("GET", "/api/brokers") : []]);
  const chip = (v, t) => h("button", { class: "chip", "aria-pressed": String(f.status === v), onclick: () => setFiltro("status", v) }, t);
  const busca = h("input", { type: "search", value: f.busca, placeholder: "Nome, WhatsApp ou e-mail", "aria-label": "Buscar cliente", onchange: (e) => setFiltro("busca", e.target.value.trim()) });
  const el = h("div", { class: "stack" }, cabeca("Clientes", dono() ? "Toda pessoa que se identificou numa apresentação, com o corretor de origem." : "Pessoas que entraram pelos seus links.",
      h("a", { class: "btn", href: "/clientes.csv" + (qs ? "?" + qs : ""), download: "clientes.csv" }, ic("down"), "Exportar CSV")),
    h("div", { class: "filtros" }, h("div", { class: "busca" }, ic("search"), busca),
      dono() && h("select", { "aria-label": "Corretor", onchange: (e) => setFiltro("corretor", e.target.value) }, h("option", { value: "" }, "Todos os corretores"), bs.map((b) => h("option", { value: b.id, selected: String(b.id) === f.corretor }, b.name))),
      h("select", { "aria-label": "Empreendimento", onchange: (e) => setFiltro("empreendimento", e.target.value) }, h("option", { value: "" }, "Todos os empreendimentos"), props.map((p) => h("option", { value: p.id, selected: String(p.id) === f.empreendimento }, p.name)))),
    h("div", { class: "chips", role: "group", "aria-label": "Situação" }, chip("", "Todos"), Object.entries(STATUS).map(([v, t]) => chip(v, t))));
  el.append(h("div", { class: "card" }, h("div", { class: "row between", style: "margin-bottom:8px" }, h("p", { class: "muted small" }, `${cs.length} cliente(s)`), vistaToggle("clientes")),
    cs.length ? (vista("clientes") === "tabela" ? tabelaClientes(cs) : listaPessoas(cs)) : vazio("people", "Nenhum cliente aqui", "Quando alguém se identificar numa apresentação, aparece na hora.")));
  return el;
}
async function telaCliente(id) {
  const c = await api("GET", "/api/clientes/" + id);
  const bs = dono() ? await api("GET", "/api/brokers") : [];
  const contato = [c.phone && fone(c.phone), c.email].filter(Boolean);
  const el = h("div", { class: "stack", style: "max-width:960px" }, voltar("clientes", "Clientes"),
    h("div", { class: "card hero-p" }, avatar(c.name, "lg"), h("div", { style: "flex:1;min-width:0" },
      h("div", { class: "row", style: "gap:8px" }, h("h1", { class: "wrap" }, c.name), statusPill(c.status)),
      h("p", { class: "muted wrap" }, contato.join(" · ") || "Sem contato informado"),
      h("div", { class: "row", style: "margin-top:12px" }, c.phone && h("a", { class: "btn primary", target: "_blank", rel: "noopener", href: wa(c.phone, `Olá ${c.name.split(" ")[0]}, aqui é ${c.corretor} sobre o ${c.empreendimento}.`) }, ic("phone"), "WhatsApp"),
        c.email && h("a", { class: "btn", href: "mailto:" + c.email }, "E-mail"),
        h("select", { "aria-label": "Situação", class: "sel-status", onchange: async (e) => { await api("PATCH", `/api/clientes/${c.id}`, { status: e.target.value }); aviso("Situação atualizada."); } }, Object.entries(STATUS).map(([v, t]) => h("option", { value: v, selected: v === c.status }, t)))))),
    h("div", { class: "card origem" }, h("div", { class: "row between" }, h("div", { class: "row" }, avatar(c.corretor, "sm"), h("div", null, h("span", { class: "eyebrow" }, "Corretor de origem (comissão)"), h("div", { class: "cell-main" }, c.corretor), h("div", { class: "muted small" }, `Entrou por ${CANAIS[c.channel] || "link"} em ${dataHora(c.created)} · ${c.empreendimento}`))),
      dono() && bs.length > 1 && h("div", { class: "row", style: "gap:8px" }, h("button", { class: "btn sm", onclick: () => transferir(c, bs) }, ic("swap"), "Transferir"), h("button", { class: "btn sm", onclick: () => dividir(c, bs) }, ic("users"), "Dividir comissão"))),
      h("div", { class: "shares" }, (c.shares && c.shares.length ? c.shares : [{ name: c.corretor, pct: 100, broker_id: c.broker_id }]).map((s) => h("span", { class: "pill" + (s.broker_id === c.broker_id ? " on" : "") }, `${s.name} · ${s.pct}%`))),
      c.outros_corretores > 0 && h("p", { class: "alerta" }, "Este cliente também abriu links de outro corretor. Pela regra, continua de quem começou; as aberturas abaixo mostram por qual link entrou cada vez.")),
    h("div", { class: "kpis" }, h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(c.aberturas)), h("span", { class: "l" }, "aberturas")), h("div", { class: "card kpi" }, h("span", { class: "n" }, c.primeira ? quando(c.primeira) : "—"), h("span", { class: "l" }, "primeira abertura")),
      h("div", { class: "card kpi" }, h("span", { class: "n" }, c.ultima ? quando(c.ultima) : "—"), h("span", { class: "l" }, "última vez")), h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(c.perguntas)), h("span", { class: "l" }, "perguntas à IA"))),
    h("div", { class: "cols2" },
      h("div", { class: "card" }, h("h2", null, "Histórico de aberturas"), c.historico.length ? h("div", { class: "timeline" }, c.historico.map((o) => h("div", { class: "tl" }, h("span", { class: "tl-dot" + (o.broker_id !== c.broker_id ? " warn" : "") }),
        h("div", null, h("div", { class: "cell-main" }, dataHora(o.ts)), h("div", { class: "muted small wrap" }, [o.empreendimento, o.device, o.segundos > 30 ? "ficou " + dur(o.segundos) : null, o.broker_id !== c.broker_id ? "link de " + o.corretor : CANAIS[o.channel]].filter(Boolean).join(" · ")))))) : vazio("eye", "Nenhuma abertura registrada")),
      h("div", { class: "stack" },
        h("div", { class: "card" }, h("h2", null, "Recado do cliente"), h("p", { class: "wrap muted", style: "white-space:pre-wrap" }, c.message || "Não deixou recado.")),
        h("form", { class: "card stack", novalidate: true, onsubmit: async (e) => { e.preventDefault(); await api("PATCH", `/api/clientes/${c.id}`, { notes: new FormData(e.target).get("notes") }); aviso("Anotações salvas."); } },
          h("h2", null, "Anotações"), h("textarea", { name: "notes", rows: 5, maxlength: 2000, "aria-label": "Anotações" }, c.notes || ""), h("div", null, h("button", { class: "btn", type: "submit" }, "Salvar anotações"))),
        c.perguntas_lista.length ? h("div", { class: "card" }, h("h2", null, "O que perguntou à IA"), c.perguntas_lista.map((x) => h("div", { class: "qa" }, h("span", { class: "q wrap" }, x.question), x.answer && h("span", { class: "a wrap" }, x.answer), h("span", { class: "muted small" }, quando(x.ts))))) : null)));
  return el;
}
function dividir(c, bs) {
  const ativos = bs.filter((b) => b.active);
  const linhas = (c.shares && c.shares.length ? c.shares : [{ broker_id: c.broker_id, pct: 100 }]).map((s) => ({ ...s }));
  const lista = h("div", { class: "stack", style: "gap:8px" }), soma = h("p", { class: "small" });
  function atualizar() { const s = linhas.reduce((a, l) => a + (l.pct || 0), 0); soma.textContent = `Soma: ${s}%` + (s === 100 ? "" : " — precisa dar 100%"); soma.className = "small " + (s === 100 ? "muted" : "err"); soma.style.display = "block"; }
  function desenhar() {
    lista.replaceChildren(...linhas.map((l, i) => h("div", { class: "row", style: "flex-wrap:nowrap" },
      h("select", { "aria-label": "Corretor", style: "flex:1;min-width:0", onchange: (e) => { l.broker_id = Number(e.target.value); } }, ativos.map((b) => h("option", { value: b.id, selected: b.id === l.broker_id }, b.name))),
      h("input", { type: "number", min: 1, max: 100, value: l.pct, "aria-label": "Porcentagem", style: "width:88px", oninput: (e) => { l.pct = Number(e.target.value) || 0; atualizar(); } }), h("span", { class: "muted" }, "%"),
      linhas.length > 1 ? h("button", { type: "button", class: "btn sm icon ghost", "aria-label": "Remover", onclick: () => { linhas.splice(i, 1); desenhar(); } }, ic("x")) : null)));
    atualizar();
  }
  desenhar();
  dialogo("Dividir comissão", [h("p", { class: "muted" }, `Quem recebe a comissão de ${c.name}. Os corretores da divisão passam a ver este cliente. A origem continua ${c.corretor}.`), lista, soma,
    h("div", null, h("button", { type: "button", class: "btn sm", onclick: () => { if (linhas.length >= 6) return; const b = ativos.find((x) => !linhas.some((l) => l.broker_id === x.id)) || ativos[0]; linhas.push({ broker_id: b.id, pct: 0 }); desenhar(); } }, ic("plus"), "Adicionar corretor")),
    h("p", { class: "hint" }, "Para voltar a 100% do corretor de origem, deixe só ele com 100.")],
    [btnFechar(), btnOk("Salvar divisão")], { onSubmit: async (f, fechar) => {
      const sh = linhas.filter((l) => l.pct > 0).map((l) => ({ broker_id: l.broker_id, pct: l.pct }));
      const so = sh.length === 1 && sh[0].broker_id === c.broker_id && sh[0].pct === 100;
      await api("PATCH", `/api/clientes/${c.id}`, { shares: so ? [] : sh }); fechar(); aviso("Divisão salva."); rotear(); } });
}
function transferir(c, bs) {
  dialogo("Transferir cliente", [h("p", null, `${c.name} pertence hoje a ${c.corretor}. Transferir muda quem recebe a comissão e quem aparece na apresentação. Fica registrado nas anotações.`),
    campo("Novo corretor", h("select", { name: "broker_id" }, bs.filter((b) => b.active && b.id !== c.broker_id).map((b) => h("option", { value: b.id }, b.name))))], [btnFechar(), btnOk("Transferir")],
    { onSubmit: async (f, fechar) => { await api("PATCH", `/api/clientes/${c.id}`, { broker_id: Number(f.get("broker_id")) }); fechar(); aviso("Cliente transferido."); rotear(); } });
}

// ───────── corretores ─────────
async function telaCorretores() {
  const bs = await api("GET", "/api/brokers");
  const el = h("div", { class: "stack" }, cabeca("Corretores", "Toque num corretor para ver os clientes dele.", vistaToggle("corretores"), h("button", { class: "btn primary", onclick: formCorretor }, ic("plus"), "Novo corretor")));
  if (!bs.length) { el.append(h("div", { class: "card" }, vazio("users", "Nenhum corretor ainda", "Cadastre o primeiro. Você define a senha ou deixa o painel gerar uma."))); return el; }
  if (vista("corretores") === "tabela") {
    el.append(h("div", { class: "card" }, h("p", { class: "muted small", style: "margin-bottom:8px" }, "Clique numa linha para ver os clientes do corretor aqui mesmo."), tabela([
      { t: "Corretor", v: (b) => h("div", { class: "row", style: "gap:10px;flex-wrap:nowrap" }, avatar(b.name, "sm"), h("div", { style: "min-width:0" }, h("a", { class: "cell-main wrap", href: "#/corretor/" + b.id }, b.name), h("div", { class: "cell-sub wrap" }, [b.email, b.phone && fone(b.phone)].filter(Boolean).join(" · ")))), cls: "main-cell" },
      { t: "Clientes", v: (b) => fmtN(b.clientes), cls: "num" }, { t: "Novos", v: (b) => fmtN(b.novos), cls: "num" }, { t: "Aberturas", v: (b) => fmtN(b.aberturas), cls: "num" }, { t: "Fechados", v: (b) => fmtN(b.fechados), cls: "num" },
      { t: "Links", v: (b) => fmtN(b.links), cls: "num" }, { t: "Última abertura", v: (b) => quando(b.ultima) }, { t: "Situação", v: (b) => pill(b.active ? "Ativo" : "Desativado", b.active ? "on" : "off") },
    ], bs, async (b) => { const d = await api("GET", "/api/brokers/" + b.id); return d.clientes_lista.length ? tabelaClientes(d.clientes_lista, { semCorretor: true }) : h("p", { class: "muted small" }, "Nenhum cliente ainda."); })));
    return el;
  }
  el.append(h("div", { class: "props" }, bs.map((b) => h("a", { class: "card corretor" + (b.active ? "" : " off"), href: "#/corretor/" + b.id },
    h("div", { class: "row", style: "gap:12px;flex-wrap:nowrap" }, avatar(b.name), h("div", { style: "min-width:0;flex:1" }, h("h2", { class: "wrap", style: "margin:0" }, b.name, b.demo ? [" ", pill("exemplo")] : null), h("div", { class: "muted small wrap" }, [b.email, b.phone && fone(b.phone)].filter(Boolean).join(" · "))), !b.active && pill("Desativado", "off")),
    h("div", { class: "stats" }, h("div", null, h("b", null, fmtN(b.clientes)), h("span", null, "clientes")), h("div", null, h("b", null, fmtN(b.novos)), h("span", null, "novos")), h("div", null, h("b", null, fmtN(b.aberturas)), h("span", null, "aberturas")), h("div", null, h("b", null, fmtN(b.fechados)), h("span", null, "fechados"))),
    h("div", { class: "muted small" }, "Última abertura " + quando(b.ultima))))));
  return el;
}
async function telaCorretor(id) {
  const b = await api("GET", "/api/brokers/" + id);
  const el = h("div", { class: "stack" }, voltar("corretores", "Corretores"),
    h("div", { class: "card hero-p" }, avatar(b.name, "lg"), h("div", { style: "flex:1;min-width:0" }, h("div", { class: "row", style: "gap:8px" }, h("h1", { class: "wrap" }, b.name), pill(b.active ? "Ativo" : "Desativado", b.active ? "on" : "off")),
      h("p", { class: "muted wrap" }, [b.email, b.phone && fone(b.phone)].filter(Boolean).join(" · ")),
      h("div", { class: "row", style: "margin-top:12px" }, h("button", { class: "btn sm", onclick: () => redefinir(b) }, "Nova senha"),
        h("button", { class: "btn sm" + (b.active ? " danger" : ""), onclick: async () => { await api("PATCH", `/api/brokers/${b.id}`, { active: !b.active }); aviso(b.active ? "Acesso desativado. Os links dele param de funcionar." : "Acesso reativado."); rotear(); } }, b.active ? "Desativar" : "Reativar"),
        h("a", { class: "btn sm", href: "/clientes.csv?corretor=" + b.id, download: "clientes.csv" }, ic("down"), "CSV dos clientes")))),
    h("div", { class: "kpis" }, h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.clientes)), h("span", { class: "l" }, "clientes")), h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.novos)), h("span", { class: "l" }, "novos para atender")),
      h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.aberturas)), h("span", { class: "l" }, "aberturas")), h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.fechados)), h("span", { class: "l" }, "fechados"))),
    h("div", { class: "card" }, h("h2", null, `Clientes de ${b.name.split(" ")[0]}`), b.clientes_lista.length ? listaPessoas(b.clientes_lista, { semCorretor: true }) : vazio("people", "Nenhum cliente ainda", "Quando alguém se identificar num link dele, aparece aqui.")),
    h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", null, "Links"), h("button", { class: "btn sm", onclick: () => formLink(null, [b], b.id) }, ic("plus"), "Novo link")), b.links.length ? tabelaLinks(b.links, true) : h("p", { class: "muted" }, "Sem links ainda.")));
  return el;
}
function mostrarSenha(nome, email, senha) {
  const msg = `Seu acesso ao Link Corretor:\n${location.origin}/painel/\nE-mail: ${email}\nSenha: ${senha}`;
  dialogo("Acesso criado", [h("p", null, `Passe estes dados para ${nome}. A senha aparece só agora; depois só dá para gerar outra.`), h("div", { class: "senha", tabindex: "0" }, senha),
    h("div", { class: "row" }, h("button", { class: "btn", onclick: () => copiar(msg, "Dados de acesso copiados.") }, ic("copy"), "Copiar dados"), h("a", { class: "btn", target: "_blank", rel: "noopener", href: wa("", msg) }, ic("send"), "Enviar pelo WhatsApp"))],
    [h("button", { type: "button", class: "btn primary", onclick: (e) => { const d = e.target.closest("dialog"); d.close(); d.remove(); } }, "Pronto")]);
}
function formCorretor() {
  dialogo("Novo corretor", [campo("Nome", h("input", { type: "text", name: "nome", required: true, autocomplete: "off" })), campo("E-mail (é o login)", h("input", { type: "email", name: "email", required: true, autocomplete: "off" })),
    campo("WhatsApp", h("input", { type: "tel", name: "telefone", placeholder: "(47) 99999-9999", autocomplete: "off" }), "Aparece para o cliente na apresentação."), campo("Senha inicial", h("input", { type: "text", name: "senha", autocomplete: "off", placeholder: "Deixe vazio para gerar" }), "Mínimo de 8 caracteres.")],
    [btnFechar(), btnOk("Criar acesso")], { onSubmit: async (f, fechar) => { const r = await api("POST", "/api/brokers", { nome: f.get("nome"), email: f.get("email"), telefone: f.get("telefone"), senha: f.get("senha") }); fechar(); mostrarSenha(f.get("nome"), f.get("email"), r.senha); rotear(); } });
}
async function redefinir(b) { if (!confirm(`Gerar uma nova senha para ${b.name}? A atual deixa de funcionar e ele será desconectado.`)) return; const r = await api("PATCH", `/api/brokers/${b.id}`, { nova_senha: true }); mostrarSenha(b.name, b.email, r.senha); }

// ───────── empreendimentos ─────────
async function telaProps() {
  const props = await api("GET", "/api/properties");
  const el = h("div", { class: "stack" }, cabeca("Empreendimentos", "A apresentação de cada um e o que a IA sabe sobre ele.", vistaToggle("props"), h("button", { class: "btn primary", onclick: () => formProp() }, ic("plus"), "Novo empreendimento")));
  if (!props.length) { el.append(h("div", { class: "card" }, vazio("building", "Nenhum empreendimento", "Cadastre o primeiro para poder gerar links."))); return el; }
  if (vista("props") === "tabela") {
    el.append(h("div", { class: "card" }, h("p", { class: "muted small", style: "margin-bottom:8px" }, "Clique numa linha para ver os clientes do empreendimento aqui mesmo."), tabela([
      { t: "Empreendimento", v: (p) => h("div", null, h("div", { class: "cell-main wrap" }, p.name), h("div", { class: "cell-sub wrap" }, p.city || "—")), cls: "main-cell" },
      { t: "Apresentação", v: (p) => p.tem_apresentacao ? pill(p.external_url ? "Link externo" : "3D", "on") : pill("Sem", "warn") }, { t: "IA", v: (p) => p.ai_on ? "Ligada" : "Desligada" },
      { t: "Idiomas", v: (p) => p.languages.map((l) => l.split("-")[0].toUpperCase()).join(" · ") },
      { t: "Clientes", v: (p) => fmtN(p.clientes), cls: "num" }, { t: "Aberturas", v: (p) => fmtN(p.aberturas), cls: "num" }, { t: "Links", v: (p) => fmtN(p.links), cls: "num" },
      { t: "Situação", v: (p) => pill(p.active ? "Ativo" : "Pausado", p.active ? "on" : "off") },
      { t: "", v: (p) => h("div", { class: "row", style: "gap:6px;justify-content:flex-end" }, p.tem_apresentacao && h("a", { class: "btn sm", href: p.external_url || `/pre/${p.id}/`, target: "_blank", rel: "noopener", "aria-label": "Ver apresentação" }, ic("ext")), h("button", { class: "btn sm", "aria-label": "Editar", onclick: () => formProp(p) }, ic("edit"))), cls: "acoes" },
    ], props, async (p) => { const cs = await api("GET", "/api/clientes?empreendimento=" + p.id); return cs.length ? tabelaClientes(cs) : h("p", { class: "muted small" }, "Nenhum cliente ainda."); })));
    return el;
  }
  el.append(h("div", { class: "props" }, props.map((p) => h("article", { class: "card prop" },
    h("div", { class: "row between", style: "align-items:flex-start" }, h("div", { style: "min-width:0" }, h("h2", { class: "wrap", style: "margin:0" }, p.name), h("span", { class: "muted small wrap" }, p.city || "Cidade não informada")), pill(p.active ? "Ativo" : "Pausado", p.active ? "on" : "off")),
    h("div", { class: "chips" }, p.tem_apresentacao ? pill(p.external_url ? "Link externo" : "Apresentação 3D", "on") : pill("Sem apresentação", "warn"), pill(p.ai_on ? "IA ligada" : "IA desligada"), pill(p.languages.map((l) => l.split("-")[0].toUpperCase()).join(" · "))),
    h("div", { class: "stats" }, h("div", null, h("b", null, fmtN(p.clientes)), h("span", null, "clientes")), h("div", null, h("b", null, fmtN(p.aberturas)), h("span", null, "aberturas")), h("div", null, h("b", null, fmtN(p.links)), h("span", null, "links"))),
    h("div", { class: "row" }, p.tem_apresentacao && h("a", { class: "btn sm", href: p.external_url || `/pre/${p.id}/`, target: "_blank", rel: "noopener" }, ic("ext"), "Ver apresentação"), h("button", { class: "btn sm", onclick: () => formProp(p) }, ic("edit"), "Editar"), h("a", { class: "btn sm", href: "#/clientes?empreendimento=" + p.id }, ic("people"), "Clientes"))))));
  return el;
}
async function formProp(p) {
  const novo = !p; p = p || { name: "", city: "", facts: "", whatsapp: "", ai_on: 1, form_on: 1, active: 1, languages: ["pt-BR"], source_dir: "", external_url: "", recursos: {} };
  const REC = [["sol", "Posição solar"], ["mapa", "Mapa com distâncias"], ["selo", "Selo do corretor que atende"], ["proposta", "Simulador de proposta"], ["unidades", "Tabela de unidades"], ["whatsapp", "WhatsApp do corretor"], ["ia", "Perguntas à IA"], ["cadastro", "Cadastro do cliente (3ª interação)"]];
  const rec = p.recursos || {};
  let fontes = []; try { fontes = await api("GET", "/api/sources"); } catch { /* segue */ }
  if (p.source_dir && !fontes.includes(p.source_dir)) fontes.unshift(p.source_dir);
  const corpo = [h("div", { class: "grid2" }, campo("Nome", h("input", { type: "text", name: "name", value: p.name, required: true })), campo("Cidade ou região", h("input", { type: "text", name: "city", value: p.city }))),
    campo("Apresentação 3D", h("select", { name: "source_dir" }, h("option", { value: "" }, "Nenhuma (usar link externo)"), fontes.map((f) => h("option", { value: f, selected: f === p.source_dir }, f.split("/").slice(-2).join(" / ")))), "Pastas de apresentação encontradas dentro do projeto."),
    campo("Ou link externo", h("input", { type: "text", name: "external_url", value: p.external_url || "", placeholder: "https://…", inputmode: "url" }), "Se a apresentação já está publicada em outro lugar. Nesse caso o cadastro, a faixa do corretor e a IA não aparecem."),
    campo("WhatsApp do empreendimento", h("input", { type: "tel", name: "whatsapp", value: p.whatsapp ? fone(p.whatsapp) : "", placeholder: "(47) 99999-9999" }), "Usado quando o corretor não tem WhatsApp cadastrado."),
    h("div", { class: "field" }, h("span", { class: "lbl" }, "Idiomas da IA"), h("div", { class: "caixas" }, [["pt-BR", "Português"], ["en", "English"], ["es", "Español"]].map(([c, t]) => caixa(t, p.languages.includes(c), "lang-" + c)))),
    h("div", { class: "field" }, h("span", { class: "lbl" }, "Recursos na apresentação"), h("div", { class: "caixas" }, REC.map(([k, t]) => caixa(t, rec[k] !== false, "rec-" + k))), h("small", { class: "help" }, "Tudo ligado por padrão. Desligue o que não quiser mostrar neste empreendimento; vale para todos os links dele.")),
    h("div", { class: "field" }, caixa("Empreendimento ativo (links funcionam)", p.active, "active")),
    campo("O que a IA sabe", h("textarea", { name: "facts", rows: 10, placeholder: "Tipologias, metragens, preços, condições de pagamento, áreas comuns, localização…" }, p.facts || ""), "Única fonte da IA: responde só com isso e manda falar com o corretor quando não souber. Mantenha preços e disponibilidade em dia.")];
  dialogo(novo ? "Novo empreendimento" : "Editar empreendimento", corpo, [btnFechar(), btnOk("Salvar")], { onSubmit: async (f, fechar) => {
    const corpoApi = { name: f.get("name"), city: f.get("city"), whatsapp: f.get("whatsapp"), languages: ["pt-BR", "en", "es"].filter((c) => f.get("lang-" + c)), recursos: Object.fromEntries(REC.map(([k]) => [k, f.get("rec-" + k) === "on"])), ai_on: f.get("rec-ia") === "on", form_on: f.get("rec-cadastro") === "on", active: f.get("active") === "on", facts: f.get("facts"), source_dir: f.get("source_dir"), external_url: f.get("external_url") };
    await (novo ? api("POST", "/api/properties", corpoApi) : api("PATCH", `/api/properties/${p.id}`, corpoApi)); fechar(); aviso("Empreendimento salvo."); rotear(); } });
}

// ───────── links ─────────
function tabelaLinks(links, compacto) {
  return h("table", { class: "t" }, h("thead", null, h("tr", null, ["Link", !compacto && dono() ? "Corretor" : null, "Canal", "Cliques", "Clientes", "Aberturas", ""].filter((x) => x !== null).map((t) => h("th", { class: ["Cliques", "Clientes", "Aberturas"].includes(t) ? "num" : "" }, t)))),
    h("tbody", null, links.map((l) => h("tr", { class: l.active ? "" : "muted" },
      h("td", { class: "main-cell" }, h("div", { class: "cell-main wrap" }, l.empreendimento, !l.active && " ", !l.active && pill("pausado", "off")), h("div", { class: "cell-sub wrap mono" }, [l.label, `/r/${l.code}`].filter(Boolean).join(" · "))),
      !compacto && dono() && h("td", { "data-l": "Corretor", class: "wrap" }, l.corretor), h("td", { "data-l": "Canal" }, CANAIS[l.channel] || l.channel),
      h("td", { class: "num", "data-l": "Cliques" }, fmtN(l.cliques)), h("td", { class: "num", "data-l": "Clientes" }, fmtN(l.clientes)), h("td", { class: "num", "data-l": "Aberturas" }, fmtN(l.aberturas)),
      h("td", { class: "acoes" }, h("button", { class: "btn sm", onclick: () => copiar(urlLink(l.code), "Link copiado.") }, ic("copy"), "Copiar"), h("button", { class: "btn sm", onclick: () => mostrarQr(l) }, ic("qr"), "QR"),
        h("a", { class: "btn sm", target: "_blank", rel: "noopener", href: wa("", `Olá! Preparei uma apresentação interativa do ${l.empreendimento} para você: ${urlLink(l.code)}`) }, ic("send"), "WhatsApp"),
        h("button", { class: "btn sm ghost", onclick: async () => { await api("PATCH", `/api/links/${l.id}`, { active: !l.active }); aviso(l.active ? "Link pausado." : "Link reativado."); rotear(); } }, l.active ? "Pausar" : "Reativar"))))));
}
async function telaLinks() {
  const [links, props, bs] = await Promise.all([api("GET", "/api/links"), api("GET", "/api/properties"), dono() ? api("GET", "/api/brokers") : []]);
  const el = h("div", { class: "stack" }, cabeca(dono() ? "Links" : "Meus links", "Cada link identifica o corretor e o canal. O cliente se cadastra na primeira abertura.", h("button", { class: "btn primary", onclick: () => formLink(props.filter((p) => p.active), bs) }, ic("plus"), "Novo link")));
  el.append(h("div", { class: "card" }, links.length ? tabelaLinks(links) : vazio("link", "Nenhum link ainda", "Crie um por empreendimento e canal (WhatsApp, Instagram, QR…)."))); return el;
}
async function formLink(props, bs, brokerFixo) {
  props = props || (await api("GET", "/api/properties")).filter((p) => p.active);
  if (!props.length) { aviso("Cadastre ou ative um empreendimento antes de gerar links.", true); return; }
  const corpo = [campo("Empreendimento", h("select", { name: "property_id" }, props.map((p) => h("option", { value: p.id }, p.name))))];
  if (dono() && !brokerFixo) { const ativos = bs.filter((b) => b.active); if (!ativos.length) { aviso("Cadastre um corretor ativo antes de gerar links.", true); return; } corpo.push(campo("Corretor", h("select", { name: "broker_id" }, ativos.map((b) => h("option", { value: b.id }, b.name))))); }
  corpo.push(campo("Canal", h("select", { name: "channel" }, Object.entries(CANAIS).map(([v, t]) => h("option", { value: v }, t))), "Onde você vai compartilhar."), campo("Rótulo (opcional)", h("input", { type: "text", name: "label", placeholder: "Ex.: grupo da família, story de domingo", maxlength: 80 })));
  dialogo("Novo link", corpo, [btnFechar(), btnOk("Gerar link")], { onSubmit: async (f, fechar) => {
    const r = await api("POST", "/api/links", { property_id: Number(f.get("property_id")), broker_id: brokerFixo || (f.get("broker_id") ? Number(f.get("broker_id")) : undefined), channel: f.get("channel"), label: f.get("label") });
    fechar(); await rotear(); const l = (await api("GET", "/api/links")).find((x) => x.code === r.code); l && mostrarQr(l, true); } });
}
function svgQr(url) { const q = qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 6, margin: 0, scalable: true }); }
function mostrarQr(l, novo) {
  const url = urlLink(l.code), caixaQr = h("div", { class: "qr", role: "img", "aria-label": `QR Code do link de ${l.empreendimento}` }); caixaQr.innerHTML = svgQr(url);
  dialogo(novo ? "Link criado" : "QR Code do link", [h("p", { class: "muted" }, `${l.empreendimento} · ${CANAIS[l.channel] || l.channel}${l.label ? " · " + l.label : ""}`), caixaQr, h("div", { class: "linkbox" }, h("code", null, url), h("button", { class: "btn sm", onclick: () => copiar(url, "Link copiado.") }, ic("copy"), "Copiar"))],
    [h("button", { type: "button", class: "btn", onclick: () => baixarQr(caixaQr, `qr-${l.code}.png`) }, ic("down"), "Baixar PNG"), h("a", { class: "btn primary", target: "_blank", rel: "noopener", href: wa("", `Olá! Preparei uma apresentação interativa do ${l.empreendimento} para você: ${url}`) }, ic("send"), "Enviar no WhatsApp")]);
}
function baixarQr(caixaQr, nome) {
  const svg = caixaQr.querySelector("svg"), vb = svg.viewBox.baseVal.width || 200, img = new Image(), xml = new XMLSerializer().serializeToString(svg);
  img.onload = () => { const c = h("canvas", { width: 1024, height: 1024 }), x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 1024, 1024); x.imageSmoothingEnabled = false; x.drawImage(img, 32, 32, 960, 960);
    c.toBlob((b) => { const a = h("a", { href: URL.createObjectURL(b), download: nome }); document.body.append(a); a.click(); a.remove(); }, "image/png"); };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml.replace("<svg", `<svg width="${vb}" height="${vb}"`));
}

// ───────── perguntas, configurações, conta ─────────
async function telaPerguntas() {
  const qs = await api("GET", "/api/questions");
  const el = h("div", { class: "stack" }, cabeca("Perguntas à IA", "O que os clientes querem saber. Cada pergunta está ligada a um cliente identificado."));
  if (!qs.length) { el.append(h("div", { class: "card" }, vazio("chat", "Nenhuma pergunta ainda"))); return el; }
  const sem = qs.filter((x) => !x.answer).length;
  if (sem) el.append(h("div", { class: "card alerta-card" }, `${sem} pergunta(s) ficaram sem resposta (limite do mês ou falha da IA). Vale retornar para esses clientes.`));
  // conversas: uma por cliente, em balões (cliente à direita, IA à esquerda), da mais recente para a mais antiga
  const por = new Map();
  qs.forEach((x) => { const k = x.visitor_id; if (!por.has(k)) por.set(k, { cliente: x.cliente, visitor_id: k, empreendimento: x.empreendimento, corretor: x.corretor, ts: x.ts, itens: [] }); por.get(k).itens.push(x); });
  const convs = [...por.values()];
  convs.forEach((c) => c.itens.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : a.id - b.id)));
  el.append(h("div", { class: "convs" }, convs.map((c) => h("article", { class: "card conv" },
    h("header", { class: "conv-h" }, avatar(c.cliente, "sm"), h("div", { style: "min-width:0;flex:1" }, h("a", { class: "cell-main", href: "#/cliente/" + c.visitor_id }, c.cliente), h("div", { class: "cell-sub wrap" }, `${c.empreendimento}${dono() ? " · " + c.corretor : ""}`)), h("span", { class: "muted small" }, quando(c.ts))),
    h("div", { class: "conv-b" }, c.itens.map((x) => [
      h("div", { class: "msg cli" }, h("span", { class: "wrap" }, x.question)),
      x.answer ? h("div", { class: "msg ia" }, h("span", { class: "msg-quem" }, "IA"), h("span", { class: "wrap" }, x.answer)) : h("div", { class: "msg ia sem" }, pill("sem resposta", "warn"), h("span", { class: "muted small" }, "Limite do mês ou falha da IA. Vale retornar para este cliente."))]))))));
  return el;
}
async function telaConfig() {
  const c = await api("GET", "/api/settings"), pct = c.ai_limite ? Math.min(100, Math.round((c.ai_usadas / c.ai_limite) * 100)) : 100;
  return h("div", { class: "stack", style: "max-width:720px" }, cabeca("Configurações"),
    h("form", { class: "card stack", novalidate: true, onsubmit: async (e) => { e.preventDefault(); const f = new FormData(e.target); try { await api("PATCH", "/api/settings", { empresa: f.get("empresa"), ai_limite: Number(f.get("ai_limite")), notify_min: Number(f.get("notify_min")) }); S.empresa = f.get("empresa"); aviso("Configurações salvas."); rotear(); } catch (x) { aviso(x.message, true); } } },
      h("h2", null, "Empresa e IA"), campo("Nome da empresa", h("input", { type: "text", name: "empresa", value: c.empresa, required: true }), "Aparece no painel, no cadastro do cliente e no aceite."),
      blocoLogo(c),
      campo("Aviso de cliente novo, depois de quantos minutos", h("input", { type: "number", name: "notify_min", min: 0, max: 120, value: c.notify_min }), "O painel avisa que o cliente abriu, se cadastrou e de qual corretor veio. Padrão: 5 minutos."),
      campo("Perguntas à IA por mês, por empreendimento", h("input", { type: "number", name: "ai_limite", min: 0, max: 100000, value: c.ai_limite }), "Passou do teto, a IA para e manda falar com o corretor."),
      h("div", null, h("div", { class: "row between small" }, h("span", null, "Uso neste mês"), h("strong", null, fmtN(c.ai_usadas))), h("div", { class: "bar", style: "margin-top:6px" }, h("i", { style: `width:${pct}%` }))),
      !c.claude_cli && h("p", { class: "err", style: "display:block" }, "O Claude Code não foi encontrado neste computador: as perguntas à IA ficam sem resposta."), h("div", null, h("button", { class: "btn primary", type: "submit" }, "Salvar"))),
    blocoVisual(),
    h("div", { class: "card stack" }, h("h2", null, "Regra da comissão"), h("p", { class: "muted" }, "O cliente pertence ao primeiro corretor por quem se identificou. Se abrir o link de outro corretor, a abertura é registrada no nome dele, mas a origem não muda. Só o dono transfere um cliente, na página do cliente.")),
    h("div", { class: "card stack" }, h("h2", null, "Dados de exemplo"), h("p", { class: "muted" }, c.exemplo ? "Há corretores, clientes e aberturas fictícios no painel (marcados como “exemplo”)." : "Carregue corretores, clientes e aberturas fictícios para ver o painel cheio."),
      c.exemplo && h("label", { class: "check" }, h("input", { type: "checkbox", checked: c.fluxo, onchange: async (e) => { const r = await api("POST", "/api/exemplo", { fluxo: e.target.checked }); aviso(r.fluxo ? "Cadastros simulados ligados: enquanto o painel estiver aberto, chega um cliente novo a cada 1–2 minutos." : "Cadastros simulados desligados."); } }),
        h("span", null, "Simular cadastros enquanto o painel está aberto", h("span", { class: "hint", style: "display:block" }, "Só demonstração: a cada 1–2 minutos um cliente fictício abre, se cadastra por um corretor de exemplo e, às vezes, conversa com a IA. O aviso aparece aqui no painel."))),
      c.exemplo && h("div", null, h("button", { class: "btn sm", onclick: async () => { const r = await api("POST", "/api/exemplo", { cliente: true }); aviso(r.cliente ? `${r.cliente.nome} acabou de se cadastrar (simulação).` : "Nenhum corretor de exemplo disponível."); } }, "Simular um cadastro agora")),
      h("div", null, c.exemplo ? h("button", { class: "btn danger", onclick: async () => { if (!confirm("Apagar os corretores de exemplo e tudo que veio com eles?")) return; const r = await api("POST", "/api/exemplo", { remover: true }); aviso(`${r.removidos} corretor(es) de exemplo removido(s).`); rotear(); } }, "Apagar dados de exemplo")
        : h("button", { class: "btn", onclick: async () => { const r = await api("POST", "/api/exemplo", {}); aviso(`${r.criados} corretores de exemplo criados. Senha: corretor123.`); rotear(); } }, "Carregar dados de exemplo"))));
}
// Visual do painel: "novo" (tema-painel.css, inspirado no Sábio) ou "classico" (só painel.css). Fica no navegador (localStorage lc.visual); index.html lê antes de pintar.
function visualAtual() { try { return localStorage.getItem("lc.visual") === "classico" ? "classico" : "novo"; } catch (e) { return "novo"; } }
function blocoVisual() {
  const chips = h("div", { class: "chips", role: "group", "aria-label": "Visual do painel" });
  const pintar = () => { const v = visualAtual(); chips.replaceChildren(...[["novo", "Novo"], ["classico", "Clássico"]].map(([k, t]) => h("button", { type: "button", class: "chip", "aria-pressed": String(v === k), onclick: () => {
    try { localStorage.setItem("lc.visual", k); } catch (e) {}
    const l = document.getElementById("tema-novo"); if (l) l.disabled = k === "classico";
    pintar(); aviso(k === "novo" ? "Visual novo ligado." : "Visual clássico ligado."); } }, t))); };
  pintar();
  // modo de cor: automático (segue o sistema), claro ou escuro — index.html aplica em data-modo; vale para o visual Novo
  const modos = h("div", { class: "chips", role: "group", "aria-label": "Modo de cor" });
  const modoAtual = () => { try { return localStorage.getItem("lc.modo") || "light"; } catch (e) { return "light"; } };
  const pintarModo = () => { const v = modoAtual(); modos.replaceChildren(...[["light", "Claro"], ["dark", "Escuro"], ["auto", "Automático"]].map(([k, t]) => h("button", { type: "button", class: "chip", "aria-pressed": String(v === k), onclick: () => {
    try { localStorage.setItem("lc.modo", k); } catch (e) {}
    if (window.LC_APLICAR_MODO) window.LC_APLICAR_MODO(); pintarModo(); } }, t))); };
  pintarModo();
  return h("div", { class: "card stack" }, h("h2", null, "Visual do painel"), h("p", { class: "muted" }, "Novo: barra ardósia, acento esmeralda e cartões com borda. Clássico: verde-escuro e latão. A escolha vale só neste navegador."), chips,
    h("div", { class: "lbl", style: "margin-top:4px" }, "Modo de cor"), h("p", { class: "muted small" }, "Padrão: Claro. Automático segue o sistema. Vale para o visual Novo (o Clássico segue sempre o sistema)."), modos);
}
function blocoLogo(c) {
  const formas = [["round", "Redonda"], ["square", "Quadrada 1:1"], ["wide", "Horizontal"], ["tall", "Vertical"]];
  const el = h("div", { class: "field" }, h("span", { class: "lbl" }, "Logo da empresa"),
    h("div", { class: "row", style: "gap:14px" }, c.logo ? h("img", { class: "logo-img logo-prev shape-" + (c.logo_shape || "round"), src: c.logo, alt: "" }) : h("span", { class: "av lg" }, ini(c.empresa)),
      h("label", { class: "btn" }, ic("image"), c.logo ? "Trocar logo" : "Enviar logo", h("input", { type: "file", accept: "image/png,image/jpeg,image/webp", class: "sr", onchange: (e) => enviarLogo(e.target.files[0]) })),
      c.logo && h("button", { type: "button", class: "btn ghost danger", onclick: async () => { await api("PATCH", "/api/settings", { logo: "" }); S.logo = ""; aviso("Logo removida."); casca(); rotear(); } }, "Remover")),
    h("span", { class: "hint" }, "PNG, JPG ou WebP, de preferência com fundo transparente. Escolha o formato depois de enviar."));
  if (c.logo) {
    el.append(h("span", { class: "lbl", style: "margin-top:6px" }, "Formato"), h("div", { class: "chips" }, formas.map(([v, tx]) => h("button", { type: "button", class: "chip", "aria-pressed": String((c.logo_shape || "round") === v), onclick: async () => { await api("PATCH", "/api/settings", { logo_shape: v }); S.logoShape = v; aviso("Formato salvo."); casca(); rotear(); } }, tx))));
    const cores = h("div", { class: "stack", style: "gap:10px" }, h("span", { class: "muted small" }, "Lendo as cores…")); el.append(h("span", { class: "lbl", style: "margin-top:6px" }, "Cores do painel"), cores);
    coresDaLogo(c.logo).then((r) => {
      if (!r || !r.acento) { cores.replaceChildren(h("span", { class: "muted small" }, "Não encontrei cores na logo.")); return; }
      const paleta = [...new Set([...r.todas, "#16302e", "#c9944a", "#f3efe6"])];
      let papel = "accent";
      const tema = c.theme ? { ...c.theme } : { accent: r.acento, bar: r.escura || "#16302e", button: r.escura || "#16302e" };
      const salvo = JSON.stringify(c.theme);
      function desenhar() {
        const chips = h("div", { class: "chips" }, PAPEIS.map(([k, tx]) => h("button", { type: "button", class: "chip", "aria-pressed": String(papel === k), onclick: () => { papel = k; desenhar(); } }, h("span", { class: "sw xs", style: "background:" + tema[k] }), tx)));
        const sws = h("div", { class: "swatches" }, paleta.map((x) => { const usos = PAPEIS.filter(([k]) => tema[k] === x).map(([k]) => ({ accent: "A", bar: "Ba", button: "Bo" }[k]));
          return h("button", { type: "button", class: "sw-btn", title: `${x} → ${PAPEIS.find(([k]) => k === papel)[1]}`, "aria-label": `Usar ${x} como ${PAPEIS.find(([k]) => k === papel)[1]}`, onclick: () => { tema[papel] = x; aplicarTema(tema); desenhar(); } },
            h("span", { class: "sw", style: "background:" + x }), h("small", null, usos.join("")));
        }));
        const alterado = JSON.stringify(tema) !== salvo;
        const acoes = h("div", { class: "row" },
          h("button", { type: "button", class: "btn sm primary", disabled: !alterado, onclick: async () => { await api("PATCH", "/api/settings", { theme: tema }); S.theme = { ...tema }; aviso("Cores salvas."); rotear(); } }, "Salvar cores"),
          h("button", { type: "button", class: "btn sm", onclick: () => { const t2 = { accent: r.acento, bar: r.escura || "#16302e", button: r.escura || "#16302e" }; Object.assign(tema, t2); aplicarTema(tema); desenhar(); } }, "Sugestão da logo"),
          c.theme && h("button", { type: "button", class: "btn sm ghost", onclick: async () => { await api("PATCH", "/api/settings", { theme: null }); S.theme = null; aplicarTema(null); aviso("Cores padrão restauradas."); casca(); rotear(); } }, "Voltar ao padrão"),
          alterado && h("button", { type: "button", class: "btn sm ghost", onclick: () => { aplicarTema(S.theme); casca(); rotear(); } }, "Descartar"));
        cores.replaceChildren(h("span", { class: "hint" }, "1. Escolha o papel. 2. Clique numa cor. A prévia é imediata; salve quando gostar. O texto fica branco ou escuro sozinho."), chips, sws, acoes);
      }
      desenhar();
    });
  }
  return el;
}
function enviarLogo(f) {
  if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = async () => {
    const M = 512, k = Math.min(1, M / Math.max(img.width, img.height)), w = Math.round(img.width * k), hh = Math.round(img.height * k);
    const c = h("canvas", { width: w, height: hh }), x = c.getContext("2d"); x.drawImage(img, 0, 0, w, hh); URL.revokeObjectURL(url);
    const png = f.type === "image/png" || f.type === "image/webp", data = c.toDataURL(png ? "image/png" : "image/jpeg", .88);
    const forma = img.width > img.height * 1.4 ? "wide" : img.height > img.width * 1.4 ? "tall" : (S.logoShape || "round");
    try { await api("PATCH", "/api/settings", { logo: data, logo_shape: forma }); S.logo = data; S.logoShape = forma; aviso("Logo salva. Escolha o formato abaixo."); casca(); rotear(); } catch (e) { aviso(e.message, true); }
  };
  img.onerror = () => aviso("Não consegui ler a imagem.", true); img.src = url;
}
async function telaConta() {
  return h("div", { class: "stack", style: "max-width:520px" }, cabeca("Minha conta"),
    h("div", { class: "card hero-p" }, avatar(S.me.name, "lg"), h("div", null, h("strong", { class: "wrap" }, S.me.name), h("div", { class: "muted wrap" }, S.me.email), h("div", { class: "muted small" }, dono() ? "Dono" : "Corretor"))),
    h("form", { class: "card stack", novalidate: true, onsubmit: async (e) => { e.preventDefault(); const f = new FormData(e.target); try { await api("POST", "/api/me/senha", { atual: f.get("atual"), nova: f.get("nova") }); aviso("Senha alterada."); e.target.reset(); } catch (x) { aviso(x.message, true); } } },
      h("h2", null, "Trocar senha"), campo("Senha atual", h("input", { type: "password", name: "atual", autocomplete: "current-password", required: true })), campo("Nova senha", h("input", { type: "password", name: "nova", autocomplete: "new-password", minlength: 8, required: true }), "Mínimo de 8 caracteres."),
      h("div", null, h("button", { class: "btn primary", type: "submit" }, "Trocar senha"))),
    h("div", null, h("button", { class: "btn", onclick: sair }, ic("out"), "Sair")));
}

// ───────── início e avisos ─────────
let _poll = null;
async function checar() {
  if (!S.me || document.hidden) return;
  try {
    const primeira = S.nv === null;
    const n = await api("GET", primeira ? "/api/notify?init=1" : `/api/notify?v=${S.nv}&o=${S.no}`);
    if (!primeira) {
      n.novos.forEach(avisoCliente);
      n.retornos.forEach((l) => aviso(`${l.name} voltou a abrir ${l.empreendimento}`));
      if ((n.novos.length || n.retornos.length) && ["", "clientes", "corretor"].includes(S.rota)) rotear();
    }
    S.nv = n.v; S.no = n.o;
  } catch { /* próximo ciclo */ }
}
function iniciar() { try { document.body.classList.toggle("sb-mini", localStorage.getItem("lc_sbmini") === "1"); } catch { /* sem storage */ } if (!location.hash) location.replace("#/"); S.nv = S.no = null; rotear(); checar(); clearInterval(_poll); _poll = setInterval(checar, 12000); }
window.addEventListener("hashchange", rotear);
entrada();
