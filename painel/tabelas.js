/* Link Corretor — regra geral das tabelas do painel (aplica sozinha em toda `table.t`, inclusive as criadas depois):
   1) clicar no título ordena A→Z, de novo Z→A, de novo volta à ordem original (números e datas ordenam como números e datas);
   2) arrastar a alça ⋮⋮ de uma linha, ou o título de uma coluna, reordena à mão;
   3) a escolha fica guardada neste navegador, por tela e por tabela.
   Colunas sem título (ações) não ordenam. Tabelas cujo 1º título é nome (Cliente, Corretor, Empreendimento, Link…) já abrem em A→Z. */
(() => {
  "use strict";
  const NOME_PADRAO = /^(cliente|corretor|empreendimento|nome|link|pessoa)/i;
  const col = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
  const guardar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } };
  const ler = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
  const txt = (td) => (td?.dataset.sort ?? td?.textContent ?? "").trim();
  const numero = (s) => { const m = s.replace(/\s/g, "").match(/^(?:R\$)?([+-]?\d{1,3}(?:\.\d{3})*(?:,\d+)?|[+-]?\d+(?:,\d+)?)(%|m²|min|s|h)?$/); return m ? parseFloat(m[1].replace(/\./g, "").replace(",", ".")) : null; };
  const data = (s) => { const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:[ ,]+(?:às\s+)?(\d{1,2}):(\d{2}))?/); return m ? new Date(+(m[3] || new Date().getFullYear()) + (m[3] && m[3].length === 2 ? 2000 : 0), +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)).getTime() : null; };
  const cmp = (a, b) => { const da = data(a), db = data(b); if (da != null && db != null) return da - db; const na = numero(a), nb = numero(b); if (na != null && nb != null) return na - nb; return col.compare(a, b); };
  const chaveLinha = (tr) => txt(tr.cells[0]) + "|" + txt(tr.cells[1] || tr.cells[0]);

  function melhorar(t, idx) {
    if (t.dataset.lcTab) return; t.dataset.lcTab = "1";
    const cab = t.tHead?.rows[0], corpo = t.tBodies[0]; if (!cab || !corpo) return;
    const rota = (location.hash.replace(/^#\/?/, "").split("/")[0] || "resumo"), chave = `lc_tab_${rota}_${idx}`;
    const original = [...corpo.rows]; if (original.length < 2 && !cab.cells.length) return;
    const ths = () => [...cab.cells];
    let estado = ler(chave) || {};
    const pintar = () => ths().forEach((th, i) => { const s = estado.sort && estado.sort.col === th.dataset.nome ? estado.sort.dir : null; if (th.dataset.ord) th.setAttribute("aria-sort", s === "asc" ? "ascending" : s === "desc" ? "descending" : "none"); });
    const linhasValidas = () => [...corpo.rows].filter((r) => r.cells.length === cab.cells.length);

    function ordenarPor(nome, dir) {
      const i = ths().findIndex((th) => th.dataset.nome === nome); if (i < 0) return;
      const linhas = linhasValidas(); if (linhas.length < 2) return;
      linhas.sort((a, b) => (dir === "desc" ? -1 : 1) * cmp(txt(a.cells[i]), txt(b.cells[i])));
      linhas.forEach((r) => corpo.append(r));
    }
    function restaurar() { original.filter((r) => r.isConnected).forEach((r) => corpo.append(r)); }

    // títulos clicáveis (A→Z / Z→A / original) e arrastáveis (reordenar colunas)
    ths().forEach((th) => {
      const nome = th.textContent.trim(); th.dataset.nome = nome;
      if (!nome) return;
      th.dataset.ord = "1"; th.tabIndex = 0; th.classList.add("ord"); th.setAttribute("role", "columnheader"); th.draggable = true;
      th.title = "Clique para ordenar (A→Z, Z→A). Arraste para mudar a coluna de lugar.";
      const alternar = () => {
        const atual = estado.sort && estado.sort.col === nome ? estado.sort.dir : null;
        const prox = atual === null ? "asc" : atual === "asc" ? "desc" : null;
        estado = { ...estado, sort: prox ? { col: nome, dir: prox } : null, ordem: null };
        restaurar(); if (prox) ordenarPor(nome, prox); pintar(); guardar(chave, estado);
      };
      th.addEventListener("click", alternar);
      th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); } });
      th.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/lc-col", String(ths().indexOf(th))); e.dataTransfer.effectAllowed = "move"; th.classList.add("arrastando"); });
      th.addEventListener("dragend", () => { th.classList.remove("arrastando"); ths().forEach((x) => x.classList.remove("alvo")); });
      th.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("text/lc-col")) { e.preventDefault(); th.classList.add("alvo"); } });
      th.addEventListener("dragleave", () => th.classList.remove("alvo"));
      th.addEventListener("drop", (e) => {
        const de = +e.dataTransfer.getData("text/lc-col"), para = ths().indexOf(th); th.classList.remove("alvo"); if (!(de >= 0) || de === para) return;
        e.preventDefault(); moverColuna(de, para); estado = { ...estado, cols: ths().map((x) => x.dataset.nome) }; guardar(chave, estado);
      });
    });
    function moverColuna(de, para) {
      [cab, ...[...corpo.rows].filter((r) => r.cells.length === cab.cells.length), ...[...(t.tFoot?.rows || [])].filter((r) => r.cells.length === cab.cells.length)].forEach((tr) => {
        const c = tr.cells[de], ref = tr.cells[para]; if (!c || !ref) return; de < para ? ref.after(c) : ref.before(c);
      });
    }

    // alça de linha (reordenar à mão)
    const colunaNomeVazia = () => original.length >= 2;
    if (colunaNomeVazia()) original.forEach((tr) => {
      const td = tr.cells[0]; if (!td || td.querySelector(".grip")) return;
      const g = document.createElement("span"); g.className = "grip"; g.draggable = true; g.setAttribute("role", "img"); g.setAttribute("aria-label", "Arraste para reordenar a linha"); g.title = "Arraste para reordenar"; g.textContent = "⋮⋮";
      g.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/lc-row", "1"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setDragImage(tr, 10, 10); tr.classList.add("arrastando"); t._arr = tr; });
      g.addEventListener("dragend", () => { tr.classList.remove("arrastando"); [...corpo.rows].forEach((r) => r.classList.remove("alvo-cima", "alvo-baixo")); t._arr = null; });
      td.prepend(g);
      tr.addEventListener("dragover", (e) => { if (!t._arr || t._arr === tr) return; e.preventDefault(); const r = tr.getBoundingClientRect(), cima = e.clientY < r.top + r.height / 2; tr.classList.toggle("alvo-cima", cima); tr.classList.toggle("alvo-baixo", !cima); });
      tr.addEventListener("dragleave", () => tr.classList.remove("alvo-cima", "alvo-baixo"));
      tr.addEventListener("drop", (e) => {
        if (!t._arr || t._arr === tr) return; e.preventDefault(); const cima = tr.classList.contains("alvo-cima"); tr.classList.remove("alvo-cima", "alvo-baixo");
        cima ? tr.before(t._arr) : tr.after(t._arr);
        estado = { ...estado, sort: null, ordem: [...corpo.rows].map(chaveLinha) }; pintar(); guardar(chave, estado);
      });
    });

    // restaura o que estava guardado; sem nada guardado, A→Z se o 1º título é um nome
    const primeiro = ths().find((th) => th.dataset.ord);
    if (estado.cols && estado.cols.length === cab.cells.length) estado.cols.forEach((nome, alvo) => { const de = ths().findIndex((x) => x.dataset.nome === nome); if (de >= 0 && de !== alvo) moverColuna(de, alvo); });
    if (estado.ordem && estado.ordem.length) { const mapa = new Map(original.map((r) => [chaveLinha(r), r])); estado.ordem.forEach((k) => mapa.has(k) && corpo.append(mapa.get(k))); }
    else if (estado.sort) ordenarPor(estado.sort.col, estado.sort.dir);
    else if (primeiro && NOME_PADRAO.test(primeiro.dataset.nome) && ths().indexOf(primeiro) === 0) { estado = { ...estado, sort: { col: primeiro.dataset.nome, dir: "asc" } }; ordenarPor(primeiro.dataset.nome, "asc"); }
    pintar();
  }

  let agendado = false;
  const varrer = () => { agendado = false; document.querySelectorAll("table.t:not([data-lc-tab])").forEach((t, i) => melhorar(t, [...document.querySelectorAll("table.t")].indexOf(t))); };
  new MutationObserver(() => { if (!agendado) { agendado = true; requestAnimationFrame(varrer); } }).observe(document.documentElement, { childList: true, subtree: true });
  varrer();
})();
