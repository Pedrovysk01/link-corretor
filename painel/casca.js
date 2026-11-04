/* Link Corretor — casca padrão das apresentações (ver casca.css). Injetado pelo link-server em /p/<código>/ e /pre/<id>/.
   A apresentação declara, antes deste script, o que cada botão faz:

     window.LC_CASCA = {
       empresa: "Taipa Inc", cidade: "Praia do Toque", titulo: "Bossa <i>Eco Luxury</i> Villas",   // título aceita <i> para o trecho em latão
       esconder: ["#brand", ".topbar"],                       // peças próprias que a casca substitui
       acoes: {                                               // cada chave: função, seletor a clicar, ou ausente (= "em breve")
         v3d: () => …, vcima: () => …,                        // seletor Visão 3D / Visão de Cima (o ativo acompanha `visao`)
         geral: () => …, experiencias: () => …, materiais: () => …, apresentacao: () => …, ajustes: () => …,
         unidades: () => …  ou  unidades: [{rotulo:"Apto 01", sub:"Apartamento", acao: () => …, ativo: true}]  // lista = painel suspenso
                            ou  unidades: { lista: () => [...] }                                             // lista montada na hora do clique
       },
       visao: () => "3d" | "2d",                             // opcional: qual visão está ativa agora (padrão: a última clicada)
       contato: { rotulo: "Fale conosco", acao: () => … }     // opcional: botão extra à direita
     }

   Se a página já tem o cabeçalho nativo (Bossa: header.bar .brand), a casca não faz nada. Chaves desligadas no painel
   (recursos.js, data-recurso) continuam valendo: os botões levam data-recurso="unidades" etc. */
(() => {
  "use strict";
  if (window.__lcCasca) return;
  window.__lcCasca = true;
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/painel/casca.css?v=3"; document.head.append(css);
  // Perfil: Corretor · Cliente · Construtora, logo abaixo de "Visão 3D". Aciona o embed (embed.js, window.LC_EMBED) quando ele existe;
  // na prévia do dono (/pre/) só "Construtora" tem efeito (abre o painel). O ativo acompanha o perfil escolhido.
  const papelSeg = () => {
    const seg = document.createElement("div"); seg.className = "lc-seg lc-papel"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Quem está vendo");
    const bs = [["corretor", "Corretor"], ["cliente", "Cliente"], ["construtora", "Construtora"]].map(([k, t]) => { const b = document.createElement("button"); b.type = "button"; b.className = "lc-chip"; b.dataset.papel = k; b.textContent = t; b.setAttribute("aria-pressed", "false");
      b.onclick = () => { if (window.LC_EMBED) window.LC_EMBED.escolher(k); else if (k === "construtora") location.href = "/painel/"; pintar(); }; seg.append(b); return b; });
    const pintar = () => { const p = window.LC_EMBED ? window.LC_EMBED.papel() : null; bs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.papel === p))); };
    pintar(); setInterval(pintar, 800); return seg;
  };
  const nativo = document.querySelector("header.bar .brand");
  if (nativo) { const vs = document.querySelector("header.bar .view-seg"); (vs ? vs.parentNode : nativo.parentNode).insertBefore(papelSeg(), vs ? vs.nextSibling : null); return; }  // Bossa: cabeçalho próprio, só ganha o seletor de perfil
  const cfg = window.LC_CASCA; if (!cfg) return;
  const ICON = {
    materiais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/></svg>',
    apresentacao: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/></svg>',
    contato: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'
  };
  const el = (tag, attrs, html) => { const e = document.createElement(tag); for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; };
  const run = (a) => { if (typeof a === "function") return a(); if (typeof a === "string") { const b = document.querySelector(a); if (b) b.click(); } };
  const acoes = cfg.acoes || {};
  document.documentElement.classList.add("lc-casca-on");
  if (cfg.esconder && cfg.esconder.length) { const st = el("style", null, cfg.esconder.map((s) => `${s}{display:none!important}`).join("")); document.head.append(st); }

  // cartão da marca
  const brand = el("div", { class: "lc-brand" });
  brand.append(el("div", { class: "lc-greet" }, "<i>Boas-vindas</i>"));
  if (cfg.empresa || cfg.cidade) brand.append(el("div", { class: "lc-eyebrow" }, [cfg.empresa, cfg.cidade].filter(Boolean).map(esc).join(" · ")));
  brand.append(el("h1", null, cfg.titulo || esc(document.title)));
  // seletor de visão
  const seg = el("div", { class: "lc-seg", role: "group", "aria-label": "Tipo de visão" });
  const segBtn = (k, t) => { const b = el("button", { class: "lc-chip", type: "button", "aria-pressed": "false" }, t); if (!acoes[k]) { b.disabled = true; b.title = "Em breve nesta apresentação"; } b.onclick = () => { run(acoes[k]); pintarVisao(k); }; seg.append(b); return b; };
  const b3d = segBtn("v3d", "Visão 3D"), b2d = segBtn("vcima", "Visão de Cima");
  let visao = acoes.v3d ? "v3d" : "vcima";
  const pintarVisao = (k) => { if (k) visao = k; const v = typeof cfg.visao === "function" ? ({ "3d": "v3d", "2d": "vcima" }[cfg.visao()] || visao) : visao; b3d.setAttribute("aria-pressed", String(v === "v3d")); b2d.setAttribute("aria-pressed", String(v === "vcima")); };
  pintarVisao();
  // menu
  const nav = el("nav", { class: "lc-nav", "aria-label": "Menu principal" });
  const painel = el("div", { class: "lc-panel", role: "group", "aria-label": "Unidades", hidden: "" });
  const chip = (k, rotulo, { icon, recurso, pressed } = {}) => {
    const b = el("button", { class: "lc-chip", type: "button", "data-recurso": recurso }, (icon ? ICON[icon] + " " : "") + rotulo);
    const a = acoes[k];
    if (!a) { b.disabled = true; b.title = "Em breve nesta apresentação"; b.append(el("span", { class: "lc-soon" }, "em breve")); }
    else if (Array.isArray(a) || (typeof a === "object" && typeof a.lista === "function")) { b.setAttribute("aria-haspopup", "true"); b.setAttribute("aria-expanded", "false"); b.onclick = () => togglePainel(b, Array.isArray(a) ? a : a.lista()); }
    else { if (pressed) b.setAttribute("aria-pressed", "false"); b.onclick = () => { run(a); if (pressed) { nav.querySelectorAll("[aria-pressed]").forEach((x) => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); } fecharPainel(); }; }
    nav.append(b); return b;
  };
  const togglePainel = (b, lista) => {
    const aberto = b.getAttribute("aria-expanded") === "true"; fecharPainel(); if (aberto) return;
    painel.replaceChildren(...lista.map((u) => { const x = el("button", { type: "button", "aria-pressed": String(!!(typeof u.ativo === "function" ? u.ativo() : u.ativo)) }); if (u.sub) x.append(el("small", null, esc(u.sub))); x.append(document.createTextNode(u.rotulo)); x.onclick = () => { run(u.acao); fecharPainel(); }; return x; }));
    painel.hidden = false; b.setAttribute("aria-expanded", "true");
  };
  const fecharPainel = () => { painel.hidden = true; nav.querySelectorAll("[aria-expanded]").forEach((x) => x.setAttribute("aria-expanded", "false")); };
  chip("geral", "Visão geral", { pressed: true }).setAttribute("aria-pressed", "true");
  chip("unidades", "Unidades", { recurso: "unidades" });
  chip("experiencias", "Experiências");
  chip("materiais", "Materiais", { icon: "materiais" });
  chip("apresentacao", "Apresentação", { icon: "apresentacao" });
  if (cfg.contato) { const b = el("button", { class: "lc-chip", type: "button", "aria-label": cfg.contato.rotulo }, ICON.contato + " " + esc(cfg.contato.rotulo)); b.onclick = () => run(cfg.contato.acao); nav.append(b); }
  const aj = chip("ajustes", "", { icon: "ajustes" });  // mesma lógica dos outros: função, seletor ou lista (painel suspenso)
  aj.classList.add("lc-ic"); aj.setAttribute("aria-label", "Ajustes da cena"); aj.title = acoes.ajustes ? "Ajustes da cena" : "Ajustes · em breve";
  const soon = aj.querySelector(".lc-soon"); if (soon) soon.remove();

  const casca = el("header", { class: "lc-casca", "aria-label": "Cabeçalho da apresentação" });
  const l = el("div", { class: "lc-l" }); l.append(brand, seg, papelSeg());
  const r = el("div", { class: "lc-r" }); r.append(nav);
  casca.append(l, r);
  document.body.append(casca, painel);
  document.addEventListener("click", (e) => { if (!painel.hidden && !painel.contains(e.target) && !nav.contains(e.target)) fecharPainel(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharPainel(); });
  // saudação com o nome do cliente, quando o embed souber quem é (embed.js dispara lc:cliente)
  document.addEventListener("lc:cliente", (e) => { const n = e.detail && e.detail.nome; if (n) brand.querySelector(".lc-greet").innerHTML = `<span>Boas-vindas,</span> <i>${esc(String(n).split(" ")[0])}</i>`; });
  if (typeof cfg.visao === "function") setInterval(pintarVisao, 800);
  window.LC_CASCA_API = { pintarVisao, fecharPainel };
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
})();
