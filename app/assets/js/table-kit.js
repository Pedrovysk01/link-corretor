/* Tabelas (table.t) — vale para TODAS, no painel do lojista e no painel da plataforma, inclusive as desenhadas depois:
   · ordenar: clique no título (A→Z, de novo Z→A); entende números, R$, notas e datas dd/mm/aaaa. Colunas sem título
     (seleção, ações) e títulos que já têm o próprio botão de ordenar (ex.: Clientes, que ordena a lista inteira) ficam como estão.
   · mover: arraste o título para outro lugar (mouse ou dedo).
   · largura: puxe a borda direita do título (duplo clique na borda volta ao automático).
   · tudo fica lembrado por tabela neste navegador (localStorage, chave cf.tk.<tela>|<títulos>); se não der para gravar, só não lembra.
   · clique na linha: abre o que a linha aponta — tr[data-href], [data-row-open] (botão que a linha "aperta") ou o link interno
     da linha (#/…, ex.: "Abrir"). Cliques em botões, links, campos e seleção de texto continuam funcionando normalmente.
   Marcações opcionais: table[data-tk="nome"] (chave fixa), table[data-tk-sort="off"], td[data-sort="valor"] (valor para ordenar). */
(function () {
  "use strict";
  if (window.CFTable) return;
  const INTER = "a,button,input,select,textarea,label,summary,[data-act],[contenteditable],[role=button]";
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const routeKey = () => (location.hash || "#/").split("?")[0].replace(/\/[0-9a-f-]{8,}|\/b\d+|\/[0-9]+(?=\/|$)/gi, "/:id");
  const labelOf = (th) => norm(th.textContent);   // a alça de largura (.tk-rz) não tem texto
  const heads = (t) => { const r = t.tHead && t.tHead.rows[0]; return r ? [...r.cells] : []; };
  const labels = (t) => { const seen = {}; return heads(t).map((th) => { let l = labelOf(th); if (seen[l] != null) l += "#" + ++seen[l]; else seen[l] = 0; return l; }); };
  // chave pelos títulos em ordem alfabética: mover colunas não muda a chave (senão a preferência "sumiria" ao recarregar)
  const keyOf = (t) => "cf.tk." + (t.dataset.tk || routeKey() + "|" + labels(t).filter(Boolean).sort().join("|").slice(0, 160));
  const load = (t) => { try { return JSON.parse(localStorage.getItem(keyOf(t)) || "{}") || {}; } catch (e) { return {}; } };
  const save = (t, st) => { try { localStorage.setItem(keyOf(t), JSON.stringify(st)); } catch (e) {} };
  const fixed = (th) => !labelOf(th);                                   // coluna sem título: seleção/ações — não mexe
  const ownSort = (th) => !!th.querySelector("[data-sort], button");    // a tela já ordena (lista completa) por este título

  /* ---------------- valor para ordenar ---------------- */
  function val(td) {
    if (!td) return null;
    const raw = td.dataset.sort != null ? td.dataset.sort : norm(td.textContent);
    if (!raw || /^[—–-]$/.test(raw)) return null;
    let m = raw.match(/^(\d{2})\/(\d{2})\/(\d{2,4})(?:,?\s*(\d{1,2}):(\d{2}))?/);
    if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)).getTime(); }
    m = raw.match(/^[^\p{L}\d-]*(-?\d[\d.]*(?:,\d+)?)/u);
    if (m) { let n = m[1]; n = /,/.test(n) ? n.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(n) ? n.replace(/\./g, "") : n; const f = parseFloat(n); if (!isNaN(f)) return f; }
    return raw.toLocaleLowerCase("pt-BR");
  }
  const cmp = (a, b) => (a == null && b == null ? 0 : a == null ? 1 : b == null ? -1 : typeof a === "number" && typeof b === "number" ? a - b
    : String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" }));

  function sortBy(t, col, dir) {
    const n = heads(t).length, tb = t.tBodies[0]; if (!tb) return;
    const rows = [...tb.rows]; if (rows.some((r) => r.cells.length !== n)) return;   // linhas de detalhe/aviso: não ordena (a tela cuida)
    rows.map((r, i) => [r, val(r.cells[col]), i]).sort((x, y) => (dir === "desc" ? -1 : 1) * cmp(x[1], y[1]) || x[2] - y[2]).forEach(([r]) => tb.appendChild(r));
    heads(t).forEach((th, i) => { if (i === col) { th.setAttribute("aria-sort", dir === "desc" ? "descending" : "ascending"); th.dataset.tkDir = dir; } else if (!ownSort(th)) { th.removeAttribute("aria-sort"); delete th.dataset.tkDir; } });
  }

  /* ---------------- mover coluna ---------------- */
  function moveCol(t, from, to) {
    if (from === to) return; const n = heads(t).length;
    [...t.rows].forEach((r) => { if (r.cells.length !== n) return; const c = r.cells[from], ref = r.cells[to]; r.insertBefore(c, from < to ? ref.nextSibling : ref); });
  }
  function applyOrder(t, order) {
    if (!Array.isArray(order) || !order.length) return;
    order.forEach((lab, i) => { const cur = labels(t).indexOf(lab); if (cur >= 0 && i < heads(t).length && cur !== i && !fixed(heads(t)[i]) && !fixed(heads(t)[cur])) moveCol(t, cur, i); });
  }

  /* ---------------- largura ---------------- */
  function freeze(t) {   // passa para larguras fixas (medidas agora) para dar para estreitar também
    if (t.classList.contains("tk-fixed")) return;
    const ws = heads(t).map((th) => th.offsetWidth);   // px de layout (o painel usa zoom 90% em tela grande: getBoundingClientRect já vem com zoom)
    heads(t).forEach((th, i) => { th.style.width = ws[i] + "px"; });
    t.style.width = ws.reduce((a, b) => a + b, 0) + "px"; t.style.minWidth = "0"; t.classList.add("tk-fixed");
    const wrap = t.closest(".table-wrap"); if (wrap && !t.closest(".table-scroll")) wrap.style.overflowX = "auto";
  }
  const total = (t) => { t.style.width = heads(t).reduce((a, th) => a + (parseFloat(th.style.width) || th.offsetWidth), 0) + "px"; };
  function applyWidths(t, w) {
    if (!w || !Object.keys(w).length) return; const L = labels(t);
    if (!L.some((l) => w[l])) return;
    freeze(t); heads(t).forEach((th, i) => { if (w[L[i]]) th.style.width = Math.max(48, w[L[i]]) + "px"; }); total(t);
  }

  /* ---------------- montar ---------------- */
  function enhance(t) {
    if (t.dataset.tkOn) return; t.dataset.tkOn = "1";
    const st = load(t);
    applyOrder(t, st.order); applyWidths(t, st.w);
    heads(t).forEach((th) => {
      if (fixed(th)) return;
      th.classList.add("tk-th"); if (!ownSort(th) && t.dataset.tkSort !== "off") { th.tabIndex = 0; th.classList.add("tk-sortable"); th.title = th.title || "Ordenar (clique) · mover (arraste) · largura (puxe a borda)"; }
      const rz = document.createElement("span"); rz.className = "tk-rz"; rz.setAttribute("aria-hidden", "true"); th.appendChild(rz);
    });
    if (st.s && t.dataset.tkSort !== "off") { const i = labels(t).indexOf(st.s[0]); if (i >= 0 && !ownSort(heads(t)[i])) sortBy(t, i, st.s[1]); }
    // linhas que abrem algo
    [...(t.tBodies[0] ? t.tBodies[0].rows : [])].forEach((r) => { if (target(r)) r.classList.add("tk-click"); });
  }
  function target(tr) {
    if (tr.dataset.href) return { href: tr.dataset.href };
    const b = tr.querySelector("[data-row-open]"); if (b) return { el: b };
    if (tr.hasAttribute("data-row-click")) return { custom: true };
    const links = [...tr.querySelectorAll('a[href^="#/"]')]; if (links.length) return { href: links[links.length - 1].getAttribute("href") };
    return null;
  }
  const scan = (root) => { (root.matches && root.matches("table.t") ? [root] : [...(root.querySelectorAll ? root.querySelectorAll("table.t") : [])]).forEach(enhance); };

  /* ---------------- eventos (um só conjunto para a página toda) ---------------- */
  let drag = null, suppress = false;
  document.addEventListener("pointerdown", (e) => {
    const rz = e.target.closest(".tk-rz");
    const th = e.target.closest("table.t th.tk-th"); if (!th || e.button > 0) return;
    const t = th.closest("table.t");
    if (rz) {   // largura
      e.preventDefault(); e.stopPropagation(); freeze(t);
      const x0 = e.clientX, w0 = parseFloat(th.style.width) || th.offsetWidth, k = th.getBoundingClientRect().width / (th.offsetWidth || 1) || 1;   // k: zoom da página
      th.classList.add("tk-resizing"); rz.setPointerCapture && rz.setPointerCapture(e.pointerId);
      const mv = (ev) => { th.style.width = Math.max(48, Math.round(w0 + (ev.clientX - x0) / k)) + "px"; total(t); };
      const up = () => { rz.removeEventListener("pointermove", mv); rz.removeEventListener("pointerup", up); rz.removeEventListener("pointercancel", up); th.classList.remove("tk-resizing"); suppress = true; setTimeout(() => (suppress = false), 0);
        const st = load(t), L = labels(t); st.w = st.w || {}; heads(t).forEach((h, i) => { if (h.style.width && !fixed(h)) st.w[L[i]] = parseFloat(h.style.width); }); save(t, st); };
      rz.addEventListener("pointermove", mv); rz.addEventListener("pointerup", up); rz.addEventListener("pointercancel", up);
      return;
    }
    drag = { th, t, x0: e.clientX, y0: e.clientY, on: false, over: null, id: e.pointerId };
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (!drag.on && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    drag.on = true; drag.th.classList.add("tk-dragging"); document.body.classList.add("tk-no-select");
    const el = document.elementFromPoint(e.clientX, e.clientY), over = el && el.closest("th.tk-th");
    heads(drag.t).forEach((h) => h.classList.remove("tk-over-l", "tk-over-r"));
    drag.over = over && over.closest("table.t") === drag.t && over !== drag.th ? over : null;
    if (drag.over) { const r = drag.over.getBoundingClientRect(); drag.side = e.clientX < r.left + r.width / 2 ? "l" : "r"; drag.over.classList.add("tk-over-" + drag.side); }
  });
  const endDrag = () => {
    if (!drag) return; const d = drag; drag = null;
    document.body.classList.remove("tk-no-select"); d.th.classList.remove("tk-dragging"); heads(d.t).forEach((h) => h.classList.remove("tk-over-l", "tk-over-r"));
    if (!d.on) return;
    suppress = true; setTimeout(() => (suppress = false), 0);
    if (!d.over) return;
    const H = heads(d.t), from = H.indexOf(d.th); let to = H.indexOf(d.over);
    if (d.side === "r" && to < from) to += 1; if (d.side === "l" && to > from) to -= 1;
    if (to < 0 || to >= H.length || fixed(H[to])) return;
    moveCol(d.t, from, to); const st = load(d.t); st.order = labels(d.t); save(d.t, st);
  };
  document.addEventListener("pointerup", endDrag); document.addEventListener("pointercancel", endDrag);
  document.addEventListener("click", (e) => {   // depois de arrastar/puxar a borda, o clique que sobra não ordena nem abre nada
    if (suppress && e.target.closest("table.t th")) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  document.addEventListener("click", (e) => {
    const th = e.target.closest("table.t th.tk-sortable"); if (th && !e.target.closest(".tk-rz")) return sortClick(th);
    const tr = e.target.closest("table.t tbody tr.tk-click"); if (!tr || e.defaultPrevented) return;
    if (e.target.closest(INTER) || String(window.getSelection && window.getSelection()) ) return;
    const tg = target(tr); if (!tg || tg.custom) return;
    if (tg.el) tg.el.click(); else if (tg.href) { if (e.ctrlKey || e.metaKey) window.open(tg.href, "_blank"); else location.hash = tg.href.replace(/^#/, ""); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const th = e.target.closest && e.target.closest("table.t th.tk-sortable"); if (th && e.target === th) { e.preventDefault(); sortClick(th); }
  });
  function sortClick(th) {
    const t = th.closest("table.t"), i = heads(t).indexOf(th), dir = th.dataset.tkDir === "asc" ? "desc" : "asc";
    sortBy(t, i, dir); const st = load(t); st.s = [labels(t)[i], dir]; save(t, st);
  }
  // duplo clique na borda: volta a largura automática desta tabela
  document.addEventListener("dblclick", (e) => {
    const rz = e.target.closest(".tk-rz"); if (!rz) return; const t = rz.closest("table.t");
    heads(t).forEach((h) => (h.style.width = "")); t.style.width = ""; t.style.minWidth = ""; t.classList.remove("tk-fixed");
    const st = load(t); delete st.w; save(t, st);
  });

  let pend = false;
  new MutationObserver((ms) => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; scan(document.body); }); }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => scan(document.body));
  window.CFTable = { enhance, scan, sortBy, moveCol, reset: (t) => { try { localStorage.removeItem(keyOf(t)); } catch (e) {} } };
})();
