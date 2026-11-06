/* Link Corretor — painel (dono e corretor), centrado em CLIENTES identificados e no corretor de origem (comissão).
   JS puro, sem build. Todo texto vindo do servidor entra como texto, nunca como HTML. */
"use strict";

// Idiomas da IA: os 9 mais falados no mundo (código BCP 47, bandeira do país de referência, nome no próprio idioma). Mesma lista em IDIOMAS do servidor.
const IDIOMAS_IA = [["pt-BR", "br", "Português"], ["en", "us", "English"], ["es", "es", "Español"], ["zh", "cn", "中文"], ["hi", "in", "हिन्दी"], ["ar", "sa", "العربية"], ["fr", "fr", "Français"], ["bn", "bd", "বাংলা"], ["ru", "ru", "Русский"]];
const bandeira = (pais) => h("img", { class: "bandeira", src: `vendor/bandeiras/${pais}.png`, alt: "", width: 20, height: 15, loading: "lazy" });  // PNG local: o Windows não desenha emoji de bandeira
const ICONES = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  life: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
  book: '<path d="M12 6c-2-1.5-5-2-9-2v15c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2z"/><path d="M12 6v15"/>',
  hist: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
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
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', eyeOff: '<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  barras: '<path d="M6 20V11M12 20V4M18 20v-6"/>', linha: '<path d="M3 17l5-6 4 3 8-9"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="20" cy="5" r="1"/>',
  swap: '<path d="M4 7h12l-3-3M20 17H8l3 3"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const ic = (n) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ic"); s.setAttribute("aria-hidden", "true"); s.innerHTML = ICONES[n] || ""; return s; };
const tituloCard = (icone, texto) => h("h2", { class: "card-titulo" }, h("span", { class: "ic-box" }, ic(icone)), texto);
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
  $("#avisos").append(a); avisosNoTopo(); setTimeout(() => a.remove(), 60000);
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
// Os avisos ficam na "camada superior" do navegador (popover manual): um <dialog> modal também fica nela e nenhum z-index vence essa camada,
// então sem isto o aviso (erro, "Copiado.", cliente novo) aparecia ATRÁS da tela escura. Reabrir traz o contêiner para a frente.
function avisosNoTopo() { const c = document.getElementById("avisos"); try { if (c && c.showPopover) { if (c.matches(":popover-open")) c.hidePopover(); c.showPopover(); } } catch { /* navegador sem popover: fica como antes */ } }
function aviso(msg, erro) { const a = h("div", { class: "aviso" + (erro ? " erro" : ""), role: erro ? "alert" : "status" }, msg); $("#avisos").append(a); avisosNoTopo(); setTimeout(() => a.remove(), erro ? 6500 : 4500); }
async function copiar(txt, ok = "Copiado.") {
  try { await navigator.clipboard.writeText(txt); }
  catch { const t = h("textarea", { style: "position:fixed;opacity:0" }); t.value = txt; document.body.append(t); t.select(); try { document.execCommand("copy"); } catch { /* sem clipboard */ } t.remove(); }
  aviso(ok);
}

const fmtN = (n) => Number(n || 0).toLocaleString("pt-BR");
const brlN = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
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
const gestao = () => S.me && (S.me.role === "owner" || S.me.role === "manager");  // dono ou gerente de vendas
const papelNome = () => (S.me.role === "owner" ? "Dono" : S.me.role === "manager" ? "Gerente de vendas" : "Corretor");
const pill = (txt, cls) => h("span", { class: "pill " + (cls || "") }, txt);
const statusPill = (s) => pill(STATUS[s] || s, "s-" + s);
const ini = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
const avatar = (nome, cls, foto) => h("span", { class: "av " + (cls || "") + (foto ? " com-foto" : ""), "aria-hidden": "true" }, foto ? h("img", { src: foto, alt: "", loading: "lazy" }) : ini(nome));
const S_FOTO = { v: Date.now() };  // muda quando alguém troca a foto: força o navegador a buscar de novo
const fotoDe = (id, tem) => (tem ? `/api/foto/${id}?v=${S_FOTO.v}` : null);
// Foto 1:1: recorta o centro e reduz a 320 px (JPEG), pronta para /api/me/foto ou PATCH /api/brokers/<id> {foto}
const fotoQuadrada = (f) => new Promise((ok, erro) => { if (!f) return ok(null); const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { const lado = Math.min(img.width, img.height), M = 320, c = h("canvas", { width: M, height: M }); c.getContext("2d").drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, M, M); URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", .86)); };
  img.onerror = () => erro(new Error("Não consegui ler esta imagem.")); img.src = url; });
const escolherFoto = (aoEscolher) => { const i = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp", style: "display:none" }); i.onchange = async () => { try { const d = await fotoQuadrada(i.files[0]); if (d) await aoEscolher(d); } catch (e) { aviso(e.message, true); } i.remove(); }; document.body.append(i); i.click(); };
// Logo do WhatsApp (imagem oficial do projeto, fundo transparente)
const icWa = () => h("img", { class: "ic-wa", src: "whatsapp.webp", alt: "", width: 40, height: 40, decoding: "async", "aria-hidden": "true" });
const vazio = (icone, titulo, texto, acao) => h("div", { class: "vazio" }, h("span", { class: "ic-box" }, ic(icone)), h("strong", null, titulo), texto && h("p", null, texto), acao);
let _id = 0;
// campo de senha com o olho: alterna entre oculto e visível (vale no login, na configuração, em Trocar senha e na liberação da IA)
const comOlho = (input) => { const b = h("button", { type: "button", class: "olho", "aria-label": "Mostrar senha", "aria-pressed": "false", title: "Mostrar senha",
  onclick: () => { const ver = input.type === "password"; input.type = ver ? "text" : "password"; b.setAttribute("aria-pressed", String(ver)); b.setAttribute("aria-label", ver ? "Ocultar senha" : "Mostrar senha"); b.title = ver ? "Ocultar senha" : "Mostrar senha"; b.replaceChildren(ic(ver ? "eyeOff" : "eye")); input.focus({ preventScroll: true }); } }, ic("eye"));
  return h("div", { class: "pw" }, input, b); };
function campoSenha(rotulo, props, dica) { const id = "c" + ++_id, input = h("input", { type: "password", ...props, id }); return h("div", { class: "field" }, h("label", { for: id }, rotulo), comOlho(input), dica && h("span", { class: "hint" }, dica)); }
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
  document.body.append(dlg); dlg.showModal(); avisosNoTopo(); return { fechar, dlg, erro };
}
const btnFechar = (txt = "Cancelar") => h("button", { type: "button", class: "btn", onclick: (e) => { const d = e.target.closest("dialog"); d.close(); d.remove(); } }, txt);
const btnOk = (txt) => h("button", { type: "submit", class: "btn primary" }, txt);

// ───────── casca ─────────
function menu() {
  const m = [{ r: "", t: "Resumo", i: "dash" }, { r: "clientes", t: "Clientes", i: "people" }];
  if (gestao()) m.push({ r: "corretores", t: dono() ? "Corretores" : "Meus corretores", i: "users" });
  if (dono()) m.push({ r: "empreendimentos", t: "Empreendimentos", i: "building" }, { r: "unidades", t: "Unidades", i: "grid" });
  m.push({ r: "links", t: dono() ? "Links" : "Meus links", i: "link" }, { r: "perguntas", t: "Perguntas à IA", i: "chat" });
  if (dono()) m.push({ r: "config", t: "Configurações", i: "sliders" });
  m.push({ r: "conta", t: "Minha conta", i: "user" }); return m;
}
const partes = () => location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
const rotaAtual = () => partes()[0] || "";
const logoEmpresa = (cls) => S.logo ? h("img", { class: "logo-img shape-" + (S.logoShape || "round"), src: S.logoShape === "wide" && S.logo.endsWith("logo-justus.png") && cls !== "claro" ? S.logo.replace("logo-justus.png", "logo-justus-branca.png") : S.logo, alt: S.empresa || "" }) : h("span", { class: "av " + (cls || ""), "aria-hidden": "true" }, ini(S.empresa || "LC"));

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
// ───────── Tutorial: passo a passo pelas telas + dúvidas frequentes (aberto pelo menu da conta) ─────────
function telaTutorial() {
  const D = dono();
  const passos = [
    { r: "", i: "dash", t: "Resumo", sub: "A visão geral do seu período.", itens: [
      "No alto, os números do período: clientes novos, aberturas da apresentação, quem voltou a abrir e quem ainda está esperando atendimento.",
      "Troque o período no seletor do canto (7, 14, 30 ou 90 dias).",
      "Os gráficos mostram clientes e aberturas por dia. Pontos vermelhos são dias abaixo da média.",
      D ? "O ranking mostra os corretores com mais clientes, aberturas e vendas fechadas." : "Abaixo aparecem seus clientes mais recentes e o que eles perguntaram à IA."] },
    D && { r: "empreendimentos", i: "building", t: "Empreendimentos", sub: "Cada empreendimento tem a sua apresentação 3D e o que a IA sabe sobre ele.", itens: [
      "Clique em Novo empreendimento para cadastrar nome, cidade e a apresentação.",
      "Em Editar, preencha O que a IA sabe: tipologias, metragens, preços, condições, áreas comuns. A IA responde só com esse texto.",
      "Também em Editar, em Recursos na apresentação, ligue ou desligue posição solar, mapa, simulador, tabela de unidades, WhatsApp do corretor, IA e cadastro do cliente.",
      "Ver apresentação abre a apresentação sem contar abertura, para você conferir."] },
    D && { r: "corretores", i: "users", t: "Corretores", sub: "Quem atende os clientes.", itens: [
      "Clique em Novo corretor. A senha de acesso aparece uma vez na tela: copie e envie a ele.",
      "Toque num corretor para ver os clientes dele, os links e os dados para proposta.",
      "Nova senha gera outra senha se ele esquecer. A antiga para de funcionar na hora.",
      "Desativar o corretor corta o acesso dele, mas o histórico continua."] },
    { r: "links", i: "link", t: D ? "Links" : "Meus links", sub: "O link é o que leva o cliente até a apresentação, no nome do corretor.", itens: [
      "Cada link junta um corretor, um empreendimento e um canal (WhatsApp, Instagram, QR Code, e-mail, site).",
      "Copiar: copia o endereço para colar onde quiser.",
      "QR: mostra o QR Code para imprimir no folder, na placa ou mostrar no celular.",
      "WhatsApp: abre o WhatsApp com uma mensagem pronta e o link. É só escolher o contato.",
      "Pausar: o link deixa de abrir a apresentação. Reativar liga de novo. O histórico continua."] },
    { r: "clientes", i: "people", t: "Clientes", sub: D ? "Todos os clientes, com o corretor de origem." : "Os clientes que vieram dos seus links.", itens: [
      "O cliente entra aqui sozinho: na terceira interação com a apresentação ele informa nome e WhatsApp ou e-mail.",
      "Use a busca e os filtros para achar alguém. Exportar CSV baixa a lista para planilha.",
      "Mude a situação conforme o atendimento: Novo, Contatado, Visita marcada, Proposta, Fechado ou Perdido.",
      "Abra o cliente para ver cada abertura (quando, de que aparelho, por quanto tempo), o que perguntou à IA, o recado e as suas anotações.",
      D ? "Só o dono pode transferir um cliente para outro corretor, na página do cliente." : "Toque em WhatsApp para falar com o cliente com uma mensagem já pronta."] },
    { r: "perguntas", i: "chat", t: "Perguntas à IA", sub: "O que os clientes querem saber.", itens: [
      "Cada conversa mostra quem perguntou, por qual corretor veio e o que a IA respondeu.",
      "Quando a IA não sabe, ela diz que vai deixar com o corretor. Use isso para retornar ao cliente.",
      D ? "Pergunta repetida que a IA não soube responder? Complete o texto O que a IA sabe do empreendimento." : "Perguntas sem resposta são um ótimo motivo para ligar para o cliente."] },
    D && { r: "config", i: "sliders", t: "Configurações", sub: "Dados da empresa e regras do painel.", itens: [
      "Nome e logo da empresa aparecem no painel, no cadastro do cliente e no aceite. As cores do painel podem vir da logo.",
      "Aviso de cliente novo: quantos minutos depois do cadastro o painel avisa (padrão 5). Cliente que volta a abrir avisa na hora.",
      "Perguntas à IA por mês: o teto por empreendimento. Passou do teto, a IA para e manda falar com o corretor.",
      "Regra da comissão explica a quem pertence cada cliente."] },
    { r: "conta", i: "user", t: "Minha conta e menu", sub: "Clique no seu nome, no topo, para abrir o menu.", itens: [
      "Em Minha conta você coloca sua foto e troca a senha.",
      "No menu, Aa troca a fonte, A- e A+ diminuem ou aumentam o texto, e a chave sol/lua liga o modo escuro.",
      "Visual V1 volta para o visual antigo do painel; o mesmo botão traz o visual novo de volta.",
      "Sair encerra a sessão neste aparelho."] },
  ].filter(Boolean);
  const duvidas = [
    ["De quem é o cliente?", "Do primeiro corretor por quem ele se identificou (pelo WhatsApp ou, se não tiver, pelo e-mail). Se depois ele abrir o link de outro corretor, a abertura fica registrada como \"outro link\", mas o cliente continua com o primeiro. Só o dono transfere."],
    ["Quando o cliente precisa se cadastrar?", "Na terceira interação com a apresentação (toque, clique ou tecla), ou quando ele tenta usar a IA ou deixar um recado. Depois disso, no mesmo aparelho, ele abre direto por um ano."],
    ["Recarregar a página conta como outra abertura?", "Não. Recarregar dentro de 20 minutos não conta de novo. Abrir por outro link conta."],
    ["Quando aparece o aviso de cliente novo?", "Alguns minutos depois que o cliente abriu e se cadastrou (5 minutos, ou o que estiver em Configurações). Cliente que volta a abrir avisa na hora. O sino no topo guarda a lista."],
    ["O que acontece quando pauso um link?", "Quem abrir esse link não vê mais a apresentação. Nada se perde: clientes e aberturas continuam no painel, e você pode reativar quando quiser."],
    ["E se a IA não souber responder?", "Ela responde só com o que está em O que a IA sabe do empreendimento. Quando não sabe, diz que vai deixar a pergunta com o corretor, e a pergunta aparece em Perguntas à IA."],
    ["Posso ver a apresentação sem contar abertura?", "Sim. Em Empreendimentos, use Ver apresentação. Na tela inicial da apresentação, o botão Corretor também abre sem coletar nada."],
    ["O corretor vê os clientes dos outros?", "Não. Cada corretor vê só os clientes que vieram dos links dele. O dono vê todos."],
    ["Como levo os clientes para uma planilha?", "Em Clientes, use Exportar CSV (respeita a busca e os filtros). Na página do corretor há o CSV só dos clientes dele."],
    ["Um corretor esqueceu a senha. E agora?", "O dono abre o corretor e usa Nova senha. A senha antiga para de funcionar e a nova aparece na tela para enviar a ele."],
  ].filter(([q]) => D || !/esqueceu a senha|sem contar abertura/.test(q));
  // Player do passo: capa gerada em CSS + botão de play vermelho. Quando o vídeo existir, é só preencher `video: "arquivo.mp4"` no passo.
  const player = (p) => {
    const fig = h("figure", { class: "tut-video" });
    const capa = h("button", { type: "button", class: "tut-capa", "aria-label": `Assistir ao vídeo: ${p.t}`,
      onclick: () => { if (!p.video) { aviso("O vídeo deste passo estará disponível em breve."); return; }
        const v = h("video", { class: "tut-vid", controls: true, autoplay: true, playsinline: true, src: p.video, "aria-label": `Vídeo: ${p.t}` }); capa.replaceWith(v); v.play?.().catch(() => {}); } },
      h("span", { class: "tut-capa-ic", "aria-hidden": "true" }, ic(p.i)), h("span", { class: "tut-capa-t" }, p.t), h("span", { class: "tut-play", "aria-hidden": "true" }, ic("play")));
    fig.append(capa); return fig;
  };
  const passo = (p, n) => h("article", { class: "card tut-passo" },
    h("div", { class: "tut-cab" }, h("span", { class: "tut-n", "aria-hidden": "true" }, "Passo " + (n + 1) + " de " + passos.length),
      h("h2", { class: "card-titulo", style: "margin:0" }, h("span", { class: "ic-box" }, ic(p.i)), p.t), h("p", { class: "muted" }, p.sub)),
    h("ol", { class: "tut-lista" }, p.itens.map((x) => h("li", null, x))),
    h("div", null, h("a", { class: "btn sm", href: "#/" + p.r }, "Abrir " + p.t + " →")));
  // cada passo = 2 caixas lado a lado: o texto e, ao lado, a caixa só com o player de vídeo
  const linhaPasso = (p, n) => [passo(p, n), h("div", { class: "card tut-video-card" }, player(p))];
  return h("div", { class: "stack" }, cabeca("Tutorial", "Um passeio pelas telas do painel, na ordem em que você vai usar."),
    h("div", { class: "tut-grade" }, passos.map(linhaPasso),
      h("div", { class: "card stack tut-faq-card" }, tituloCard("chat", "Dúvidas frequentes"),
        h("div", { class: "tut-faq" }, duvidas.map(([q, a]) => h("details", null, h("summary", null, q), h("p", { class: "muted" }, a)))))));
}
// ───────── menu da conta (clique no nome, no topo) — sempre escuro ─────────
const prefs = { get: (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* sem storage */ } } };
function aplicarTexto() { const r = document.documentElement; r.dataset.fonte = prefs.get("lc.fonte", "sans"); r.style.fontSize = Math.round(+prefs.get("lc.escala", "1") * 100) + "%"; }
aplicarTexto();
function menuUsuario() {
  const caixa = h("div", { class: "menu-usuario", id: "menu-usuario", hidden: true, role: "menu", "aria-label": "Menu da conta" });
  const fechar = () => { caixa.hidden = true; $("#user-btn")?.setAttribute("aria-expanded", "false"); };
  const pintar = () => {
    const fonte = prefs.get("lc.fonte", "sans"), esc = +prefs.get("lc.escala", "1"), escuro = document.documentElement.dataset.modo === "dark", v1 = visualAtual() === "classico";
    const fbtn = (k, cls, label) => h("button", { type: "button", class: "mu-f" + cls, "aria-pressed": String(fonte === k), "aria-label": label, title: label, onclick: () => { prefs.set("lc.fonte", k === "sans" ? "" : k); aplicarTexto(); pintar(); } }, "Aa");
    const tam = (d, txt, label) => h("button", { type: "button", class: "mu-f", "aria-label": label, title: label, disabled: d < 0 ? esc <= .875 : esc >= 1.25, onclick: () => { const n = Math.min(1.25, Math.max(.875, esc + d)); prefs.set("lc.escala", n === 1 ? "" : String(n)); aplicarTexto(); pintar(); } }, txt);
    const item = (i, txt, fn, cls) => h("button", { type: "button", class: "mu-item" + (cls ? " " + cls : ""), role: "menuitem", onclick: () => { fechar(); fn(); } }, h("span", { class: "ic-box" }, ic(i)), h("span", null, txt));
    const embreve = (t) => () => aviso(t + ": em breve.");
    caixa.replaceChildren(
      // 1) quem sou eu: foto com anel, nome, e-mail e o papel (Dono / Corretor)
      h("div", { class: "mu-topo" }, avatar(S.me.name, "sm", fotoDe(S.me.id, S.me.tem_foto)), h("div", { class: "mu-id" }, h("b", { class: "wrap" }, S.me.name), h("small", { class: "wrap" }, S.me.email)), h("span", { class: "mu-papel" }, papelNome())),
      // 2) faixa única: fonte (Aa, Aa serifa, A-, A+) e modo escuro
      h("div", { class: "mu-barra" },
        h("div", { class: "mu-fontes", role: "group", "aria-label": "Texto" }, fbtn("sans", "", "Fonte padrão"), fbtn("serif", " serif", "Fonte com serifa"), tam(-.125, "A-", "Diminuir texto"), tam(.125, "A+", "Aumentar texto")),
        h("span", { class: "mu-sep", "aria-hidden": "true" }),
        h("div", { class: "mu-modo" }, ic("sun"), h("button", { type: "button", class: "mu-switch", role: "switch", "aria-checked": String(escuro), "aria-label": "Modo escuro", onclick: () => { prefs.set("lc.modo", escuro ? "light" : "dark"); if (window.LC_APLICAR_MODO) window.LC_APLICAR_MODO(); pintar(); } }, h("span")), ic("moon"))),
      // 3) atalhos em cartões, 2 por linha; o texto fica embaixo do ícone
      h("div", { class: "mu-grade" },
        item("user", "Minha conta", () => { location.hash = "#/conta"; }),
        item("life", "Suporte", embreve("Suporte")),
        item("cap", "Tutoriais", () => { location.hash = "#/tutorial"; }),
        item("book", "Documentação", embreve("Documentação")),
        item("hist", v1 ? "Visual novo" : "Visual V1", () => { const k = v1 ? "novo" : "classico"; prefs.set("lc.visual", k === "novo" ? "" : k); const l = document.getElementById("tema-novo"); if (l) l.disabled = k === "classico"; aviso(k === "novo" ? "Visual novo ligado." : "Visual V1 ligado."); }),
        item("out", "Sair", sair, "sair")));
  };
  caixa.alternar = () => { if (caixa.hidden) { pintar(); caixa.hidden = false; $("#user-btn")?.setAttribute("aria-expanded", "true"); caixa.querySelector(".mu-item")?.focus(); } else fechar(); };
  return caixa;
}
document.addEventListener("click", (e) => { const m = $("#menu-usuario"); if (m && !m.hidden && !e.composedPath().some((n) => n.id === "menu-usuario" || n.id === "user-btn")) {  // composedPath: o menu se redesenha ao clicar, o alvo pode já ter saído da página
    m.hidden = true; $("#user-btn")?.setAttribute("aria-expanded", "false"); } });
document.addEventListener("keydown", (e) => { const m = $("#menu-usuario"); if (e.key === "Escape" && m && !m.hidden) { m.hidden = true; const b = $("#user-btn"); if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); } } });
function casca() {
  const itens = menu(), atual = rotaAtual();
  const link = (m) => h("a", { href: "#/" + m.r, "aria-current": m.r === atual ? "page" : null, title: m.t, onclick: () => document.body.classList.remove("sb-open") }, ic(m.i), h("span", null, m.t));
  const mini = document.body.classList.contains("sb-mini");
  const lateral = h("aside", { class: "side", id: "menu-lateral" },
    h("a", { class: "brand", href: "#/", "aria-label": S.empresa || "Início" }, logoEmpresa(), h("span", null, S.empresa || "Link Corretor")),
    h("nav", { class: "nav", "aria-label": "Principal" }, itens.map(link)),
    h("div", { class: "foot" },
      h("button", { type: "button", class: "sb-hide", "aria-label": mini ? "Mostrar barra" : "Ocultar barra", title: mini ? "Mostrar barra" : "Ocultar barra", onclick: () => { const on = !document.body.classList.contains("sb-mini"); document.body.classList.toggle("sb-mini", on); try { on ? localStorage.setItem("lc_sbmini", "1") : localStorage.removeItem("lc_sbmini"); } catch { /* sem storage */ } casca(); rotear(); } }, ic(mini ? "panelR" : "panelL"), h("span", null, mini ? "Mostrar barra" : "Ocultar barra"))));
  const topo = h("header", { class: "topo" },
    h("div", { class: "esq" },
      h("button", { class: "icon-btn menu-mobile", "aria-label": "Abrir menu", "aria-controls": "menu-lateral", onclick: () => document.body.classList.toggle("sb-open") }, ic("menu")),
      buscaGlobal()),
    h("div", { class: "dir" },
      h("button", { class: "icon-btn sino", id: "sino", type: "button", hidden: !S.pendentes.length, "aria-haspopup": "true", "aria-expanded": "false", "aria-label": "Avisos", title: "Clientes novos", onclick: (e) => { const p = $("#sino-painel"); p.hidden = !p.hidden; e.currentTarget.setAttribute("aria-expanded", String(!p.hidden)); if (!p.hidden) { $("#avisos").querySelectorAll(".aviso-cliente").forEach((a) => a.remove()); pintarSinoPainel(); } } }, ic("bell"), h("span", { class: "badge", "aria-hidden": "true" }, "0")),  // abrir o sino recolhe os cartões: a lista tem todos
      h("div", { class: "card sino-painel", id: "sino-painel", hidden: true, role: "dialog", "aria-label": "Clientes novos" }),
      h("div", { class: "conta-grupo" }, h("button", { type: "button", class: "user-btn", id: "user-btn", title: "Menu da conta", "aria-haspopup": "menu", "aria-expanded": "false", "aria-controls": "menu-usuario", onclick: () => { const m = $("#menu-usuario"); if (m) m.alternar(); } }, avatar(S.me.name, "sm", fotoDe(S.me.id, S.me.tem_foto)), h("div", { style: "min-width:0" }, h("b", null, S.me.name), h("small", null, S.me.email))),
      menuUsuario(),
      h("button", { class: "icon-btn", "aria-label": "Sair", title: "Sair", onclick: sair }, ic("out")))),
    // cantos da moldura: a curva do conteúdo fica SEMPRE à vista (mesmo rolando) e recebe o mesmo holofote da moldura
    h("span", { class: "canto", "aria-hidden": "true" }), h("span", { class: "canto d", "aria-hidden": "true" }));
  const scrim = h("div", { class: "scrim", onclick: () => document.body.classList.remove("sb-open") });
  const main = h("div", { class: "main" }, topo, h("main", { id: "conteudo", tabindex: "-1" }));
  $("#raiz").replaceChildren(scrim, lateral, main); pintarSino();
}
async function sair() { try { await api("POST", "/api/logout", {}); } catch { /* já saiu */ } S.me = null; entrada(); }

// ───────── busca global com sugestão e tags ─────────
const TAGS = { cliente: "Cliente", corretor: "Corretor", empreendimento: "Empreendimento" };
let _indice = null, _indiceTs = 0;
async function carregarIndice() {
  if (_indice && Date.now() - _indiceTs < 60000) return _indice;
  const [cl, pr, bs] = await Promise.all([api("GET", "/api/clientes"), api("GET", "/api/properties"), dono() ? api("GET", "/api/brokers") : []]);
  _indice = [
    ...cl.map((c) => ({ tag: "cliente", id: c.id, t: c.name, s: [c.empreendimento, c.corretor].filter(Boolean).join(" · "), q: [c.name, c.phone, c.email, c.empreendimento, c.corretor].join(" ") })),
    ...bs.map((b) => ({ tag: "corretor", id: b.id, t: b.name, s: b.email, q: [b.name, b.email, b.phone].join(" ") })),
    ...pr.map((p) => ({ tag: "empreendimento", id: p.id, t: p.name, s: p.city, q: [p.name, p.city].join(" "), p })),
  ]; _indiceTs = Date.now(); return _indice;
}
const semAcento = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function buscaGlobal() {
  let tag = null, itens = [], ativo = -1;
  const input = h("input", { type: "search", class: "bg-in", role: "combobox", "aria-expanded": "false", "aria-controls": "bg-lista", "aria-autocomplete": "list", autocomplete: "off", placeholder: dono() ? "Buscar cliente, corretor ou empreendimento…" : "Buscar cliente ou empreendimento…", "aria-label": "Busca" });
  const chip = h("button", { type: "button", class: "bg-tag", hidden: true, "aria-label": "Remover filtro", onclick: () => { tag = null; render(); input.focus(); } });
  const lista = h("div", { class: "bg-lista", id: "bg-lista", role: "listbox", hidden: true });
  const caixa = h("div", { class: "bg", role: "search" }, ic("search"), chip, input, lista);
  const abrir = (sim) => { lista.hidden = !sim; input.setAttribute("aria-expanded", String(sim)); };
  const tagsDisp = () => Object.keys(TAGS).filter((k) => dono() || k !== "corretor");
  function ir(it) {
    abrir(false); input.value = ""; tag = null; chip.hidden = true;
    if (it.tag === "cliente") location.hash = "#/cliente/" + it.id;
    else if (it.tag === "corretor") location.hash = "#/corretor/" + it.id;
    else { location.hash = "#/empreendimentos"; if (dono()) setTimeout(() => formProp(it.p), 350); }
  }
  async function render() {
    chip.hidden = !tag; chip.textContent = tag ? TAGS[tag] + " ×" : "";
    const q = semAcento(input.value.trim()); lista.replaceChildren(); itens = []; ativo = -1;
    let dados = []; try { dados = await carregarIndice(); } catch { /* sem índice */ }
    // 1) sugestões de tag: "cli" → [Cliente], "corr" → [Corretor]… (só sem tag escolhida)
    const sugTags = tag ? [] : tagsDisp().filter((k) => !q || semAcento(TAGS[k]).startsWith(q) || (q.length > 1 && semAcento(TAGS[k]).includes(q)));
    if (sugTags.length) {
      lista.append(h("div", { class: "bg-sec" }, q ? "Filtrar por" : "Buscar em"));
      sugTags.forEach((k) => { const el = h("button", { type: "button", role: "option", class: "bg-it tag", onmousedown: (e) => e.preventDefault(), onclick: () => { tag = k; input.value = ""; render(); input.focus(); } }, h("span", { class: "pill on" }, TAGS[k]), h("span", { class: "muted" }, `${dados.filter((d) => d.tag === k).length} cadastrados`)); lista.append(el); itens.push({ el, tagPick: k }); });
    }
    // 2) resultados: começa-com vale mais que contém; limite por tipo
    if (q || tag) {
      const casa = (d) => { if (tag && d.tag !== tag) return -1; if (!q) return 2; const t = semAcento(d.t), all = semAcento(d.q); return t.startsWith(q) ? 0 : t.split(/\s+/).some((p) => p.startsWith(q)) ? 1 : all.includes(q) ? 2 : -1; };
      const res = dados.map((d) => ({ d, k: casa(d) })).filter((x) => x.k >= 0).sort((a, b) => a.k - b.k || a.d.t.localeCompare(b.d.t)).slice(0, 12).map((x) => x.d);
      if (res.length) lista.append(h("div", { class: "bg-sec" }, "Resultados"));
      res.forEach((d) => { const el = h("button", { type: "button", role: "option", class: "bg-it", onmousedown: (e) => e.preventDefault(), onclick: () => ir(d) }, h("span", { class: "pill " + (d.tag === "cliente" ? "on" : d.tag === "corretor" ? "warn" : "off") }, TAGS[d.tag]), h("span", { class: "bg-t wrap" }, d.t), d.s && h("span", { class: "muted bg-s wrap" }, d.s)); lista.append(el); itens.push({ el, it: d }); });
      if (!res.length && !sugTags.length) lista.append(h("p", { class: "muted bg-vazio" }, "Nada encontrado."));
    }
    abrir(lista.children.length > 0);
  }
  const marcar = (i) => { itens.forEach((x, n) => { x.el.setAttribute("aria-selected", String(n === i)); x.el.classList.toggle("on", n === i); }); ativo = i; if (itens[i]) itens[i].el.scrollIntoView({ block: "nearest" }); };
  input.addEventListener("input", render); input.addEventListener("focus", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (lista.hidden) render(); marcar(Math.min(itens.length - 1, ativo + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); marcar(Math.max(0, ativo - 1)); }
    else if (e.key === "Enter") { const x = itens[ativo >= 0 ? ativo : (input.value.trim() ? itens.findIndex((y) => y.it) : -1)]; if (x) { e.preventDefault(); x.it ? ir(x.it) : (tag = x.tagPick, input.value = "", render()); } }
    else if (e.key === "Backspace" && !input.value && tag) { tag = null; render(); }
    else if (e.key === "Escape") { abrir(false); input.blur(); }
  });
  document.addEventListener("click", (e) => { if (!caixa.contains(e.target)) abrir(false); });
  return caixa;
}

// ───────── entrada ─────────
function entrada() {
  document.title = "Entrar · Link Corretor";
  api("GET", "/api/me").then((m) => { S.empresa = m.empresa; S.logo = m.logo || ""; S.logoShape = m.logo_shape || "round"; S.theme = temaValido(m.theme) ? m.theme : null; aplicarTema(S.theme); if (m.user) { S.me = m.user; iniciar(); return; } $("#raiz").replaceChildren(m.setup ? telaSetup() : telaLogin()); $("#raiz input")?.focus(); })
    .catch((e) => $("#raiz").replaceChildren(h("div", { class: "entrada" }, h("div", { class: "card" }, h("h1", null, "Não consegui abrir o painel"), h("p", { class: "muted" }, e.message)))));
}
function telaLogin() {
  const erro = h("p", { class: "err", role: "alert" });
  return h("div", { class: "entrada" }, h("form", { class: "card", novalidate: true, onsubmit: async (e) => { e.preventDefault(); erro.textContent = ""; const f = new FormData(e.target);
    try { await api("POST", "/api/login", { email: f.get("email"), senha: f.get("senha") }); entrada(); /* relê /api/me: antes do login o servidor não manda a logo */ } catch (x) { erro.textContent = x.message; } } },
    h("div", { class: "logo logo-entrada" }, h("img", { src: "/painel/logo-justus.png", alt: "Justus Incorporadora", class: "logo-img shape-wide" })), h("div", null, h("h1", null, "Entrar"), h("p", { class: "muted" }, S.empresa || "Clientes por corretor")),
    campo("E-mail", h("input", { type: "email", name: "email", autocomplete: "username", required: true })), campoSenha("Senha", { name: "senha", autocomplete: "current-password", required: true  }),
    erro, h("button", { class: "btn primary", type: "submit" }, "Entrar")));
}
function telaSetup() {
  const erro = h("p", { class: "err", role: "alert" });
  return h("div", { class: "entrada" }, h("form", { class: "card", novalidate: true, onsubmit: async (e) => { e.preventDefault(); erro.textContent = ""; const f = new FormData(e.target);
    try { const r = await api("POST", "/api/setup", { empresa: f.get("empresa"), nome: f.get("nome"), email: f.get("email"), senha: f.get("senha") });
      const m = await api("GET", "/api/me"); S.me = m.user; S.empresa = m.empresa; S.logo = m.logo || ""; S.logoShape = m.logo_shape || "round"; S.theme = temaValido(m.theme) ? m.theme : null; aplicarTema(S.theme); iniciar(); } catch (x) { erro.textContent = x.message; } } },
    h("div", { class: "logo" }, LOGO(), "Link Corretor"), h("div", null, h("h1", null, "Vamos começar"), h("p", { class: "muted" }, "Crie a conta do dono da construtora ou imobiliária. Leva um minuto.")),
    campo("Nome da empresa", h("input", { type: "text", name: "empresa", autocomplete: "organization", required: true })), campo("Seu nome", h("input", { type: "text", name: "nome", autocomplete: "name", required: true })),
    campo("E-mail", h("input", { type: "email", name: "email", autocomplete: "username", required: true })), campoSenha("Senha", { name: "senha", autocomplete: "new-password", minlength: 8, required: true  }, "Mínimo de 8 caracteres."),
    erro, h("button", { class: "btn primary", type: "submit" }, "Criar conta e entrar")));
}

// ───────── roteador ─────────
const TELAS = { "": ["Resumo", telaResumo], clientes: ["Clientes", telaClientes], cliente: ["Cliente", telaCliente], corretores: ["Corretores", telaCorretores, "gestao"], corretor: ["Corretor", telaCorretor, "gestao"],
  empreendimentos: ["Empreendimentos", telaProps, true], unidades: ["Unidades", telaUnidades, true], links: ["Links", telaLinks], perguntas: ["Perguntas à IA", telaPerguntas], config: ["Configurações", telaConfig, true], conta: ["Minha conta", telaConta], tutorial: ["Tutorial", telaTutorial] };
async function rotear() {
  if (!S.me) return;
  let [r, arg] = partes();
  if (!TELAS[r] || (TELAS[r][2] === true && !dono()) || (TELAS[r][2] === "gestao" && !gestao())) { r = ""; arg = null; location.replace("#/"); }
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
// Selo de quem atende o cliente: o corretor de origem ou, se a comissão foi dividida, cada corretor com a sua parte
function seloAtendimento(d) {
  const lista = d.shares && d.shares.length ? d.shares.map((x) => ({ id: x.broker_id, nome: x.name, foto: x.tem_foto, pct: x.pct })) : [{ id: d.broker_id, nome: d.corretor, foto: d.corretor_tem_foto, pct: 100 }];
  // dono: abre a divisão da comissão já com um segundo corretor (50% / 50%), para ele ajustar quanto vai para cada um
  const adicionar = async (e) => { const b = e.currentTarget; b.disabled = true; try { dividir(d, await api("GET", "/api/brokers"), { adicionar: true }); } catch (x) { aviso(x.message, true); } b.disabled = false; };
  return h("div", { class: "selos" }, h("span", { class: "eyebrow" }, lista.length > 1 ? "Corretores que atendem" : "Corretor que atende"),
    h("div", { class: "selos-l" }, lista.map((x) => h(dono() ? "a" : "span", { class: "selo", href: dono() ? "#/corretor/" + x.id : null }, avatar(x.nome, "sm", fotoDe(x.id, x.foto)), h("span", { class: "selo-n" }, x.nome), h("span", { class: "selo-p" }, x.pct + "%")))),
    dono() && lista.length < 6 && h("div", { class: "selos-add" }, h("button", { type: "button", class: "btn sm", onclick: adicionar }, ic("plus"), "Adicionar corretor"), h("span", { class: "muted small" }, "Você define quantos % da comissão vão para cada um.")));
}
function detalheInline(c) {
  return api("GET", "/api/clientes/" + c.id).then((d) => h("div", { class: "det-grid" },
    h("div", null, h("span", { class: "eyebrow" }, d.historico.length > 1 ? `Último acesso (de ${d.historico.length})` : "Último acesso"), d.historico.length ? h("div", { class: "timeline", style: "margin-top:8px" }, d.historico.slice(0, 1).map((o) => h("div", { class: "tl" }, h("span", { class: "tl-dot" + (o.broker_id !== d.broker_id ? " warn" : "") }),
      h("div", null, h("div", { class: "cell-main" }, dataHora(o.ts)), h("div", { class: "muted small wrap" }, [o.empreendimento, o.device, o.segundos > 30 ? "ficou " + dur(o.segundos) : null, o.broker_id !== d.broker_id ? "link de " + o.corretor : CANAIS[o.channel]].filter(Boolean).join(" · ")))))) : h("p", { class: "muted small", style: "margin-top:8px" }, "Cadastrou-se, mas ainda não abriu a apresentação de novo."),
      d.historico.length > 1 && h("a", { class: "btn sm ghost mais-acessos", href: "#/cliente/" + c.id }, `Carregar mais (${d.historico.length - 1})`),
      seloAtendimento(d)),
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
    h("div", { class: "pessoa-m" }, h("div", { class: "pessoa-n" }, h("span", { class: "wrap" }, c.name), statusPill(c.status), c.propostas > 0 && pill(c.propostas > 1 ? `${c.propostas} propostas` : "1 proposta", "on"), c.outros_corretores > 0 && pill("outro link", "warn")),
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
function grafico(serie, chave, rotulo, modo = "linha") {
  // modo "linha": linha ligando os dias; trecho que CHEGA a um dia baixo (menos da metade da média do período) muda de cor.
  // modo "barras": um palito por dia, vermelho nos dias baixos. Mesma média, mesmos rótulos e legenda.
  const W = 600, H = 130, pad = 22, top = 24, n = serie.length, max = Math.max(1, ...serie.map((d) => d[chave]));
  const total = serie.reduce((a, d) => a + d[chave], 0), media = total / Math.max(1, n), limite = media * 0.5;
  const baixo = (v) => media > 0 && v < limite;
  const X = (i) => 8 + (n > 1 ? (i * (W - 16)) / (n - 1) : (W - 16) / 2), Y = (v) => H - (v / max) * (H - top);
  const dia = (d) => d.dia.split("-").reverse().slice(0, 2).join("/");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H + pad}`); svg.setAttribute("class", "chart"); svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${rotulo} por dia: total ${total}, média ${media.toFixed(1).replace(".", ",")}; ${serie.filter((d) => baixo(d[chave])).length} dias abaixo da metade da média`);
  let s = `<line class="gl" x1="0" x2="${W}" y1="${H}" y2="${H}"/>`;
  const barras = modo === "barras", bw = Math.max(2, Math.min(18, ((W - 16) / Math.max(1, n)) * 0.62));
  if (!barras) s += `<polygon class="area" points="${X(0)},${H} ${serie.map((d, i) => `${X(i)},${Y(d[chave])}`).join(" ")} ${X(n - 1)},${H}"/>`;
  if (barras) serie.forEach((d, i) => { const v = d[chave], y = Y(v), alt = Math.max(v > 0 ? 2 : 0.8, H - y); s += `<rect class="gbar ${baixo(v) ? "lo" : "ok"}" x="${(X(i) - bw / 2).toFixed(1)}" y="${(H - alt).toFixed(1)}" width="${bw.toFixed(1)}" height="${alt.toFixed(1)}" rx="${Math.min(3, bw / 2).toFixed(1)}"><title>${dia(d)}: ${v}${baixo(v) ? " (baixo)" : ""}</title></rect>`; });
  if (media > 0) s += `<line class="avg" x1="0" x2="${W}" y1="${Y(media)}" y2="${Y(media)}"/><text class="ax" x="0" y="${Math.max(10, Y(media) - 4)}">média ${media.toFixed(1).replace(".", ",")}</text>`;
  if (!barras) for (let i = 1; i < n; i++) s += `<line class="seg ${baixo(serie[i][chave]) ? "lo" : "ok"}" x1="${X(i - 1)}" y1="${Y(serie[i - 1][chave])}" x2="${X(i)}" y2="${Y(serie[i][chave])}"/>`;
  if (!barras) serie.forEach((d, i) => { if (n <= 45 || baixo(d[chave])) s += `<circle class="pt ${baixo(d[chave]) ? "lo" : "ok"}" cx="${X(i)}" cy="${Y(d[chave])}" r="${n <= 45 ? 3.4 : 2.4}"><title>${dia(d)}: ${d[chave]}${baixo(d[chave]) ? " (baixo)" : ""}</title></circle>`; });
  const lab = (i, anc) => `<text class="ax" x="${X(i)}" y="${H + 16}" text-anchor="${anc}">${dia(serie[i])}</text>`;
  s += lab(0, "start") + lab(n - 1, "end");
  s += `<g class="leg"><circle class="pt ok" cx="${W - 150}" cy="8" r="4"/><text class="ax" x="${W - 142}" y="12">normal</text><circle class="pt lo" cx="${W - 84}" cy="8" r="4"/><text class="ax" x="${W - 76}" y="12">baixo</text></g>`;
  svg.innerHTML = s; return svg;
}
// Cartão do gráfico diário com escolha Palitos/Linha (lembrada por gráfico neste navegador). padrao: "barras" | "linha"
function cartaoGrafico(icone, titulo, serie, chave, rotulo, padrao, vazioNode) {
  const lsk = "lc_graf_" + chave, atual = () => { try { const v = localStorage.getItem(lsk); return v === "barras" || v === "linha" ? v : padrao; } catch { return padrao; } };
  if (vazioNode) return h("div", { class: "card" }, tituloCard(icone, titulo), vazioNode);
  const area = h("div", { class: "graf-area" }, grafico(serie, chave, rotulo, atual()));
  const btn = (val, nome) => h("button", { type: "button", class: "gmodo", "aria-pressed": String(atual() === val), "aria-label": `Gráfico de ${nome}`, title: nome, "data-modo": val,
    onclick: (e) => { try { localStorage.setItem(lsk, val); } catch { /* sem storage */ } area.replaceChildren(grafico(serie, chave, rotulo, val)); e.currentTarget.parentNode.querySelectorAll(".gmodo").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === val))); } }, ic(val === "barras" ? "barras" : "linha"));
  return h("div", { class: "card" }, h("div", { class: "card-topo" }, tituloCard(icone, titulo), h("div", { class: "gmodos", role: "group", "aria-label": "Tipo de gráfico" }, btn("barras", "Palitos"), btn("linha", "Linha"))), area);
}
async function telaResumo() {
  const dias = Number(sessionStorage.getItem("lc_dias") || 30);
  const d = await api("GET", `/api/dashboard?dias=${dias}`), t = d.totais;
  const sel = h("select", { "aria-label": "Período", onchange: (e) => { sessionStorage.setItem("lc_dias", e.target.value); rotear(); } }, [7, 14, 30, 90].map((n) => h("option", { value: n, selected: n === dias }, `Últimos ${n} dias`)));
  // capa: foto horizontal em cinza no topo do cartão; acende (colorida) no hover. Sem o arquivo, o cartão fica sem capa.
  const kpi = (n, l, href, capa) => h(href ? "a" : "div", { class: "card kpi" + (capa ? " com-capa" : ""), href },
    capa && h("img", { class: "kpi-capa", src: `img/kpi/${capa}.jpg?v=1`, alt: "", loading: "lazy", decoding: "async", onerror: (e) => { const c = e.target.closest(".kpi"); e.target.remove(); c && c.classList.remove("com-capa"); } }),
    h("span", { class: "n" }, fmtN(n)), h("span", { class: "l" }, l));
  const el = h("div", { class: "stack" }, cabeca(gestao() ? "Resumo" : `Olá, ${S.me.name.split(" ")[0]}`, dono() ? S.empresa : S.me.role === "manager" ? "A sua equipe de corretores" : "Seus clientes", sel),
    h("div", { class: "kpis" }, kpi(t.clientes, `Clientes novos (${dias} dias)`, "#/clientes", "clientes-novos"), kpi(t.aberturas, "Aberturas da apresentação", null, "aberturas"), kpi(t.retornos, "Voltaram a abrir", null, "voltaram"), kpi(t.novos_para_atender, "Novos para atender", "#/clientes?status=novo", "atender")));
  if (!t.total_clientes) el.append(h("div", { class: "card" }, tituloCard("check", "Como funciona"), h("div", { class: "passos" },
    passo(true, "Cada corretor tem links por empreendimento", "O cliente abre o link e se identifica com nome e WhatsApp ou e-mail."),
    passo(true, "Toda abertura fica no nome do cliente", "Quantas vezes abriu, quando e por quanto tempo."),
    passo(true, "O cliente pertence ao primeiro corretor", "A apresentação mostra o tempo todo quem está atendendo. É a prova para a comissão."))));
  el.append(h("div", { class: "cols2" },
    cartaoGrafico("people", "Clientes novos por dia", d.serie, "clientes", "Clientes", "barras", t.clientes ? null : vazio("people", "Ainda sem clientes", "Quando alguém se cadastrar por um link, aparece aqui.")),
    cartaoGrafico("eye", "Aberturas por dia", d.serie, "aberturas", "Aberturas", "linha", t.aberturas ? null : vazio("eye", "Ainda sem aberturas"))));
  const top5 = d.ranking.slice(0, d.empreendimentos.length > 3 ? 10 : 5);  // até 3 empreendimentos: top 5; com mais, o cartão ao lado fica alto e cabe o top 10
  const max = Math.max(1, ...top5.map((r) => r.clientes));
  // "Por empreendimento": caixa pequena com a miniatura de cada empreendimento, 2 por linha. Número ímpar (ex.: só 1) ganha o "+" para fechar a linha.
  const meta = {};
  if (dono()) { try { (await api("GET", "/api/properties")).forEach((p) => { meta[p.id] = p; }); } catch { /* sem os detalhes: miniatura sem foto */ } }
  const miniEmp = (e) => { const p = meta[e.id] || {};
    return h("a", { class: "emp-mini-it", href: "#/clientes?empreendimento=" + e.id, title: `Ver os clientes de ${e.name}` },
      p.capa ? h("img", { class: "emp-mini-img", src: p.capa, alt: "", loading: "lazy", decoding: "async" }) : h("span", { class: "emp-mini-img", "aria-hidden": "true" }, ic("building")),
      h("span", { class: "emp-mini-n wrap" }, e.name), h("span", { class: "emp-mini-s" }, `${fmtN(e.clientes)} clientes · ${fmtN(e.aberturas)} aberturas`));
  };
  const novoEmp = dono() && d.empreendimentos.length % 2 === 1 ? h("button", { type: "button", class: "emp-mini-it emp-mini-novo", onclick: () => formProp(), "aria-label": "Novo empreendimento" },
    h("span", { class: "emp-mini-img", "aria-hidden": "true" }, ic("plus")), h("span", { class: "emp-mini-n" }, "Novo empreendimento"), h("span", { class: "emp-mini-s" }, "Cadastre outra apresentação")) : null;
  const cardEmp = h("div", { class: "card" }, tituloCard("building", "Por empreendimento"),
    d.empreendimentos.length ? h("div", { class: "emp-mini" }, d.empreendimentos.map(miniEmp), novoEmp) : vazio("building", "Sem empreendimentos"));
  el.append(h("div", { class: "cols2" },
    gestao() && h("div", { class: "card" }, h("div", { class: "row between" }, tituloCard("users", "Corretores"), h("a", { href: "#/corretores" }, "Ver todos")),
      top5.length ? h("div", { class: "stack", style: "gap:12px;margin-top:12px" }, top5.map((r, i) => h("a", { class: "rank", href: "#/corretor/" + r.id },
        avatar(r.name, "sm"), h("div", { style: "flex:1;min-width:0" }, h("div", { class: "row between" }, h("span", { class: "cell-main wrap" }, `${i + 1}. ${r.name}`), h("span", { class: "muted small" }, `${fmtN(r.clientes)} clientes · ${fmtN(r.aberturas)} aberturas${r.fechados ? " · " + r.fechados + " fechado(s)" : ""}`)),
          h("div", { class: "bar", style: "margin-top:6px" }, h("i", { style: `width:${Math.round((r.clientes / max) * 100)}%` })))))) : vazio("users", "Nenhum corretor ainda", null, h("a", { class: "btn primary", href: "#/corretores" }, "Cadastrar corretor"))),
    cardEmp,
  ));
  el.append(h("div", { class: "cols2" },
    h("div", { class: "card" }, h("div", { class: "row between" }, tituloCard("people", "Clientes recentes"), h("a", { href: "#/clientes" }, "Ver todos")), d.recentes.length ? listaPessoas(d.recentes) : vazio("people", "Nenhum cliente ainda")),
    h("div", { class: "card" }, h("div", { class: "row between" }, tituloCard("chat", "O que perguntam à IA"), h("a", { href: "#/perguntas" }, "Ver todas")),
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
  const bs = gestao() ? await api("GET", "/api/brokers") : [];
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
      h("div", { class: "card" }, tituloCard("clock", "Histórico de aberturas"), c.historico.length ? h("div", { class: "timeline" }, c.historico.map((o) => h("div", { class: "tl" }, h("span", { class: "tl-dot" + (o.broker_id !== c.broker_id ? " warn" : "") }),
        h("div", null, h("div", { class: "cell-main" }, dataHora(o.ts)), h("div", { class: "muted small wrap" }, [o.empreendimento, o.device, o.segundos > 30 ? "ficou " + dur(o.segundos) : null, o.broker_id !== c.broker_id ? "link de " + o.corretor : CANAIS[o.channel]].filter(Boolean).join(" · ")))))) : vazio("eye", "Nenhuma abertura registrada")),
      h("div", { class: "stack" },
        c.propostas && c.propostas.length ? h("div", { class: "card" }, tituloCard("edit", "Propostas do cliente"), h("p", { class: "muted small", style: "margin:-6px 0 12px" }, "Montadas pelo cliente no chat da apresentação, sempre no nome do corretor de origem."),
          h("div", { class: "props-cli" }, c.propostas.map((p) => h("div", { class: "prop-cli" },
            h("div", { class: "row between" }, h("b", null, `Apto ${p.unit} · ${brlN(p.price)}`), h("span", { class: "muted small" }, dataHora(p.created))),
            h("div", { class: "muted small", style: "margin-top:4px" }, [`Entrada ${brlN(p.entrada)}`, `${p.mensais}x de ${brlN(p.mensal_valor)}`, p.baloes ? `${p.baloes} balões ${p.balao_period === "semestral" ? "semestrais" : "anuais"} de ${brlN(p.balao_valor)}` : "sem balões",
              `${p.modo === "banco" ? "banco na entrega" : "nas chaves"} ${brlN(p.chaves)}`, p.modo === "direto" ? "direto com a construtora" : "com financiamento bancário"].join(" · ")),
            p.obs && h("p", { class: "wrap small", style: "margin:6px 0 0;white-space:pre-wrap" }, p.obs))))) : null,
        h("div", { class: "card" }, tituloCard("chat", "Recado do cliente"), h("p", { class: "wrap muted", style: "white-space:pre-wrap" }, c.message || "Não deixou recado.")),
        h("form", { class: "card stack", novalidate: true, onsubmit: async (e) => { e.preventDefault(); await api("PATCH", `/api/clientes/${c.id}`, { notes: new FormData(e.target).get("notes") }); aviso("Anotações salvas."); } },
          tituloCard("edit", "Anotações"), h("textarea", { name: "notes", rows: 5, maxlength: 2000, "aria-label": "Anotações" }, c.notes || ""), h("div", null, h("button", { class: "btn", type: "submit" }, "Salvar anotações"))),
        c.perguntas_lista.length ? h("div", { class: "card" }, tituloCard("chat", "O que perguntou à IA"), c.perguntas_lista.map((x) => h("div", { class: "qa" }, h("span", { class: "q wrap" }, x.question), x.answer && h("span", { class: "a wrap" }, x.answer), h("span", { class: "muted small" }, quando(x.ts))))) : null)));
  return el;
}
function dividir(c, bs, { adicionar } = {}) {
  const ativos = bs.filter((b) => b.active);
  const linhas = (c.shares && c.shares.length ? c.shares : [{ broker_id: c.broker_id, pct: 100 }]).map((s) => ({ ...s }));
  const igual = () => { const n = linhas.length, base = Math.floor(100 / n); linhas.forEach((l, i) => { l.pct = base + (i < 100 - base * n ? 1 : 0); }); };  // 100 / n, sobra nos primeiros
  if (adicionar && linhas.length < 6) { const b = ativos.find((x) => !linhas.some((l) => l.broker_id === x.id)); if (b) { linhas.push({ broker_id: b.id, pct: 0 }); igual(); } }
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
    h("div", { class: "row", style: "gap:8px" }, h("button", { type: "button", class: "btn sm", onclick: () => { if (linhas.length >= 6) return; const b = ativos.find((x) => !linhas.some((l) => l.broker_id === x.id)) || ativos[0]; linhas.push({ broker_id: b.id, pct: 0 }); desenhar(); } }, ic("plus"), "Adicionar corretor"),
      h("button", { type: "button", class: "btn sm ghost", onclick: () => { igual(); desenhar(); } }, "Dividir igualmente")),
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
  const bsTodos = await api("GET", "/api/brokers");
  const gers = dono() ? (await api("GET", "/api/gerentes")) : [];
  const filtro = dono() ? sessionStorage.getItem("lc_ger") || "" : "";   // "" = todos · "0" = sem gerente · id do gerente
  const bs = filtro === "" ? bsTodos : bsTodos.filter((b) => String(b.manager_id || 0) === filtro);
  const el = h("div", { class: "stack" }, cabeca(dono() ? "Corretores" : "Meus corretores", dono() ? "Toque num corretor para ver os clientes dele. Filtre por gerente de vendas." : "Os corretores da sua equipe: clientes, links e dados para proposta.",
    vistaToggle("corretores"), dono() && h("button", { class: "btn", onclick: gerentesDialogo }, ic("users"), "Gerentes de venda"), h("button", { class: "btn primary", onclick: formCorretor }, ic("plus"), "Novo corretor")));
  if (dono() && gers.length) el.append(chipsGerentes(gers, bsTodos, filtro));
  if (!bsTodos.length) { el.append(h("div", { class: "card" }, vazio("users", "Nenhum corretor ainda", "Cadastre o primeiro. Você define a senha ou deixa o painel gerar uma."))); return el; }
  if (!bs.length) { el.append(h("div", { class: "card" }, vazio("users", "Nenhum corretor neste filtro", "Troque o gerente acima ou cadastre um corretor para ele."))); return el; }
  if (vista("corretores") === "tabela") {
    el.append(h("div", { class: "card" }, h("p", { class: "muted small", style: "margin-bottom:8px" }, "Clique numa linha para ver os clientes do corretor aqui mesmo."), tabela([
      { t: "Corretor", v: (b) => h("div", { class: "row", style: "gap:10px;flex-wrap:nowrap" }, avatar(b.name, "sm", fotoDe(b.id, b.tem_foto)), h("div", { style: "min-width:0" }, h("a", { class: "cell-main wrap", href: "#/corretor/" + b.id }, b.name), h("div", { class: "cell-sub wrap" }, [b.email, b.phone && fone(b.phone)].filter(Boolean).join(" · ")))), cls: "main-cell" },
      ...(dono() ? [{ t: "Gerente", v: (b) => b.gerente || h("span", { class: "muted" }, "—") }] : []),
      { t: "Clientes", v: (b) => fmtN(b.clientes), cls: "num" }, { t: "Novos", v: (b) => fmtN(b.novos), cls: "num" }, { t: "Aberturas", v: (b) => fmtN(b.aberturas), cls: "num" }, { t: "Fechados", v: (b) => fmtN(b.fechados), cls: "num" },
      { t: "Links", v: (b) => fmtN(b.links), cls: "num" }, { t: "Última abertura", v: (b) => quando(b.ultima) }, { t: "Situação", v: (b) => pill(b.active ? "Ativo" : "Desativado", b.active ? "on" : "off") },
      // atalho do WhatsApp do corretor (o mesmo ícone do cartão), sem abrir a linha
      { t: "WhatsApp", v: (b) => (b.whatsapp || b.phone) ? h("a", { class: "btn-wa", href: wa(b.whatsapp || b.phone, `Olá ${b.name.split(" ")[0]}, tudo bem?`), target: "_blank", rel: "noopener", title: "Chamar " + b.name + " no WhatsApp", "aria-label": "Chamar " + b.name + " no WhatsApp" }, icWa()) : h("span", { class: "muted" }, "—"), cls: "acoes" },
    ], bs, async (b) => { const d = await api("GET", "/api/brokers/" + b.id); return d.clientes_lista.length ? tabelaClientes(d.clientes_lista, { semCorretor: true }) : h("p", { class: "muted small" }, "Nenhum cliente ainda."); })));
    return el;
  }
  const abrirCorretor = (b) => (e) => { if (e.target.closest("a,button")) return; if (e.type === "keydown" && e.key !== "Enter") return; location.hash = "#/corretor/" + b.id; };
  el.append(h("div", { class: "props" }, bs.map((b) => h("div", { class: "card corretor" + (b.active ? "" : " off"), role: "link", tabindex: "0", "aria-label": "Abrir " + b.name, onclick: abrirCorretor(b), onkeydown: abrirCorretor(b) },
    h("div", { class: "row", style: "gap:12px;flex-wrap:nowrap" }, avatar(b.name, "foto-c", fotoDe(b.id, b.tem_foto)), h("div", { style: "min-width:0;flex:1" }, h("h2", { class: "wrap", style: "margin:0" }, b.name), h("div", { class: "contato-c muted small", title: b.email }, b.email), b.phone && h("div", { class: "contato-c muted small" }, fone(b.phone)), dono() && b.gerente && h("span", { class: "ger-tag" }, ic("users"), b.gerente)), !b.active && pill("Desativado", "off"),
      (b.whatsapp || b.phone) && h("a", { class: "btn-wa", href: wa(b.whatsapp || b.phone, `Olá ${b.name.split(" ")[0]}, tudo bem?`), target: "_blank", rel: "noopener", title: "Chamar " + b.name + " no WhatsApp", "aria-label": "Chamar " + b.name + " no WhatsApp" }, icWa())),
    h("div", { class: "stats" }, h("div", null, h("b", null, fmtN(b.clientes)), h("span", null, "clientes")), h("div", null, h("b", null, fmtN(b.novos)), h("span", null, "novos")), h("div", null, h("b", null, fmtN(b.aberturas)), h("span", null, "aberturas")), h("div", null, h("b", null, fmtN(b.fechados)), h("span", null, "fechados"))),
    h("div", { class: "muted small" }, "Última abertura " + quando(b.ultima))))));
  return el;
}
function formCartao(b) {
  const c = b.cartao, corpo = [campo("Nome", h("input", { type: "text", name: "nome", value: c.name, required: true })), h("div", { class: "grid2" }, campo("Telefone / WhatsApp", h("input", { type: "tel", name: "telefone", value: fone(c.phone), required: true })), campo("E-mail", h("input", { type: "email", name: "email", value: c.email, required: true }))),
    h("p", { class: "muted small" }, "A assinatura não muda aqui. Para refazê-la, use “Liberar novo cadastro”.")];
  dialogo("Dados para proposta · " + b.name, corpo, [btnFechar(), btnOk("Salvar")], { onSubmit: async (f, fechar) => { await api("PATCH", `/api/brokers/${b.id}/cartao`, { nome: f.get("nome"), telefone: f.get("telefone"), email: f.get("email") }); fechar(); aviso("Dados salvos."); rotear(); } });
}
async function telaCorretor(id) {
  const b = await api("GET", "/api/brokers/" + id);
  const gers = dono() ? (await api("GET", "/api/gerentes")).filter((g) => g.active || g.id === b.manager_id) : [];
  const selGerente = dono() && gers.length ? h("label", { class: "ger-sel" }, h("span", { class: "muted small" }, "Gerente de vendas"),
    h("select", { "aria-label": "Gerente de vendas", onchange: async (e) => { await api("PATCH", `/api/brokers/${b.id}`, { gerente_id: e.target.value || null }); aviso(e.target.value ? "Gerente atualizado." : "Corretor sem gerente."); } },
      h("option", { value: "" }, "Sem gerente"), gers.map((g) => h("option", { value: g.id, selected: g.id === b.manager_id }, g.name)))) : null;
  const el = h("div", { class: "stack" }, voltar("corretores", "Corretores"),
    h("div", { class: "card hero-p" }, avatar(b.name, "lg", fotoDe(b.id, b.tem_foto)), h("div", { style: "flex:1;min-width:0" }, h("div", { class: "row", style: "gap:8px" }, h("h1", { class: "wrap" }, b.name), pill(b.active ? "Ativo" : "Desativado", b.active ? "on" : "off")),
      h("p", { class: "muted wrap" }, [b.email, b.phone && fone(b.phone)].filter(Boolean).join(" · ")), selGerente,
      h("div", { class: "row", style: "margin-top:12px" }, h("button", { class: "btn sm", onclick: () => escolherFoto(async (d) => { await api("PATCH", `/api/brokers/${b.id}`, { foto: d }); S_FOTO.v = Date.now(); aviso("Foto salva."); rotear(); }) }, b.tem_foto ? "Trocar foto" : "Adicionar foto"), h("button", { class: "btn sm", onclick: () => redefinir(b) }, "Nova senha"),
        h("button", { class: "btn sm" + (b.active ? " danger" : ""), onclick: async () => { await api("PATCH", `/api/brokers/${b.id}`, { active: !b.active }); aviso(b.active ? "Acesso desativado. Os links dele param de funcionar." : "Acesso reativado."); rotear(); } }, b.active ? "Desativar" : "Reativar"),
        h("a", { class: "btn sm", href: "/clientes.csv?corretor=" + b.id, download: "clientes.csv" }, ic("down"), "CSV dos clientes")))),
    h("div", { class: "kpis" }, h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.clientes)), h("span", { class: "l" }, "clientes")), h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.novos)), h("span", { class: "l" }, "novos para atender")),
      h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.aberturas)), h("span", { class: "l" }, "aberturas")), h("div", { class: "card kpi" }, h("span", { class: "n" }, fmtN(b.fechados)), h("span", { class: "l" }, "fechados"))),
    h("div", { class: "card" }, tituloCard("user", "Dados para proposta"), b.cartao ? h("div", { class: "cartao-c" }, h("img", { class: "assin", src: b.cartao.signature, alt: "Assinatura digital de " + b.cartao.name }),
      h("div", null, h("b", { class: "wrap" }, b.cartao.name), h("p", { class: "muted wrap" }, [fone(b.cartao.phone), b.cartao.email].filter(Boolean).join(" · ")), h("p", { class: "muted small" }, "Cadastrado em " + dataHora(b.cartao.created) + " · o corretor não consegue alterar; só você."),
        h("div", { class: "row", style: "margin-top:10px" }, h("button", { class: "btn sm", onclick: () => formCartao(b) }, ic("edit"), "Editar contato"),
          h("button", { class: "btn sm", onclick: async () => { if (!confirm("Apagar os dados e a assinatura? O popup abrirá uma única vez para o corretor preencher de novo.")) return; await api("POST", `/api/brokers/${b.id}/cartao/liberar`, {}); aviso("Liberado: o corretor preenche de novo no próximo acesso."); rotear(); } }, "Liberar novo cadastro")))) : h("p", { class: "muted" }, "Ainda não cadastrou. Na primeira vez que ele escolher o perfil Corretor numa apresentação, o popup pede nome, telefone, e-mail e assinatura digital — uma única vez. Depois, só você altera aqui.")),
    h("div", { class: "card" }, tituloCard("people", `Clientes de ${b.name.split(" ")[0]}`), b.clientes_lista.length ? listaPessoas(b.clientes_lista, { semCorretor: true }) : vazio("people", "Nenhum cliente ainda", "Quando alguém se identificar num link dele, aparece aqui.")),
    h("div", { class: "card" }, h("div", { class: "row between" }, tituloCard("link", "Links"), h("button", { class: "btn sm", onclick: () => formLink(null, [b], b.id) }, ic("plus"), "Novo link")), b.links.length ? tabelaLinks(b.links, true) : h("p", { class: "muted" }, "Sem links ainda.")));
  return el;
}
function mostrarSenha(nome, email, senha) {
  const msg = `Seu acesso ao Link Corretor:\n${location.origin}/painel/\nE-mail: ${email}\nSenha: ${senha}`;
  dialogo("Acesso criado", [h("p", null, `Passe estes dados para ${nome}. A senha aparece só agora; depois só dá para gerar outra.`), h("div", { class: "senha", tabindex: "0" }, senha),
    h("div", { class: "row" }, h("button", { class: "btn", onclick: () => copiar(msg, "Dados de acesso copiados.") }, ic("copy"), "Copiar dados"), h("a", { class: "btn", target: "_blank", rel: "noopener", href: wa("", msg) }, ic("send"), "Enviar pelo WhatsApp"))],
    [h("button", { type: "button", class: "btn primary", onclick: (e) => { const d = e.target.closest("dialog"); d.close(); d.remove(); } }, "Pronto")]);
}
async function formCorretor() {
  const gers = dono() ? (await api("GET", "/api/gerentes")).filter((g) => g.active) : [];
  const filtroGer = sessionStorage.getItem("lc_ger") || "";
  dialogo("Novo corretor", [gers.length ? campo("Gerente de vendas", h("select", { name: "gerente_id" }, h("option", { value: "" }, "Sem gerente"), gers.map((g) => h("option", { value: g.id, selected: String(g.id) === filtroGer }, g.name))), "O gerente vê e cuida só dos corretores da equipe dele.") : null,
    campo("Nome", h("input", { type: "text", name: "nome", required: true, autocomplete: "off" })), campo("E-mail (é o login)", h("input", { type: "email", name: "email", required: true, autocomplete: "off" })),
    campo("WhatsApp", h("input", { type: "tel", name: "telefone", placeholder: "(47) 99999-9999", autocomplete: "off" }), "Aparece para o cliente na apresentação."), campo("Senha inicial", h("input", { type: "text", name: "senha", autocomplete: "off", placeholder: "Deixe vazio para gerar" }), "Mínimo de 8 caracteres."), campo("Foto (opcional)", h("input", { type: "file", name: "foto", accept: "image/png,image/jpeg,image/webp" }), "Quadrada (1:1): a imagem é recortada no centro. O corretor também pode trocar em Minha conta.")],
    [btnFechar(), btnOk("Criar acesso")], { onSubmit: async (f, fechar) => { const r = await api("POST", "/api/brokers", { nome: f.get("nome"), email: f.get("email"), telefone: f.get("telefone"), senha: f.get("senha"), gerente_id: f.get("gerente_id") || null }); const arq = f.get("foto"); if (arq && arq.size) { try { await api("PATCH", `/api/brokers/${r.id}`, { foto: await fotoQuadrada(arq) }); } catch (e) { aviso("Corretor criado, mas a foto não foi salva: " + e.message, true); } } fechar(); mostrarSenha(f.get("nome"), f.get("email"), r.senha); rotear(); } });
}
async function redefinir(b) { if (!confirm(`Gerar uma nova senha para ${b.name}? A atual deixa de funcionar e ele será desconectado.`)) return; const r = await api("PATCH", `/api/brokers/${b.id}`, { nova_senha: true }); mostrarSenha(b.name, b.email, r.senha); }

// ───────── gerentes de venda (só o dono) ─────────
function chipsGerentes(gers, bs, filtro) {
  const n = (id) => bs.filter((b) => String(b.manager_id || 0) === String(id)).length;
  const chip = (val, txt) => h("button", { type: "button", class: "chip", "aria-pressed": String(filtro === val), onclick: () => { sessionStorage.setItem("lc_ger", val); rotear(); } }, txt);
  return h("div", { class: "chips ger-chips", role: "group", "aria-label": "Filtrar por gerente de vendas" }, chip("", `Todos · ${bs.length}`), gers.filter((g) => g.active || n(g.id)).map((g) => chip(String(g.id), `${g.name} · ${n(g.id)}`)), n(0) ? chip("0", `Sem gerente · ${n(0)}`) : null);
}
async function gerentesDialogo() {
  const gers = await api("GET", "/api/gerentes");
  const lista = h("div", { class: "ger-lista" }, gers.length ? gers.map((g) => h("div", { class: "ger-it" + (g.active ? "" : " off") }, avatar(g.name, "sm", fotoDe(g.id, g.tem_foto)),
    h("div", { style: "min-width:0;flex:1" }, h("b", { class: "wrap" }, g.name, !g.active && pill("Desativado", "off")), h("div", { class: "muted small wrap" }, `${g.email} · ${g.corretores} corretor(es) · ${g.clientes} cliente(s)`)),
    h("div", { class: "row", style: "gap:6px;flex-wrap:nowrap" },
      h("button", { type: "button", class: "btn sm", onclick: async () => { if (!confirm(`Gerar uma nova senha para ${g.name}? A atual deixa de funcionar.`)) return; const r = await api("PATCH", `/api/gerentes/${g.id}`, { nova_senha: true }); d.fechar(); mostrarSenha(g.name, g.email, r.senha); } }, "Nova senha"),
      h("button", { type: "button", class: "btn sm" + (g.active ? " danger" : ""), onclick: async () => { await api("PATCH", `/api/gerentes/${g.id}`, { active: !g.active }); aviso(g.active ? "Gerente desativado. Os corretores continuam na equipe." : "Gerente reativado."); d.fechar(); rotear(); } }, g.active ? "Desativar" : "Reativar"))))
    : h("p", { class: "muted" }, "Nenhum gerente ainda."));
  const d = dialogo("Gerentes de venda", [h("p", { class: "muted small" }, "O gerente entra no painel com o próprio e-mail e senha e vê só a equipe dele: corretores, clientes, links e perguntas à IA. Ele também cadastra corretores e gera senha para eles. Empreendimentos, unidades, comissões e configurações continuam só com você."), lista],
    [btnFechar("Fechar"), h("button", { type: "button", class: "btn primary", onclick: () => { d.fechar(); formGerente(); } }, ic("plus"), "Novo gerente")]);
}
function formGerente() {
  dialogo("Novo gerente de vendas", [campo("Nome", h("input", { type: "text", name: "nome", required: true, autocomplete: "off" })), campo("E-mail (é o login)", h("input", { type: "email", name: "email", required: true, autocomplete: "off" })),
    campo("WhatsApp", h("input", { type: "tel", name: "telefone", placeholder: "(47) 99999-9999", autocomplete: "off" })), campo("Senha inicial", h("input", { type: "text", name: "senha", autocomplete: "off", placeholder: "Em branco: o painel gera uma" }), "Mínimo de 8 caracteres. Aparece uma vez na tela: copie e envie ao gerente.")],
    [btnFechar(), btnOk("Criar acesso")], { onSubmit: async (f, fechar) => { const r = await api("POST", "/api/gerentes", { nome: f.get("nome"), email: f.get("email"), telefone: f.get("telefone"), senha: f.get("senha") }); fechar(); mostrarSenha(f.get("nome"), f.get("email"), r.senha); rotear(); } });
}

// ───────── empreendimentos ─────────
// "Dados da cidade": até 5 boxes curtos (etiqueta, título, texto, 3 destaques) que aparecem na apresentação em Materiais → A cidade
const CID_TAGS = ["Dado", "Projeto", "Anunciado", "Em obras", "Em instalação", "Aberto", "Entregue"], CID_MAX = { titulo: 40, texto: 140, dado: 28 };
function contado(input, max) { const n = h("span", { class: "conta" }, `${input.value.length}/${max}`); input.addEventListener("input", () => { n.textContent = `${input.value.length}/${max}`; }); return h("div", { class: "com-conta" }, input, n); }
function blocoCidade(cards) {
  const box = (i) => { const c = cards[i] || {}, pre = `cid-${i}-`;
    const titulo = h("input", { type: "text", name: pre + "titulo", maxlength: CID_MAX.titulo, value: c.titulo || "", placeholder: i === 0 ? "Ex.: Alargamento da orla" : "" });
    const texto = h("textarea", { name: pre + "texto", maxlength: CID_MAX.texto, rows: 2, placeholder: i === 0 ? "Ex.: Faixa de areia ampliada, no mesmo modelo de Balneário Camboriú." : "" }, c.texto || "");
    const dados = [0, 1, 2].map((k) => h("input", { type: "text", name: pre + "d" + k, maxlength: CID_MAX.dado, value: (c.dados || [])[k] || "", placeholder: i === 0 ? ["4,75 km de orla", "+20 a 60 m de areia", "R$ 60 mi"][k] : "Destaque " + (k + 1) }));
    return h("details", { class: "cid-box", open: i === 0 && !cards.length ? true : null }, h("summary", null, h("b", null, `Box ${i + 1}`), h("span", { class: "muted small wrap" }, c.titulo || "vazio")),
      h("div", { class: "cid-campos" },
        campo("Etiqueta", h("select", { name: pre + "tag" }, CID_TAGS.map((t) => h("option", { value: t, selected: (c.tag || "Dado") === t ? true : null }, t === "Dado" ? "Sem etiqueta" : t)))),
        campo(`Título (até ${CID_MAX.titulo} letras)`, contado(titulo, CID_MAX.titulo)),
        campo(`Texto (até ${CID_MAX.texto} letras)`, contado(texto, CID_MAX.texto)),
        h("div", { class: "field" }, h("span", { class: "lbl" }, `Destaques (até 3, ${CID_MAX.dado} letras cada)`), h("div", { class: "cid-dados" }, dados)))); };
  return h("div", { class: "field" }, h("span", { class: "lbl" }, "Dados da cidade"),
    h("small", { class: "help" }, "Até 5 boxes curtos sobre a região (obras, valorização, serviços). Aparecem na apresentação em Materiais → A cidade. Box sem título não aparece."),
    h("div", { class: "cid-lista" }, [0, 1, 2, 3, 4].map(box)));
}
function lerCidade(f) { return [0, 1, 2, 3, 4].map((i) => ({ tag: f.get(`cid-${i}-tag`), titulo: (f.get(`cid-${i}-titulo`) || "").trim(), texto: (f.get(`cid-${i}-texto`) || "").trim(), dados: [0, 1, 2].map((k) => (f.get(`cid-${i}-d${k}`) || "").trim()).filter(Boolean) })).filter((c) => c.titulo || c.texto); }
async function telaProps() {
  const props = await api("GET", "/api/properties");
  const el = h("div", { class: "stack" }, cabeca("Empreendimentos", "A apresentação de cada um e o que a IA sabe sobre ele.", vistaToggle("props"), h("button", { class: "btn primary", onclick: () => formProp() }, ic("plus"), "Novo empreendimento")));
  if (!props.length) { el.append(h("div", { class: "card" }, vazio("building", "Nenhum empreendimento", "Cadastre o primeiro para poder gerar links."))); return el; }
  if (vista("props") === "tabela") {
    el.append(h("div", { class: "card" }, h("p", { class: "muted small", style: "margin-bottom:8px" }, "Clique numa linha para ver os clientes do empreendimento aqui mesmo."), tabela([
      { t: "Empreendimento", v: (p) => h("div", null, h("div", { class: "cell-main wrap" }, p.name), h("div", { class: "cell-sub wrap" }, p.city || "—")), cls: "main-cell" },
      { t: "Apresentação", v: (p) => p.tem_apresentacao ? pill(p.external_url ? "Link externo" : "3D", "on") : pill("Sem", "warn") }, { t: "IA", v: (p) => p.ai_on ? "Ligada" : "Desligada" },
      { t: "Idiomas", v: (p) => h("span", { class: "idiomas-lista" }, ...p.languages.map((l) => { const i = IDIOMAS_IA.find((x) => x[0] === l); return h("span", { class: "idioma", title: i ? i[2] : l }, i ? bandeira(i[1]) : null, l.split("-")[0].toUpperCase()); })) },
      { t: "Clientes", v: (p) => fmtN(p.clientes), cls: "num" }, { t: "Aberturas", v: (p) => fmtN(p.aberturas), cls: "num" }, { t: "Links", v: (p) => fmtN(p.links), cls: "num" },
      { t: "Situação", v: (p) => pill(p.active ? "Ativo" : "Pausado", p.active ? "on" : "off") },
      { t: "", v: (p) => h("div", { class: "row", style: "gap:6px;justify-content:flex-end" }, p.tem_apresentacao && h("a", { class: "btn sm", href: p.external_url || `/pre/${p.id}/`, target: "_blank", rel: "noopener", "aria-label": "Ver apresentação" }, ic("ext")), h("button", { class: "btn sm", "aria-label": "Editar", onclick: () => formProp(p) }, ic("edit"))), cls: "acoes" },
    ], props, async (p) => { const cs = await api("GET", "/api/clientes?empreendimento=" + p.id); return cs.length ? tabelaClientes(cs) : h("p", { class: "muted small" }, "Nenhum cliente ainda."); })));
    return el;
  }
  el.append(h("div", { class: "props emp" }, props.map((p) => h("article", { class: "card prop" + (p.capa ? " com-capa" : "") }, p.capa && h("img", { class: "prop-capa", src: p.capa, alt: "", loading: "lazy" }),
    h("div", { class: "row between", style: "align-items:flex-start" }, h("div", { style: "min-width:0" }, h("h2", { class: "wrap", style: "margin:0" }, p.name), h("span", { class: "muted small wrap" }, p.city || "Cidade não informada")), pill(p.active ? "Ativo" : "Pausado", p.active ? "on" : "off")),
    h("div", { class: "chips" }, p.tem_apresentacao ? pill(p.external_url ? "Link externo" : "Apresentação 3D", "on") : pill("Sem apresentação", "warn"), pill(p.ai_on ? "IA ligada" : "IA desligada"), pill(p.languages.map((l) => l.split("-")[0].toUpperCase()).join(" · "))),
    h("div", { class: "stats" }, h("div", null, h("b", null, fmtN(p.clientes)), h("span", null, "clientes")), h("div", null, h("b", null, fmtN(p.aberturas)), h("span", null, "aberturas")), h("div", null, h("b", null, fmtN(p.links)), h("span", null, "links"))),
    h("div", { class: "row" }, p.tem_apresentacao && h("a", { class: "btn sm", href: p.external_url || `/pre/${p.id}/`, target: "_blank", rel: "noopener" }, ic("ext"), "Ver apresentação"), h("button", { class: "btn sm", onclick: () => formProp(p) }, ic("edit"), "Editar"), h("a", { class: "btn sm", href: "#/clientes?empreendimento=" + p.id }, ic("people"), "Clientes"))))));
  return el;
}
async function formProp(p) {
  const novo = !p; p = p || { name: "", city: "", facts: "", whatsapp: "", ai_on: 1, form_on: 1, active: 1, languages: ["pt-BR"], source_dir: "", external_url: "", recursos: {} };
  const REC = [["selo", "Selo do corretor que atende"], ["whatsapp", "WhatsApp do corretor"], ["ia", "Perguntas à IA"], ["cadastro", "Cadastro do cliente (popup após 30 s)"]];
  const rec = p.recursos || {};
  let fontes = []; try { fontes = await api("GET", "/api/sources"); } catch { /* segue */ }
  if (p.source_dir && !fontes.includes(p.source_dir)) fontes.unshift(p.source_dir);
  const corpo = [h("div", { class: "grid2" }, campo("Nome", h("input", { type: "text", name: "name", value: p.name, required: true })), campo("Cidade ou região", h("input", { type: "text", name: "city", value: p.city }))),
    campo("Apresentação 3D", h("select", { name: "source_dir" }, h("option", { value: "" }, "Nenhuma (usar link externo)"), fontes.map((f) => h("option", { value: f, selected: f === p.source_dir }, f.split("/").slice(-2).join(" / ")))), "Pastas de apresentação encontradas dentro do projeto."),
    campo("Ou link externo", h("input", { type: "text", name: "external_url", value: p.external_url || "", placeholder: "https://…", inputmode: "url" }), "Se a apresentação já está publicada em outro lugar. Nesse caso o cadastro, a faixa do corretor e a IA não aparecem."),
    campo("WhatsApp do empreendimento", h("input", { type: "tel", name: "whatsapp", value: p.whatsapp ? fone(p.whatsapp) : "", placeholder: "(47) 99999-9999" }), "Usado quando o corretor não tem WhatsApp cadastrado."),
    h("div", { class: "field" }, h("span", { class: "lbl" }, "Idiomas da IA"), h("div", { class: "caixas cols3" }, IDIOMAS_IA.map(([c, pais, t]) => caixa(h("span", { class: "idioma" }, bandeira(pais), t), p.languages.includes(c), "lang-" + c))), h("small", { class: "help" }, "Os 9 idiomas mais falados. A IA responde no idioma do navegador do cliente, se estiver ligado aqui.")),
    h("div", { class: "field" }, h("span", { class: "lbl" }, "Recursos na apresentação"), h("div", { class: "caixas" }, REC.map(([k, t]) => caixa(t, rec[k] !== false, "rec-" + k))), h("small", { class: "help" }, "Tudo ligado por padrão. Desligue o que não quiser mostrar neste empreendimento; vale para todos os links dele.")),
    h("div", { class: "field" }, caixa("Empreendimento ativo (links funcionam)", p.active, "active")),
    campo("O que a IA sabe", h("textarea", { name: "facts", rows: 10, placeholder: "Tipologias, metragens, preços, condições de pagamento, áreas comuns, localização…" }, p.facts || ""), "Única fonte da IA: responde só com isso e manda falar com o corretor quando não souber. Mantenha preços e disponibilidade em dia.")];
  dialogo(novo ? "Novo empreendimento" : "Editar empreendimento", corpo, [btnFechar(), btnOk("Salvar")], { onSubmit: async (f, fechar) => {
    const corpoApi = { name: f.get("name"), city: f.get("city"), whatsapp: f.get("whatsapp"), languages: IDIOMAS_IA.map(([c]) => c).filter((c) => f.get("lang-" + c)), recursos: Object.fromEntries(REC.map(([k]) => [k, f.get("rec-" + k) === "on"])), ai_on: f.get("rec-ia") === "on", form_on: f.get("rec-cadastro") === "on", active: f.get("active") === "on", facts: f.get("facts"), source_dir: f.get("source_dir"), external_url: f.get("external_url") };
    await (novo ? api("POST", "/api/properties", corpoApi) : api("PATCH", `/api/properties/${p.id}`, corpoApi)); fechar(); aviso("Empreendimento salvo."); rotear(); } });
}

// ───────── links ─────────
function tabelaLinks(links, compacto, info) {
  return h("table", { class: "t" }, h("thead", null, h("tr", null, ["Link", !compacto && dono() ? "Corretor" : null, "Canal", "Cliques", "Clientes", "Aberturas", ""].filter((x) => x !== null).map((t) => h("th", { class: ["Cliques", "Clientes", "Aberturas"].includes(t) ? "num" : t ? "" : "th-info" }, t || (info ? lupaInfo(info) : ""))))),
    h("tbody", null, links.map((l) => h("tr", { class: l.active ? "" : "muted" },
      h("td", { class: "main-cell" }, h("div", { class: "cell-main wrap" }, l.empreendimento, !l.active && " ", !l.active && pill("pausado", "off")), h("div", { class: "cell-sub wrap mono" }, [l.label, `/r/${l.code}`].filter(Boolean).join(" · "))),
      !compacto && dono() && h("td", { "data-l": "Corretor", class: "wrap" }, l.corretor), h("td", { "data-l": "Canal" }, CANAIS[l.channel] || l.channel),
      h("td", { class: "num", "data-l": "Cliques" }, fmtN(l.cliques)), h("td", { class: "num", "data-l": "Clientes" }, fmtN(l.clientes)), h("td", { class: "num", "data-l": "Aberturas" }, fmtN(l.aberturas)),
      h("td", { class: "acoes" }, h("div", { class: "acoes-in" }, h("a", { class: "btn sm", href: `/p/${l.code}/`, target: "_blank", rel: "noopener", title: "Abrir a apresentação deste link", "aria-label": "Abrir a apresentação do link de " + l.corretor }, ic("ext"), "Abrir"), h("button", { class: "btn sm", onclick: () => mostrarQr(l) }, ic("qr"), "QR"),
        dono() ? h("button", { class: "btn sm", title: "Reenviar o link e o QR Code ao corretor", onclick: () => enviarAoCorretor(l) }, ic("send"), "WhatsApp")
          : h("a", { class: "btn sm", target: "_blank", rel: "noopener", href: wa("", `Olá! Preparei uma apresentação interativa do ${l.empreendimento} para você: ${urlLink(l.code)}`) }, ic("send"), "WhatsApp"),
        h("button", { class: "btn sm ghost", onclick: async () => { await api("PATCH", `/api/links/${l.id}`, { active: !l.active }); aviso(l.active ? "Link pausado." : "Link reativado."); rotear(); } }, l.active ? "Pausar" : "Reativar")))))));
}
// lupa no canto do cabeçalho: abre uma caixinha com a explicação (no lugar de um subtítulo comprido)
function lupaInfo(texto, rotulo = "Sobre esta tabela") {
  // abre ao clicar (fica aberta até clicar de novo ou fora) e, em aparelho com mouse, também ao passar o mouse (fecha ao sair)
  const caixa = h("div", { class: "info-pop", role: "tooltip", hidden: true }, texto);
  let fixa = false;
  const mostrar = (v) => { caixa.hidden = !v; btn.setAttribute("aria-expanded", String(v)); };
  const btn = h("button", { type: "button", class: "info-btn", "aria-label": rotulo, "aria-expanded": "false", title: rotulo,
    onclick: (e) => { e.stopPropagation(); fixa = !fixa; mostrar(fixa); } }, ic("search"));
  const fechar = (e) => { if (!caixa.isConnected) { document.removeEventListener("click", fechar); return; } if (!caixa.hidden && !caixa.contains(e.target)) { fixa = false; mostrar(false); } };
  document.addEventListener("click", fechar);
  const caixaWrap = h("div", { class: "info-wrap" }, btn, caixa);
  const comMouse = () => matchMedia("(hover:hover)").matches;
  let t = 0;  // pequeno atraso ao sair: dá tempo de o mouse atravessar o vão entre a lupa e a caixinha
  caixaWrap.addEventListener("mouseenter", () => { clearTimeout(t); if (comMouse()) mostrar(true); });
  caixaWrap.addEventListener("mouseleave", () => { if (comMouse() && !fixa) { clearTimeout(t); t = setTimeout(() => { if (!fixa) mostrar(false); }, 220); } });
  return caixaWrap;
}
async function telaLinks() {
  const [links, props, bs] = await Promise.all([api("GET", "/api/links"), api("GET", "/api/properties"), dono() ? api("GET", "/api/brokers") : []]);
  const el = h("div", { class: "stack" }, cabeca(dono() ? "Links acessados" : "Meus links", dono() ? "Todos os acessos, pelo link de cada corretor." : "Cada link identifica você e o canal.", h("button", { class: "btn primary", onclick: () => formLink(props.filter((p) => p.active), bs) }, ic("plus"), "Novo link")));
  el.append(h("div", { class: "card" }, links.length ? tabelaLinks(links, false, dono() ? "A contagem de todos os acessos, separada pelo link de cada corretor: cliques, clientes que se cadastraram e aberturas da apresentação. Se um corretor perder o link dele, reenvie por aqui: o QR Code já leva o link escrito, e o WhatsApp abre a conversa com o próprio corretor." : "Cliques, clientes que se cadastraram e aberturas de cada um dos seus links. O cliente se cadastra na primeira abertura.") : vazio("link", "Nenhum link ainda", "Crie um por empreendimento e canal (WhatsApp, Instagram, QR…)."))); return el;
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
  const enviar = dono()
    ? h("button", { type: "button", class: "btn primary", onclick: () => enviarAoCorretor(l) }, ic("send"), "Enviar ao corretor")
    : h("a", { class: "btn primary", target: "_blank", rel: "noopener", href: wa("", `Olá! Preparei uma apresentação interativa do ${l.empreendimento} para você: ${url}`) }, ic("send"), "Enviar no WhatsApp");
  dialogo(novo ? "Link criado" : "QR Code do link", [h("p", { class: "muted" }, `${l.empreendimento} · ${l.corretor ? l.corretor + " · " : ""}${CANAIS[l.channel] || l.channel}${l.label ? " · " + l.label : ""}`), caixaQr, h("div", { class: "linkbox" }, h("code", null, url), h("button", { class: "btn sm", onclick: () => copiar(url, "Link copiado.") }, ic("copy"), "Copiar")),
    h("p", { class: "muted small" }, "A imagem baixada já leva o link escrito embaixo do QR Code.")],
    [h("button", { type: "button", class: "btn", onclick: () => baixarQr(l) }, ic("down"), "Baixar PNG"), enviar]);
}
// PNG do QR com o link escrito embaixo (e de quem é o link): serve para imprimir ou reenviar ao corretor
function qrPng(l) {
  const url = urlLink(l.code), tmp = h("div"); tmp.innerHTML = svgQr(url);
  const svg = tmp.querySelector("svg"), vb = svg.viewBox.baseVal.width || 200, img = new Image(), xml = new XMLSerializer().serializeToString(svg);
  return new Promise((res, rej) => {
    img.onload = () => {
      const W = 1024, c = h("canvas", { width: W, height: W + 170 }), x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, W, W + 170); x.imageSmoothingEnabled = false; x.drawImage(img, 64, 64, W - 128, W - 128);
      x.fillStyle = "#0f172a"; x.textAlign = "center"; x.textBaseline = "alphabetic";
      x.font = "600 44px Figtree, system-ui, sans-serif"; x.fillText(url.replace(/^https?:\/\//, ""), W / 2, W + 20, W - 80);
      x.fillStyle = "#5f6f83"; x.font = "400 34px Figtree, system-ui, sans-serif"; x.fillText([l.empreendimento, l.corretor, CANAIS[l.channel] || l.channel].filter(Boolean).join(" · "), W / 2, W + 80, W - 80);
      c.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png");
    };
    img.onerror = rej;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml.replace("<svg", `<svg width="${vb}" height="${vb}"`));
  });
}
async function baixarQr(l) {
  const b = await qrPng(l), a = h("a", { href: URL.createObjectURL(b), download: `qr-${l.code}.png` }); document.body.append(a); a.click(); a.remove();
}
// Dono reenvia o link ao próprio corretor: abre o WhatsApp dele com o link na mensagem e o QR Code pronto para colar (ou compartilhar, no celular)
async function enviarAoCorretor(l) {
  const url = urlLink(l.code), nome = (l.corretor || "").split(" ")[0];
  const texto = `Olá${nome ? ", " + nome : ""}! Este é o seu link do ${l.empreendimento} (${CANAIS[l.channel] || l.channel}${l.label ? " · " + l.label : ""}): ${url}\nTudo o que o cliente fizer por ele fica no seu nome. O QR Code com o mesmo link vai em seguida.`;
  const celular = matchMedia("(pointer: coarse)").matches && !!navigator.canShare;
  const aba = celular ? null : window.open("", "_blank");  // abre já no clique: depois de esperar o PNG o navegador bloquearia
  let png = null; try { png = await qrPng(l); } catch { /* segue só com o link */ }
  const arquivo = png && new File([png], `qr-${l.code}.png`, { type: "image/png" });
  if (celular && arquivo && navigator.canShare({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], text: texto }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  let copiou = false;
  if (png && navigator.clipboard && window.ClipboardItem) { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]); copiou = true; } catch { /* sem permissão */ } }
  if (!l.corretor_fone) aviso(`${l.corretor || "Este corretor"} não tem telefone cadastrado: escolha o contato no WhatsApp.`, true);
  const destino = wa(l.corretor_fone || "", texto);
  if (aba) { aba.opener = null; aba.location.href = destino; } else window.open(destino, "_blank", "noopener");
  if (copiou) aviso("QR Code copiado. Na conversa do WhatsApp, cole (Ctrl+V) para enviar a imagem.");
  else if (png) { baixarQr(l); aviso("QR Code baixado. Anexe a imagem na conversa do WhatsApp."); }
}

// ───────── perguntas, configurações, conta ─────────
// ───────── Perguntas à IA: iPhone 17 com a caixa que o cliente vê, para testar a IA (só dono) ─────────
function simuladorIA() {
  const mock = h("div", { class: "sim-mock" });
  const box = h("aside", { class: "sim-ia", "aria-label": "Teste da IA como o cliente vê (não entra no histórico nem no limite do mês)" }, mock);
  api("GET", "/api/properties").then((todos) => {
    const ps = todos.filter((p) => p.active);
    if (!ps.length || !window.DeviceMockup) { mock.replaceChildren(vazio("building", "Cadastre um empreendimento para testar")); return; }
    let prop = ps.find((p) => (p.facts || "").trim()) || ps[0];
    const aparelho = DeviceMockup.mount(mock, "", { model: "iphone-17-pro-verde", width: 300, darkStatus: true });
    const tela = aparelho.querySelector(".dp-screen");
    const conteudo = h("div", { class: "sim-tela" }); tela.prepend(conteudo);
    const escolha = ps.length > 1 ? h("select", { class: "sim-sel", "aria-label": "Empreendimento", onchange: (e) => { prop = ps.find((p) => String(p.id) === e.target.value) || prop; montar(); } }, ps.map((p) => h("option", { value: p.id, selected: p.id === prop.id }, p.name))) : null;
    const montar = () => {
      const msgs = h("div", { class: "sim-msgs" }, h("div", { class: "sim-m bot" }, `Oi! Sou o assistente do ${prop.name}. Pergunte o que quiser; se eu não souber, o corretor responde você.`));
      const inp = h("input", { type: "text", maxlength: 500, placeholder: "Escreva sua pergunta…", "aria-label": "Pergunta de teste para a IA", autocomplete: "off" });
      const go = h("button", { class: "sim-go", type: "submit", "aria-label": "Enviar" }, ic("send"));
      let ocupado = false;
      const bolha = (cls, t) => { const d = h("div", { class: "sim-m " + cls }, t); msgs.append(d); msgs.scrollTop = msgs.scrollHeight; return d; };
      const sug = h("div", { class: "sim-sug" }, ["Quais opções estão disponíveis?", "Quais as formas de pagamento?", "O que tem de lazer?"].map((t) => h("button", { type: "button", onclick: () => enviar(t) }, t)));
      async function enviar(t) {
        t = (t || "").trim(); if (!t || ocupado) return;
        ocupado = true; go.disabled = true; sug.remove(); bolha("me", t); inp.value = "";
        const p = bolha("bot pensando", "Pensando…");
        try { const r = await api("POST", "/api/ia-teste", { property_id: prop.id, pergunta: t }); p.className = "sim-m bot" + (r.resposta ? "" : " err"); p.textContent = r.resposta || "Não consegui responder agora. Fale direto com o corretor."; }
        catch (e) { p.className = "sim-m bot err"; p.textContent = (e && e.message) || "Falha ao falar com a IA."; }
        ocupado = false; go.disabled = false; msgs.scrollTop = msgs.scrollHeight;
      }
      conteudo.replaceChildren(h("div", { class: "sim-sheet" },
        h("div", { class: "sim-hd" }, h("span", { class: "sim-av", "aria-hidden": "true" }, ini(S.me.name)),
          h("div", { style: "min-width:0;flex:1" }, h("b", null, prop.name), h("span", null, "Atendimento por " + S.me.name.split(" ")[0]))),
        escolha && h("div", { class: "sim-escolha" }, escolha),
        h("div", { class: "sim-tabs", "aria-hidden": "true" }, h("span", { class: "on" }, "Pergunte à IA"), h("span", null, "Falar com corretor")),
        msgs, sug, h("p", { class: "sim-note" }, "Respostas geradas por IA a partir das informações do empreendimento."),
        h("form", { class: "sim-in", onsubmit: (e) => { e.preventDefault(); enviar(inp.value); } }, inp, go)));
    };
    montar();
  }).catch(() => mock.replaceChildren(h("p", { class: "muted small" }, "Não foi possível carregar os empreendimentos.")));
  return box;
}
const comCelular = (el) => (dono() ? h("div", { class: "perg-layout" }, el, simuladorIA()) : el);
async function telaPerguntas() {
  const qs = await api("GET", "/api/questions");
  const el = h("div", { class: "stack col-padrao" }, cabeca("Perguntas à IA", "O que os clientes querem saber. Cada pergunta está ligada a um cliente identificado."));
  if (!qs.length) { el.append(h("div", { class: "card" }, vazio("chat", "Nenhuma pergunta ainda"))); return comCelular(el); }
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
  return comCelular(el);
}
async function telaConfig() {
  const c = await api("GET", "/api/settings"), pct = c.ai_limite ? Math.min(100, Math.round((c.ai_usadas / c.ai_limite) * 100)) : 100;
  return h("div", { class: "stack col-padrao" }, cabeca("Configurações"),
    h("form", { class: "card stack", novalidate: true, onsubmit: async (e) => { e.preventDefault(); const f = new FormData(e.target); try { await api("PATCH", "/api/settings", { empresa: f.get("empresa"), ai_limite: Number(f.get("ai_limite")), notify_min: Number(f.get("notify_min")) }); S.empresa = f.get("empresa"); aviso("Configurações salvas."); rotear(); } catch (x) { aviso(x.message, true); } } },
      tituloCard("building", "Empresa e IA"), campo("Nome da empresa", h("input", { type: "text", name: "empresa", value: c.empresa, required: true }), "Aparece no painel, no cadastro do cliente e no aceite."),
      blocoLogo(c),
      campo("Aviso de cliente novo, depois de quantos minutos", h("input", { type: "number", name: "notify_min", min: 0, max: 120, value: c.notify_min }), "O painel avisa que o cliente abriu, se cadastrou e de qual corretor veio. Padrão: 5 minutos."),
      campo("Perguntas à IA por mês, por empreendimento", h("input", { type: "number", name: "ai_limite", min: 0, max: 100000, value: c.ai_limite }), "Passou do teto, a IA para e manda falar com o corretor."),
      h("div", null, h("div", { class: "row between small" }, h("span", null, "Uso neste mês"), h("strong", null, fmtN(c.ai_usadas))), h("div", { class: "bar", style: "margin-top:6px" }, h("i", { style: `width:${pct}%` }))),
      !c.claude_cli && h("p", { class: "err", style: "display:block" }, "O Claude Code não foi encontrado neste computador: as perguntas à IA ficam sem resposta."), h("div", null, h("button", { class: "btn primary", type: "submit" }, "Salvar"))),
    blocoVisual(),
    h("div", { class: "card stack" }, tituloCard("swap", "Regra da comissão"), h("p", { class: "muted" }, "O cliente pertence ao primeiro corretor por quem se identificou. Se abrir o link de outro corretor, a abertura é registrada no nome dele, mas a origem não muda. Só o dono transfere um cliente, na página do cliente.")),
)
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
  return h("div", { class: "card stack" }, tituloCard("sliders", "Visual do painel"), h("p", { class: "muted" }, "Novo: barra ardósia, acento esmeralda e cartões com borda. Clássico: verde-escuro e latão. A escolha vale só neste navegador."), chips,
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
// ───────── Minha conta → IA do cliente (bloqueada até a senha da VGVX) ─────────
const fav = (d) => `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
const LLMS = [
  { id: "openai", n: "OpenAI", d: "openai.com", fmt: "sk-proj-••••••••••••••••••••AbC1", ini: "sk-proj-", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", n: "Claude", d: "anthropic.com", fmt: "sk-ant-api03-••••••••••••••••••AA", ini: "sk-ant-", url: "https://console.anthropic.com/settings/keys" },
  { id: "gemini", n: "Gemini", d: "gemini.google.com", fmt: "AIzaSy•••••••••••••••••••••••••Xy9", ini: "AIza", url: "https://aistudio.google.com/apikey" },
  { id: "groq", n: "Groq", d: "groq.com", fmt: "gsk_••••••••••••••••••••••••••••Q2", ini: "gsk_", url: "https://console.groq.com/keys" },
  { id: "mistral", n: "Mistral", d: "mistral.ai", fmt: "32 letras e números · ••••••••Ab12", ini: "", url: "https://console.mistral.ai/api-keys" },
  { id: "deepseek", n: "DeepSeek", d: "deepseek.com", fmt: "sk-••••••••••••••••••••••••••••3f9a", ini: "sk-", url: "https://platform.deepseek.com/api_keys" },
  { id: "xai", n: "Grok (xAI)", d: "x.ai", fmt: "xai-••••••••••••••••••••••••••••Zt7", ini: "xai-", url: "https://console.x.ai" },
  { id: "openrouter", n: "OpenRouter", d: "openrouter.ai", fmt: "sk-or-v1-••••••••••••••••••••••c4d2", ini: "sk-or-v1-", url: "https://openrouter.ai/keys" },
  { id: "perplexity", n: "Perplexity", d: "perplexity.ai", fmt: "pplx-••••••••••••••••••••••••••8kLm", ini: "pplx-", url: "https://www.perplexity.ai/settings/api" },
  { id: "cohere", n: "Cohere", d: "cohere.com", fmt: "40 letras e números · ••••••••wX3q", ini: "", url: "https://dashboard.cohere.com/api-keys" },
  { id: "together", n: "Together AI", d: "together.ai", fmt: "tgp_v1_•••••••••••••••••••••••••R5s", ini: "tgp_", url: "https://api.together.ai/settings/api-keys" },
  { id: "qwen", n: "Qwen (Alibaba)", d: "qwen.ai", fmt: "sk-••••••••••••••••••••••••••••a1b2", ini: "sk-", url: "https://dashscope.console.aliyun.com/apiKey" },
];
function boxIACliente() {
  const box = h("section", { class: "card ia-cli", "aria-label": "IA do cliente" });
  const pintar = (st) => {
    const lib = st.liberada;
    const tile = (m) => {
      const tem = st.provedores[m.id], ativo = st.ativo === m.id;
      return h("button", { type: "button", class: "ia-tile" + (tem ? " tem" : "") + (ativo ? " ativo" : ""), disabled: !lib, "aria-label": `${m.n}${tem ? " · chave cadastrada" : ""}${ativo ? " · em uso" : ""}`, onclick: () => chaveLLM(m, st, pintar) },
        h("img", { src: fav(m.d), alt: "", width: 32, height: 32, loading: "lazy", referrerpolicy: "no-referrer" }),
        h("span", { class: "ia-n" }, m.n),
        h("span", { class: "ia-st" }, ativo ? "Em uso" : tem ? "•••" + tem.final : ""));  // sem chave: nenhuma frase, o logo ocupa o espaço
    };
    const grade = h("div", { class: "ia-grade" }, LLMS.map(tile));
    const sub = lib ? "Escolha a LLM e cole a chave de API da sua empresa. A IA da apresentação passa a usar a sua conta." : "Use a chave de API da sua própria LLM na IA que responde os clientes.";
    const corpo = [h("div", { class: "row between" }, tituloCard("chat", "IA do cliente"), lupaInfo(sub, "Sobre a IA do cliente")),
      h("div", { class: "ia-area" + (lib ? "" : " bloq") }, grade, !lib && travaVGVX(pintar))];
    box.replaceChildren(...corpo);
  };
  api("GET", "/api/ia-cliente").then(pintar).catch(() => box.replaceChildren(tituloCard("chat", "IA do cliente"), h("p", { class: "muted" }, "Não foi possível carregar.")));
  return box;
}
function travaVGVX(pintar) {
  const inp = h("input", { type: "password", name: "vgvx", autocomplete: "off", placeholder: "Senha de liberação", "aria-label": "Senha de liberação da VGVX", required: true });
  const erro = h("p", { class: "err", role: "alert" });
  return h("form", { class: "ia-trava", novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); erro.textContent = ""; if (!inp.value.trim()) { erro.textContent = "Digite a senha."; inp.focus(); return; }
      try { const st = await api("POST", "/api/ia-cliente/liberar", { senha: inp.value }); aviso("IA do cliente liberada."); pintar(st); } catch (x) { erro.textContent = x.message; inp.select(); } } },
    h("span", { class: "ic-box ia-cadeado", "aria-hidden": "true" }, ic("lock")),
    h("strong", null, "Função bloqueada"),
    h("p", { class: "muted small" }, "Para liberar, digite a senha fornecida pela VGVX."),
    h("div", { class: "ia-trava-row" }, comOlho(inp), h("button", { class: "btn primary", type: "submit" }, "Desbloquear")), erro);
}
function chaveLLM(m, st, pintar) {
  const tem = st.provedores[m.id];
  const inp = h("input", { type: "password", name: "chave", id: "ia-chave-in", autocomplete: "off", spellcheck: "false", placeholder: m.fmt, class: "ia-chave", "aria-describedby": "ia-fmt" });
  const ver = h("button", { type: "button", class: "btn sm ghost", onclick: () => { inp.type = inp.type === "password" ? "text" : "password"; ver.textContent = inp.type === "password" ? "Mostrar" : "Ocultar"; } }, "Mostrar");
  const corpo = [
    h("div", { class: "ia-dlg-topo" }, h("img", { src: fav(m.d), alt: "", width: 40, height: 40, referrerpolicy: "no-referrer" }), h("div", null, h("strong", null, m.n), h("span", { class: "muted small" }, tem ? `Chave cadastrada, termina em ${tem.final}.` : "Nenhuma chave cadastrada."))),
    h("div", { class: "field" }, h("label", { for: "ia-chave-in" }, "Chave de API"), h("div", { class: "ia-chave-row" }, inp, ver),
      h("span", { class: "hint" }, m.ini ? `Começa com ${m.ini} e termina com letras e números, como no exemplo do campo.` : "É uma sequência de letras e números, como no exemplo do campo.")),
    h("p", { class: "muted small", id: "ia-fmt" }, "A chave fica guardada no servidor e nunca aparece inteira de novo. ", h("a", { href: m.url, target: "_blank", rel: "noopener" }, `Onde pegar a chave da ${m.n} →`))];
  const botoes = [btnFechar(),
    tem && h("button", { type: "button", class: "btn ghost danger", onclick: async (e) => { const st2 = await api("POST", "/api/ia-cliente/chave", { provedor: m.id, chave: "" }); e.target.closest("dialog")?.close(); e.target.closest("dialog")?.remove(); aviso("Chave removida."); pintar(st2); } }, "Remover"),
    tem && st.ativo !== m.id && h("button", { type: "button", class: "btn", onclick: async (e) => { const st2 = await api("POST", "/api/ia-cliente/ativar", { provedor: m.id }); e.target.closest("dialog")?.close(); e.target.closest("dialog")?.remove(); aviso(`${m.n} em uso.`); pintar(st2); } }, "Usar esta"),
    btnOk("Salvar chave")].filter(Boolean);
  dialogo(`Chave da ${m.n}`, corpo, botoes, { onSubmit: async (f, fechar) => {
    const v = String(f.get("chave") || "").trim();
    if (!v) throw new Error("Cole a chave de API.");
    if (m.ini && !v.startsWith(m.ini) && !confirm(`A chave da ${m.n} costuma começar com "${m.ini}". Salvar mesmo assim?`)) return;
    const st2 = await api("POST", "/api/ia-cliente/chave", { provedor: m.id, chave: v }); fechar(); aviso(`Chave da ${m.n} salva. Ela passa a ser a LLM em uso.`); pintar(st2); } });
}
async function telaConta() {
  // nome com lápis: clicar troca o nome por um campo no lugar; Enter salva, Esc cancela
  const nomeBox = h("div", { class: "hero-nome" });
  const verNome = () => nomeBox.replaceChildren(h("strong", { class: "wrap hero-n" }, S.me.name),
    h("button", { type: "button", class: "lapis", "aria-label": "Editar nome", title: "Editar nome", onclick: () => editarNome() }, ic("edit")));
  const editarNome = () => {
    const inp = h("input", { type: "text", name: "nome", value: S.me.name, maxlength: 80, "aria-label": "Nome", autocomplete: "name", class: "hero-in" });
    const salvar = async () => {
      const v = inp.value.trim(); if (!v) { aviso("Digite o nome.", true); inp.focus(); return; } if (v === S.me.name) { verNome(); return; }
      try { await api("POST", "/api/me/nome", { nome: v }); S.me.name = v; aviso("Nome salvo."); casca(); rotear(); } catch (x) { aviso(x.message, true); }
    };
    nomeBox.replaceChildren(inp, h("button", { type: "button", class: "lapis ok", "aria-label": "Salvar nome", title: "Salvar", onclick: salvar }, ic("check")), h("button", { type: "button", class: "lapis", "aria-label": "Cancelar", title: "Cancelar", onclick: verNome }, ic("x")));
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); salvar(); } else if (e.key === "Escape") { e.stopPropagation(); verNome(); } });
    inp.focus(); inp.select();
  };
  verNome();
  const col = h("div", { class: "conta-col" },
    h("div", { class: "card hero-p hero-grande" }, avatar(S.me.name, "xl", fotoDe(S.me.id, S.me.tem_foto)), h("div", { class: "hero-info" }, nomeBox, h("div", { class: "muted wrap" }, S.me.email), h("div", null, pill(papelNome(), "on")),
      h("div", { class: "row", style: "margin-top:8px" }, h("button", { class: "btn sm", type: "button", onclick: () => escolherFoto(async (d) => { await api("POST", "/api/me/foto", { foto: d }); S.me.tem_foto = true; S_FOTO.v = Date.now(); aviso("Foto salva."); casca(); rotear(); }) }, S.me.tem_foto ? "Trocar foto" : "Adicionar foto"),
        S.me.tem_foto && h("button", { class: "btn sm ghost", type: "button", onclick: async () => { await api("POST", "/api/me/foto", { foto: "" }); S.me.tem_foto = false; aviso("Foto removida."); casca(); rotear(); } }, "Remover")),
      !dono() && h("p", { class: "muted small", style: "margin-top:6px" }, "A foto (1:1) aparece no seu selo para a construtora."))),
    h("form", { class: "card stack", novalidate: true, onsubmit: async (e) => { e.preventDefault(); const f = new FormData(e.target); try { await api("POST", "/api/me/senha", { atual: f.get("atual"), nova: f.get("nova") }); aviso("Senha alterada."); e.target.reset(); } catch (x) { aviso(x.message, true); } } },
      tituloCard("user", "Trocar senha"), campoSenha("Senha atual", { name: "atual", autocomplete: "current-password", required: true  }), campo("Nova senha", h("input", { type: "password", name: "nova", autocomplete: "new-password", minlength: 8, required: true }), "Mínimo de 8 caracteres."),
      h("div", null, h("button", { class: "btn primary", type: "submit" }, "Trocar senha"))));
  // mosaico: título acima, depois as duas colunas com a mesma altura (os cartões esticam para fechar embaixo na mesma linha)
  return h("div", { class: "stack" }, cabeca("Minha conta"), h("div", { class: "conta-layout" + (dono() ? "" : " solo") }, col, dono() && boxIACliente()));
}

// ───────── Unidades: andares em quadradinhos (disponível / reservado / vendido), preço por apartamento e tabela de preços (só dono) ─────────
async function telaUnidades() {
  const props = (await api("GET", "/api/properties")).filter((p) => p.tem_apresentacao && !p.external_url);
  const lembrado = Number(sessionStorage.getItem("lc_un_prop")) || 0;
  const prop = props.find((p) => p.id === lembrado) || props[0];
  const selProp = props.length > 1 ? h("select", { "aria-label": "Empreendimento", onchange: (e) => { sessionStorage.setItem("lc_un_prop", e.target.value); rotear(); } }, props.map((p) => h("option", { value: p.id, selected: prop && p.id === prop.id }, p.name))) : null;
  const el = h("div", { class: "stack" }, cabeca("Unidades", "Disponível, reservado ou vendido, andar por andar. Clique num apartamento para mudar.", selProp));
  if (!prop) { el.append(h("div", { class: "card" }, vazio("building", "Nenhum empreendimento com apresentação", "As unidades vêm dos andares da apresentação 3D."))); return el; }
  const d = await api("GET", `/api/properties/${prop.id}/unidades`);
  const ST = { d: "Disponível", r: "Reservado", v: "Vendido" };
  const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const tot = { d: 0, r: 0, v: 0 }; d.andares.forEach((a) => a.aptos.forEach((x) => { tot[x.status] = (tot[x.status] || 0) + 1; }));
  const sq = (s) => h("i", { class: "un-sq", "data-s": s, "aria-hidden": "true" });
  const legenda = h("div", { class: "un-leg" }, ["d", "r", "v"].map((s) => h("span", { class: "un-leg-it" }, sq(s), `${ST[s]} · ${tot[s] || 0}`)));
  const ativo = d.fonte === "banco";
  const editar = (a, x) => {
    if (!ativo) { aviso("Ative o controle das unidades primeiro.", true); return; }
    let st = x.status;
    const seg = h("div", { class: "un-seg", role: "group", "aria-label": "Situação" }, ["d", "r", "v"].map((s) => h("button", { type: "button", "data-s": s, "aria-pressed": String(st === s),
      onclick: () => { st = s; seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s === s))); } }, sq(s), ST[s])));
    const preco = h("input", { type: "text", name: "preco", inputmode: "decimal", value: x.price ? brl(x.price).replace("R$", "").trim() : "", placeholder: "Ex.: 1.250.000", autocomplete: "off" });
    dialogo(`Apto ${x.id} · ${a.label}`, [h("p", { class: "muted" }, [x.area && x.area + " m²", x.lado].filter(Boolean).join(" · ")), campo("Situação", seg), campo("Preço (R$)", preco, "Em branco: a ficha não mostra preço.")],
      [btnFechar(), btnOk("Salvar")], { onSubmit: async (f, fechar) => {
        const v = String(f.get("preco") || "").replace(/[R$\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); const p = v ? Number(v) : 0;
        if (v && !(p >= 0)) throw new Error("Preço inválido.");
        await api("PATCH", `/api/properties/${prop.id}/unidades`, { itens: [{ floor: a.num, unit: x.id, status: st, price: p }] }); fechar(); aviso(`Apto ${x.id}: ${ST[st]}${p ? " · " + brl(p) : ""}.`); rotear(); } });
  };
  const finais = (d.andares[0] ? d.andares[0].aptos : []).map((x) => x.id.slice(-2));
  const grade = h("div", { class: "un-grid" }, finais.length > 1 && h("div", { class: "un-head", "aria-hidden": "true" }, finais.map((f) => h("span", null, f))),
    d.andares.map((a) => h("div", { class: "un-row" }, h("span", { class: "un-floor" }, String(a.num)),
      a.aptos.map((x) => h("button", { type: "button", class: "un-sq un-btn", "data-s": x.status, title: `Apto ${x.id} · ${ST[x.status]}${x.price ? " · " + brl(x.price) : ""}`,
        "aria-label": `Apto ${x.id}, ${ST[x.status]}${x.price ? ", " + brl(x.price) : ""}`, onclick: () => editar(a, x) })))));
  const ativar = !ativo && d.andares.length ? h("div", { class: "card alerta-card un-ativar" },
    h("div", null, h("strong", null, "Os andares vieram da apresentação 3D."), h("p", { class: "muted small", style: "margin:4px 0 0" }, "Ative para controlar daqui. As mudanças aparecem na apresentação na hora: luz acesa nas unidades vendidas e reservadas, e o preço na ficha.")),
    h("button", { class: "btn primary", type: "button", onclick: async (e) => { e.target.disabled = true; try { await api("POST", `/api/properties/${prop.id}/unidades/importar`, {}); aviso("Controle de unidades ativado."); rotear(); } catch (x) { aviso(x.message, true); e.target.disabled = false; } } }, "Ativar controle")) : null;
  const mapa = h("div", { class: "card" }, h("div", { class: "un-top" }, tituloCard("grid", "Mapa de unidades"), legenda),
    d.andares.length ? grade : vazio("building", "A apresentação não tem andares", "Este mapa usa os andares e apartamentos da apresentação 3D."));

  // tabela de preços: cola ou envia um CSV (unidade;preco ou andar;final;preco) e aplica nos empreendimentos marcados
  const num = (s) => { const v = String(s || "").replace(/R\$|\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); const n = Number(v); return v && Number.isFinite(n) && n >= 0 ? n : null; };
  const parse = (txt) => {
    const out = []; let ign = 0, cols = null;
    for (const l of txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)) {
      const c = (l.includes(";") ? l.split(";") : l.includes("\t") ? l.split("\t") : l.split(",")).map((x) => x.replace(/^"|"$/g, "").trim());
      const low = c.map((x) => x.toLowerCase());
      if (!cols && c.length >= 2 && num(c[c.length - 1]) === null) {  // cabeçalho
        const i = (re) => low.findIndex((x) => re.test(x));
        cols = { unit: i(/unid|apto|apart/), floor: i(/andar|pav/), final: i(/final|coluna|lado/), price: i(/pre[çc]o|valor/) }; if (cols.price < 0) cols.price = c.length - 1; continue;
      }
      let unit = null, price = null;
      if (cols) { price = num(c[cols.price]); if (cols.unit >= 0) unit = c[cols.unit]; else if (cols.floor >= 0 && cols.final >= 0) unit = `${(c[cols.floor] || "").replace(/\D/g, "")}${(c[cols.final] || "").replace(/\D/g, "").padStart(2, "0")}`; }
      else if (c.length === 2) { unit = c[0]; price = num(c[1]); }
      else if (c.length >= 3) { unit = `${c[0].replace(/\D/g, "")}${c[1].replace(/\D/g, "").padStart(2, "0")}`; price = num(c[c.length - 1]); }
      unit = String(unit || "").replace(/\D/g, "");
      if (unit && price !== null) out.push({ unit, price }); else ign++;
    }
    return { linhas: out, ignoradas: ign };
  };
  let linhas = [];
  const ta = h("textarea", { rows: 7, "aria-label": "Tabela de preços", placeholder: "unidade;preco\n1501;1250000\n1502;1390000\n\nou  andar;final;preco\n15;01;1250000" });
  const prev = h("p", { class: "un-prev muted small" });
  const prever = () => { const r = parse(ta.value); linhas = r.linhas; prev.textContent = r.linhas.length ? `${r.linhas.length} unidade(s) com preço` + (r.ignoradas ? ` · ${r.ignoradas} linha(s) ignorada(s)` : "") : ta.value.trim() ? "Nenhuma linha reconhecida. Use unidade;preco ou andar;final;preco." : ""; };
  ta.addEventListener("input", prever);
  const file = h("input", { type: "file", accept: ".csv,.txt,text/csv,text/plain", style: "display:none", onchange: async (e) => { const f = e.target.files[0]; if (!f) return; ta.value = await f.text(); prever(); e.target.value = ""; } });
  const cks = h("div", { class: "un-cks" }, props.map((p) => caixa(p.name, p.id === prop.id, "p" + p.id)));
  const aplicar = h("button", { class: "btn primary", type: "button", onclick: async () => {
    const ids = [...cks.querySelectorAll("input:checked")].map((i) => Number(i.name.slice(1)));
    if (!linhas.length) { aviso("Cole ou envie a tabela de preços primeiro.", true); ta.focus(); return; }
    if (!ids.length) { aviso("Marque pelo menos um empreendimento.", true); return; }
    aplicar.disabled = true;
    try { const r = await api("POST", "/api/unidades/precos", { property_ids: ids, linhas }); const n = Object.values(r.atualizados).reduce((a, b) => a + b, 0), falt = Object.values(r.nao_encontradas).reduce((a, b) => a + b.length, 0);
      aviso(`${n} preço(s) atualizado(s) em ${Object.keys(r.atualizados).length} empreendimento(s).${falt ? ` ${falt} unidade(s) da tabela não existem.` : ""}`); rotear(); }
    catch (x) { aviso(x.message, true); } aplicar.disabled = false; } }, ic("upload"), "Aplicar nos selecionados");
  const precos = h("div", { class: "card stack un-precos" }, tituloCard("upload", "Tabela de preços"),
    h("p", { class: "muted small", style: "margin:0" }, "Cole a tabela (uma unidade por linha) ou envie um CSV exportado da planilha. Colunas: unidade e preço, ou andar, final e preço."),
    h("div", { class: "row", style: "gap:8px" }, h("button", { class: "btn sm", type: "button", onclick: () => file.click() }, ic("upload"), "Enviar CSV"), file), ta, prev,
    h("div", null, h("span", { class: "eyebrow" }, "Aplicar em"), cks), h("div", null, aplicar));
  el.append(ativar, h("div", { class: "cols2 un-cols" }, mapa, precos));
  return el;
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
// Holofote: um brilho bem suave que passa sozinho, em pontos aleatórios, pela barra lateral e pela barra superior (CSS: --hx/--hy/--ha).
// As variáveis são "@property": o navegador interpola o movimento (uns 9 s entre um ponto e outro). Quem prefere menos movimento não vê.
let _holo = 0;
function holofote() {
  if (_holo || matchMedia("(prefers-reduced-motion: reduce)").matches) return; _holo = 1;
  const r = document.documentElement, rnd = (a, b) => a + Math.random() * (b - a);
  const passo = () => {
    if (document.hidden) return;
    const sb = document.querySelector(".side")?.getBoundingClientRect(), tp = document.querySelector(".topo")?.getBoundingClientRect();
    const lateral = !!sb && sb.right > 80 && Math.random() < 0.5, w = innerWidth, h = innerHeight;
    const x = lateral ? rnd(sb.left + 30, sb.right - 30) : rnd(w * 0.05, w * 0.95), y = lateral ? rnd(h * 0.05, h * 0.95) : rnd(10, Math.max(30, (tp ? tp.height : 80) - 10));
    r.style.setProperty("--hx", Math.round(x) + "px"); r.style.setProperty("--hy", Math.round(y) + "px"); r.style.setProperty("--ha", rnd(0.6, 1).toFixed(2));
  };
  passo(); setInterval(passo, 9000);
}
function iniciar() { holofote(); try { document.body.classList.toggle("sb-mini", localStorage.getItem("lc_sbmini") === "1"); } catch { /* sem storage */ } if (!location.hash) location.replace("#/"); S.nv = S.no = null; rotear(); checar(); clearInterval(_poll); _poll = setInterval(checar, 12000); }
window.addEventListener("hashchange", rotear);
entrada();

// ───────── caixas de seleção: troca o menu nativo do navegador por uma lista no padrão da busca do topo ─────────
// O <select> continua no formulário (valor, change, required); só fica escondido. Vale para todo <select> que aparecer.
(function selecoes() {
  let aberta = null;
  const fechar = (foco) => { if (!aberta) return; const a = aberta; aberta = null; a.lista.hidden = true; a.btn.after(a.lista); a.btn.setAttribute("aria-expanded", "false"); if (foco) a.btn.focus(); };
  const texto = (sel) => { const o = sel.options[sel.selectedIndex]; return o ? o.textContent : ""; };
  // a lista é fixa na tela: acompanha o botão quando a página rola ou muda de tamanho
  function posicionar() {
    if (!aberta) return; const { btn, lista, n } = aberta, r = btn.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) { fechar(); return; }
    const alto = Math.min(320, n * 46 + 16), embaixo = window.innerHeight - r.bottom - 12, larg = Math.max(r.width, 200);
    lista.style.left = Math.max(8, Math.min(r.left, window.innerWidth - larg - 8)) + "px";
    lista.style.minWidth = larg + "px"; lista.style.maxWidth = (window.innerWidth - 16) + "px";
    if (embaixo < alto && r.top > embaixo) { lista.style.top = ""; lista.style.bottom = (window.innerHeight - r.top + 6) + "px"; } else { lista.style.bottom = ""; lista.style.top = (r.bottom + 6) + "px"; }
  }
  function abrir(sel, btn, lista) {
    if (aberta && aberta.btn === btn) { fechar(); return; }
    fechar();
    lista.replaceChildren(...[...sel.options].map((o, i) => h("button", { type: "button", class: "sel-it" + (i === sel.selectedIndex ? " on" : ""), role: "option", "aria-selected": String(i === sel.selectedIndex), disabled: o.disabled, tabindex: "-1",
      onclick: () => { if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true })); } btn.firstChild.textContent = texto(sel); fechar(true); } },
      h("span", { class: "sel-tx" }, o.textContent), i === sel.selectedIndex ? ic("check") : null)));
    // fora do conteúdo (nenhum ancestral com transform/filtro muda a posição fixa), MAS dentro do <dialog> quando o seletor está num:
    // um diálogo modal fica na "camada superior" do navegador (acima de qualquer z-index) e deixa o resto da página inerte.
    (btn.closest("dialog") || document.body).append(lista);
    aberta = { btn, lista, n: sel.options.length }; posicionar();
    lista.hidden = false; btn.setAttribute("aria-expanded", "true");
    (lista.querySelector(".sel-it.on") || lista.querySelector(".sel-it:not([disabled])"))?.focus({ preventScroll: true });
  }
  function melhorar(sel) {
    if (sel.dataset.sel || sel.multiple || sel.size > 1) return;
    sel.dataset.sel = "1";
    const btn = h("button", { type: "button", class: "sel-btn", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-label": sel.getAttribute("aria-label") || null }, h("span", { class: "sel-tx" }, texto(sel)), ic("chev"));
    const lista = h("div", { class: "sel-lista", role: "listbox", hidden: true });
    const caixa = h("div", { class: "sel" + (sel.className ? " " + sel.className : "") });
    sel.replaceWith(caixa); caixa.append(sel, btn, lista);
    sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true"); sel.classList.add("sel-nativo");
    if (sel.disabled) btn.disabled = true;
    const sync = () => { btn.firstChild.textContent = texto(sel); btn.disabled = sel.disabled; };
    sel.addEventListener("change", sync); new MutationObserver(sync).observe(sel, { childList: true, subtree: true, attributes: true });
    btn.addEventListener("click", () => abrir(sel, btn, lista));
    btn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); abrir(sel, btn, lista); } });
    lista.addEventListener("keydown", (e) => {
      const its = [...lista.querySelectorAll(".sel-it:not([disabled])")], i = its.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); its[Math.min(its.length - 1, i + 1)]?.focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); its[Math.max(0, i - 1)]?.focus(); }
      else if (e.key === "Home") { e.preventDefault(); its[0]?.focus(); }
      else if (e.key === "End") { e.preventDefault(); its[its.length - 1]?.focus(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(true); }
      else if (e.key === "Tab") fechar();
    });
    // label em volta: clicar no texto do rótulo abre a lista (em vez de focar o select escondido)
    const lbl = caixa.closest("label"); if (lbl && !lbl.dataset.sel) { lbl.dataset.sel = "1"; lbl.addEventListener("click", (e) => { if (!e.target.closest(".sel")) { e.preventDefault(); btn.focus(); } }); }
  }
  const varrer = (raiz) => { if (raiz.nodeType !== 1) return; if (raiz.tagName === "SELECT") melhorar(raiz); else raiz.querySelectorAll("select").forEach(melhorar); };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(varrer))).observe(document.documentElement, { childList: true, subtree: true });
  varrer(document.body);
  document.addEventListener("click", (e) => { if (aberta && !e.composedPath().some((n) => n === aberta.lista || n === aberta.btn)) fechar(); });
  window.addEventListener("resize", posicionar);
  document.addEventListener("scroll", (e) => { if (aberta && !aberta.lista.contains(e.target)) posicionar(); }, true);
})();
