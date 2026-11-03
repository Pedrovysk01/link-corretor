/* Conta: Funcionários, Cartões de filiais, Aplicativo móvel, Faturamento e Configurações */
(function () {
  "use strict";
  const CF = window.CF, I = CF.icon, esc = CF.esc;
  const money = CF.money;

  /* ============================== Funcionários ============================== */
  /* ============================== Funcionários (logins da equipe) ==============================
     O dono cria o convite (nome + e-mail): nasce uma linha em staff com um código secreto; o link <painel>/?equipe=<código> vai por
     WhatsApp ou e-mail. Quem abre cria a conta (ou entra) e data.js chama staff_accept: a linha vira "Ativo" e a pessoa passa a
     carimbar e buscar clientes. Revogar corta o acesso na hora (can_manage só aceita status 'active'). */
  const ST_PILL = { "Convite pendente": "warn", "Ativo": "ok", "Revogado": "gray" };
  const hexTok = () => { const a = new Uint8Array(12); if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join(""); };
  const panelBase = () => location.origin + location.pathname.replace(/[^/]*$/, "");   // ex.: https://…/app/
  const inviteUrl = (m) => (m.token ? `${panelBase()}?equipe=${m.token}` : "");
  const inviteText = (m) => `Oi, ${(m.name || "").split(" ")[0]}! Você foi convidado(a) para a equipe de ${CF.state.biz.name} no Seu Cliente Fiel. Abra o link, crie sua conta com o e-mail ${m.email} e já dá para carimbar e buscar clientes: ${inviteUrl(m)}`;
  CF.route("/staff", () => {
    const st = CF.state.staff, locs = CF.locations(), online = !!CF.bizId;
    const row = (m) => { const url = inviteUrl(m), pend = m.status === "Convite pendente";
      return `<tr data-id="${esc(m.id)}"><td><div class="row"><span class="avatar sm">${esc(CF.initial(m.name))}</span><div><b class="strong" style="font-weight:500">${esc(m.name)}</b><div class="small muted">${esc(m.email)}</div></div></div></td>
        <td><span class="pill ${ST_PILL[m.status] || "gray"}">${esc(m.status)}</span></td>
        ${locs.length ? `<td><select class="select sm" data-loc="${esc(m.id)}" aria-label="Filial de ${esc(m.name)}"><option value="">Todas (matriz)</option>${locs.map((l) => `<option value="${esc(l.id)}" ${m.locationId === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></td>` : ""}
        <td style="text-align:right"><div class="row" style="justify-content:flex-end;gap:6px;flex-wrap:wrap">
          ${pend && url ? `<button class="btn sm" data-copy="${esc(m.id)}">${I("copy", "sm")}Copiar link</button><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(inviteText(m))}">${CF.icon("brand:whatsapp", "sm")}WhatsApp</a><a class="btn sm" href="mailto:${esc(m.email)}?subject=${encodeURIComponent("Convite para a equipe de " + CF.state.biz.name)}&body=${encodeURIComponent(inviteText(m))}">${I("mail", "sm")}E-mail</a>` : ""}
          ${m.status === "Revogado" ? `<button class="btn sm" data-reinvite="${esc(m.id)}">${I("refresh", "sm")}Convidar de novo</button>` : `<button class="btn sm danger" data-rm="${esc(m.id)}">${I("x", "sm")}${pend ? "Cancelar convite" : "Revogar acesso"}</button>`}
          <button class="btn sm ghost" data-del="${esc(m.id)}" title="Remover da lista" aria-label="Remover ${esc(m.name)}">${I("trash", "sm")}</button></div></td></tr>`; };
    return {
      title: "Funcionários", sub: "Logins para quem atende no balcão: só carimbam e buscam clientes. Faturamento, campanhas e configurações continuam só com você.", nav: "staff", crumbs: [{ t: "Início", href: "/" }, { t: "Funcionários" }],
      html: `<div class="stack">
        <section class="card"><div class="card-h"><h2>Convidar um funcionário</h2><p>Você cria o convite e manda o link por WhatsApp ou e-mail. A pessoa cria a conta pelo link e entra direto na equipe.</p></div>
          <form class="card-b" id="st-form"><div class="grid g2" style="gap:14px"><div class="field"><label for="st-n">Nome</label><input class="input" id="st-n" required maxlength="60" placeholder="Ex.: Ana"></div><div class="field"><label for="st-e">E-mail que vai usar para entrar</label><input class="input" id="st-e" type="email" required placeholder="ana@exemplo.com"></div>
            ${locs.length ? `<div class="field"><label for="st-l">Filial</label><select class="select" id="st-l"><option value="">Todas (matriz)</option>${locs.map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join("")}</select></div>` : ""}</div>
            <div class="row" style="margin-top:14px;gap:12px;flex-wrap:wrap"><button class="btn primary" id="st-add">${I("user-plus", "sm")}Criar convite</button><span class="small muted">O link vale para uma conta e pode ser cancelado quando quiser.</span></div></form></section>
        ${st.length ? `<section class="card"><div class="card-h"><h2>Equipe</h2><p>Quem já tem login e quem ainda não abriu o convite.</p></div><div class="table-scroll"><table class="t"><thead><tr><th>Nome</th><th>Status</th>${locs.length ? "<th>Filial</th>" : ""}<th></th></tr></thead><tbody>${st.map(row).join("")}</tbody></table></div></section>` : ""}
        <section class="card"><div class="card-b"><h3 class="strong" style="font-size:16px;font-weight:600;margin-bottom:10px">O que o funcionário vê</h3>
          <ul class="bullets" style="padding:0">${[["qr", "Carimbar pela câmera ou pelo código do cartão, no celular ou no tablet do balcão"], ["users", "Clientes: buscar, dar carimbo, resgatar e aprovar pedidos de carimbo"], ["eye", "O histórico de cada cliente mostra quem deu o carimbo"], ["key", "Não vê faturamento, campanhas, página, cartões nem configurações"]].map(([ic, t]) => `<li><span class="ico-tile brand">${I(ic)}</span>${t}</li>`).join("")}</ul>
          ${online ? "" : `<p class="hint" style="margin-top:12px">Em demonstração o convite não é enviado: os logins da equipe funcionam com o painel conectado ao servidor.</p>`}</div></section></div>`,
      mount(view) {
        const g = (q) => view.querySelector(q);
        g("#st-form").addEventListener("submit", (e) => { e.preventDefault(); const name = g("#st-n").value.trim(), email = g("#st-e").value.trim().toLowerCase(), loc = g("#st-l") ? g("#st-l").value : "";
          if (!name || !email) return; if (CF.state.staff.some((m) => m.email.toLowerCase() === email && m.status !== "Revogado")) return CF.toast("Esse e-mail já está na equipe.", "err");
          CF.update((s) => s.staff.push({ id: CF.uid(), name, email, status: "Convite pendente", token: hexTok(), locationId: loc || null, date: new Date().toISOString() })); CF.toast(`Convite criado. Mande o link para ${name}.`); CF.refresh(); });
        view.addEventListener("click", async (e) => {
          const cp = e.target.closest("[data-copy]"), rm = e.target.closest("[data-rm]"), ri = e.target.closest("[data-reinvite]"), del = e.target.closest("[data-del]");
          if (cp) { const m = CF.state.staff.find((x) => x.id === cp.dataset.copy); const ok = m && (await CF.copy(inviteUrl(m))); CF.toast(ok ? `Link copiado. Mande para ${m.name}.` : "Não foi possível copiar.", ok ? "ok" : "err"); }
          if (rm) { CF.update((s) => { const m = s.staff.find((x) => x.id === rm.dataset.rm); if (m) m.status = "Revogado"; }); CF.toast("Acesso revogado."); CF.refresh(); }
          if (ri) { CF.update((s) => { const m = s.staff.find((x) => x.id === ri.dataset.reinvite); if (m) { m.status = "Convite pendente"; m.token = hexTok(); } }); CF.toast("Novo convite criado."); CF.refresh(); }
          if (del) { const m = CF.state.staff.find((x) => x.id === del.dataset.del); if (!m) return; CF.confirm({ title: `Remover ${m.name}?`, text: "A pessoa perde o acesso e sai da lista. O histórico de carimbos continua.", ok: "Remover", danger: true, onOk() { CF.update((s) => (s.staff = s.staff.filter((x) => x.id !== m.id))); CF.toast("Removido."); CF.refresh(); } }); }
        });
        view.addEventListener("change", (e) => { const sel = e.target.closest("[data-loc]"); if (!sel) return; CF.update((s) => { const m = s.staff.find((x) => x.id === sel.dataset.loc); if (m) m.locationId = sel.value || null; }); CF.toast("Filial atualizada."); });
      },
    };
  });

  /* ============================== Filiais (rota /locations) ==============================
     Um cartão para todas as unidades. A matriz é o próprio negócio (carimbo sem filial). Os números por filial vêm de
     location_stats (servidor) ou, em demonstração, do histórico dos clientes (cada carimbo guarda a filial em "loc"). */
  const locStats = () => {
    const srv = CF.state.locStats; if (Array.isArray(srv)) return srv.map((r) => ({ id: r.location_id || "", stamps: +r.stamps || 0, stamps30: +r.stamps_30d || 0, customers: +r.customers || 0, redeems: +r.redeems || 0, last: r.last_at || null }));
    const by = {};
    CF.state.customers.forEach((c) => (c.history || []).forEach((e) => { const k = e.loc || "", r = (by[k] = by[k] || { id: k, stamps: 0, stamps30: 0, customers: 0, redeems: 0, last: null, cs: new Set() });
      if (e.kind === "stamp") { r.stamps += e.qty || 1; if (Date.now() - new Date(e.at) < 30 * 864e5) r.stamps30 += e.qty || 1; r.cs.add(c.id); if (!r.last || e.at > r.last) r.last = e.at; }
      if (e.kind === "undo") r.stamps -= e.qty || 1; if (e.kind === "redeem") r.redeems++; }));
    return Object.values(by).map((r) => Object.assign(r, { customers: r.cs.size }));
  };
  const statOf = (id) => locStats().find((r) => r.id === (id || "")) || { stamps: 0, stamps30: 0, customers: 0, redeems: 0, last: null };
  const fmtDay = (d) => (d ? new Date(d).toLocaleDateString(CF.locale(), { day: "2-digit", month: "short" }) : "—");
  const staffOf = (id) => CF.state.staff.filter((m) => m.status !== "Revogado" && (m.locationId || "") === (id || ""));
  // janela para criar/editar uma filial (busca no Google Maps preenche nome e endereço)
  const locModal = (l) => {
    const ov = CF.modal({ title: l ? "Editar filial" : "Nova filial", body: `<div class="stack-sm" style="gap:14px">
        <div class="field"><label for="lc-n">Nome da filial</label><input class="input" id="lc-n" maxlength="60" value="${esc(l ? l.name : "")}" placeholder="Ex.: Centro, Shopping, Praia…" autofocus></div>
        <div class="field"><label for="lc-a">Endereço</label><input class="input" id="lc-a" maxlength="160" value="${esc(l ? l.address : "")}" placeholder="Rua, número · bairro"></div>
        <div class="field"><label for="lc-p">WhatsApp ou telefone da filial <span class="muted">(opcional)</span></label><input class="input" id="lc-p" type="tel" maxlength="30" value="${esc(l ? l.phone || "" : "")}" placeholder="(48) 99999-0000"></div>
        ${CF.placeDrawer ? `<button type="button" class="btn sm" id="lc-maps">${I("search", "sm")}Buscar no Google Maps</button>` : ""}</div>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="lc-ok">${l ? "Salvar" : "Adicionar"}</button>` });
    const q = (x) => ov.querySelector(x);
    if (q("#lc-maps")) q("#lc-maps").addEventListener("click", () => CF.placeDrawer({ title: "Filial no Google Maps", sub: "Escolha a ficha desta unidade.", label: "Encontre a filial", onPick: (p) => { if (!q("#lc-n").value) q("#lc-n").value = p.name || ""; q("#lc-a").value = p.address || p.name || ""; } }));
    q("#lc-ok").addEventListener("click", () => { const name = q("#lc-n").value.trim(); if (!name) { q("#lc-n").focus(); return; }
      const address = q("#lc-a").value.trim(), phone = q("#lc-p").value.trim();
      CF.update((s) => { s.locations = s.locations || []; if (l) { const x = s.locations.find((y) => y.id === l.id); if (x) Object.assign(x, { name, address, phone }); } else s.locations.push({ id: CF.uid(), name, address, phone, active: true, created: new Date().toISOString() }); });
      ov.close(); CF.toast(l ? "Filial atualizada." : `Filial ${name} adicionada.`); CF.refresh(); });
  };
  Object.assign(CF.actions, { "loc-add"() { locModal(null); } });
  CF.route("/locations", () => {
    const s = CF.state, nm = s.biz.name, locs = s.locations || [], act = locs.filter((l) => l.active !== false), off = locs.filter((l) => l.active === false), all = locStats(), max = Math.max(1, ...all.map((r) => r.stamps));
    const meter = (n) => `<div class="meter" aria-hidden="true"><i style="width:${Math.round((n / max) * 100)}%"></i></div>`;
    const rowHtml = (l, st, main) => `<a class="loc-row" href="#/locations/${esc(l.id || "matriz")}" style="text-decoration:none;color:inherit">${I("pin", "pin")}<div style="flex:1;min-width:0"><div class="ttl">${esc(l.name)} ${main ? `<span class="pill gray" style="margin-left:6px">Matriz</span>` : l.active === false ? `<span class="pill gray" style="margin-left:6px">Desativada</span>` : ""}</div><div class="small muted">${esc(l.address || "Sem endereço")}${staffOf(l.id).length ? ` · ${CF.plural(staffOf(l.id).length, "funcionário", "funcionários")}` : ""}</div>${meter(st.stamps)}</div><div class="loc-nums"><b>${st.customers}</b><small>clientes</small><b>${st.stamps}</b><small>carimbos</small></div>${I("chevron-right", "sm")}</a>`;
    return {
      title: "Cartões de filiais", sub: "Um cartão que funciona em todas as suas unidades, com os números separados por filial.", nav: "locations", crumbs: [{ t: "Início", href: "/" }, { t: "Cartões de filiais" }],
      actions: `<button class="btn primary" data-act="loc-add">${I("plus", "sm")}Adicionar filial</button>`,
      html: `<div class="stack">
        ${locs.length ? "" : `<section class="card"><div class="card-b"><div class="row wrap" style="gap:20px;align-items:center"><div style="flex:1;min-width:240px"><h2 class="strong" style="font-size:18px;font-weight:600">Seu negócio tem mais de um endereço?</h2><p class="muted" style="margin-top:6px">Adicione cada filial. O cartão continua o mesmo para o cliente; você passa a ver carimbos, clientes e resgates por unidade, atribui funcionários a cada uma e usa a ficha do Google certa de cada filial.</p><p class="small muted" style="margin-top:8px">Cada aparelho escolhe em qual filial está carimbando (em Clientes e em Carimbar). Funcionário com filial atribuída carimba sempre nela.</p></div><button class="btn primary lg" data-act="loc-add">${I("plus", "sm")}Adicionar a primeira filial</button></div></div></section>`}
        <section class="card"><div class="card-h row between wrap" style="gap:10px"><div><h2>Suas unidades</h2><p>Toque numa filial para ver os números, a equipe e a ficha do Google dela.</p></div>${CF.locPicker()}</div>
          ${rowHtml({ id: "", name: nm, address: s.biz.address, active: true }, statOf(""), true)}${act.map((l) => rowHtml(l, statOf(l.id), false)).join("")}${off.map((l) => rowHtml(l, statOf(l.id), false)).join("")}</section>
        ${act.length ? `<section class="card"><div class="card-h"><h2>Comparativo</h2><p>Carimbos e clientes por filial. Um cliente conta em cada filial onde ganhou carimbo.</p></div><div class="table-scroll"><table class="t"><thead><tr><th>Filial</th><th>Carimbos</th><th>Últimos 30 dias</th><th>Clientes</th><th>Resgates</th><th>Último carimbo</th></tr></thead><tbody>
          ${[{ id: "", name: nm + " (matriz)" }].concat(act).map((l) => { const st = statOf(l.id); return `<tr><td class="strong">${esc(l.name)}</td><td>${st.stamps}</td><td>${st.stamps30}</td><td>${st.customers}</td><td>${st.redeems}</td><td>${fmtDay(st.last)}</td></tr>`; }).join("")}</tbody></table></div></section>` : ""}</div>`,
      mount(view) { if (CF.loadLocationStats) CF.loadLocationStats().then((ch) => { if (ch && view.isConnected) CF.refresh(); }); },
    };
  });
  CF.route("/locations/:id", ({ id }) => {
    const s = CF.state, main = id === "matriz", l = main ? { id: "", name: s.biz.name, address: s.biz.address, phone: "", active: true } : (s.locations || []).find((x) => x.id === id);
    if (!l) return { title: "Filial", nav: "locations", back: "/locations", html: `<div class="empty">Filial não encontrada. <a href="#/locations">Voltar</a></div>` };
    const st = statOf(l.id), team = staffOf(l.id), others = s.staff.filter((m) => m.status !== "Revogado" && (m.locationId || "") !== (l.id || "")), here = CF.currentLocation() === (l.id || "");
    const sec = (t, d, body) => `<section class="card"><div class="card-h"><h2>${t}</h2><p>${d}</p></div><div class="card-b">${body}</div></section>`;
    return {
      title: l.name, sub: l.address || "Sem endereço", nav: "locations", back: "/locations", crumbs: [{ t: "Início", href: "/" }, { t: "Cartões de filiais", href: "/locations" }, { t: l.name }],
      actions: main ? `<a class="btn" href="#/page">${I("pencil", "sm")}Editar na Sua vitrine</a>` : `<button class="btn" data-lc="edit">${I("pencil", "sm")}Editar</button><button class="btn" data-lc="toggle">${l.active === false ? I("check", "sm") + "Reativar" : I("x", "sm") + "Desativar"}</button><button class="btn danger" data-lc="del">${I("trash", "sm")}Excluir</button>`,
      html: `<div class="stack">
        ${sec("Como está esta filial", "Carimbos e clientes registrados aqui" + (CF.state.locStats ? "." : (CF.bizId ? ". Carregando do servidor…" : " (demonstração).")), `<div class="kpis"><div class="kpi"><b>${st.customers}</b><span>clientes</span></div><div class="kpi"><b>${st.stamps}</b><span>carimbos</span></div><div class="kpi"><b>${st.stamps30}</b><span>últimos 30 dias</span></div><div class="kpi"><b>${st.redeems}</b><span>resgates</span></div></div><p class="small muted" style="margin-top:10px">Último carimbo: ${fmtDay(st.last)}.</p>`)}
        ${sec("Carimbar nesta filial", "Cada aparelho escolhe em qual filial está carimbando. Funcionário com filial atribuída carimba sempre nela.", here ? `<span class="pill ok">${I("check", "xs")}Este aparelho carimba aqui</span>` : `<button class="btn primary" data-lc="use">${I("pin", "sm")}Usar esta filial neste aparelho</button>`)}
        ${sec("Equipe desta filial", "Quem carimba aqui. Os carimbos deles entram nos números desta filial.", `${team.length ? `<div class="table-scroll"><table class="t"><thead><tr><th>Nome</th><th>Status</th><th></th></tr></thead><tbody>${team.map((m) => `<tr><td><div class="row"><span class="avatar sm">${esc(CF.initial(m.name))}</span>${esc(m.name)}</div></td><td><span class="pill ${ST_PILL[m.status] || "gray"}">${esc(m.status)}</span></td><td style="text-align:right">${main ? "" : `<button class="btn sm ghost" data-unassign="${esc(m.id)}">Tirar da filial</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">${main ? "Ninguém atribuído só à matriz." : "Ninguém atribuído a esta filial ainda."}</p>`}
          ${!main && others.length ? `<div class="row wrap" style="gap:8px;margin-top:12px"><select class="select" id="lc-assign" style="max-width:260px"><option value="">Atribuir um funcionário…</option>${others.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("")}</select></div>` : ""}
          <p class="small muted" style="margin-top:10px"><a href="#/staff">Convidar funcionários -&gt;</a></p>`)}
        ${sec("Ficha desta filial no Google Maps", "Os dados do Google desta unidade, com ajuda para deixar a ficha completa.", CF.fichaCard(main ? "main" : "loc:" + l.id, { query: `${s.biz.name} ${l.name} ${l.address || ""}`.trim(), emptyTitle: "Traga a ficha desta filial do Google Maps", emptyText: "Nota, avaliações, horários e fotos desta unidade." }))}</div>`,
      mount(view) {
        if (CF.loadLocationStats) CF.loadLocationStats().then((ch) => { if (ch && view.isConnected) CF.refresh(); });
        view.addEventListener("click", (e) => { const b = e.target.closest("[data-lc]"), un = e.target.closest("[data-unassign]");
          if (un) { CF.update((st2) => { const m = st2.staff.find((x) => x.id === un.dataset.unassign); if (m) m.locationId = null; }); CF.toast("Funcionário tirado da filial."); CF.refresh(); return; }
          if (!b) return; const k = b.dataset.lc;
          if (k === "use") { CF.setLocation(l.id || ""); CF.toast(l.id ? `Este aparelho agora carimba em ${l.name}.` : "Este aparelho agora carimba na matriz."); CF.refresh(); }
          if (k === "edit") locModal(l);
          if (k === "toggle") { CF.update((st2) => { const x = st2.locations.find((y) => y.id === l.id); if (x) x.active = x.active === false; }); CF.toast(l.active === false ? "Filial reativada." : "Filial desativada. Os números ficam guardados."); CF.refresh(); }
          if (k === "del") CF.confirm({ title: `Excluir ${l.name}?`, text: "Os carimbos já dados continuam com os clientes, mas deixam de contar nesta filial. Para só parar de usar, prefira Desativar.", ok: "Excluir", danger: true, onOk() { CF.update((st2) => { st2.locations = st2.locations.filter((y) => y.id !== l.id); st2.staff.forEach((m) => { if (m.locationId === l.id) m.locationId = null; }); }); if (CF.currentLocation() === l.id) CF.setLocation(""); CF.toast("Filial excluída."); CF.go("/locations"); } });
        });
        const asg = view.querySelector("#lc-assign"); asg && asg.addEventListener("change", () => { if (!asg.value) return; CF.update((st2) => { const m = st2.staff.find((x) => x.id === asg.value); if (m) m.locationId = l.id; }); CF.toast("Funcionário atribuído."); CF.refresh(); });
      },
    };
  });

  /* ============================== Aplicativo e telas ============================== */
  // Telas do app do cliente, com os dados reais do negócio (página, cartão, menu, novidades, carteira, notificação)
  const appScreens = () => {
    const s = CF.state, b = s.biz, card = CF.card(), model = (s.preview && s.preview.model) || "iphone-15-pro";
    const fs = (w) => `font-size:${(w / 26).toFixed(2)}px`;
    const dev = (inner, w, dark) => CF.device(inner, { model, width: w, darkStatus: !!dark });
    const home = (w) => CF.phonePage({ tall: true, width: w, model, items: CF.pageBlocks() });
    const cardInner = (w) => `<div class="cardscr" style="--page-bg:${esc(CF.pageBgCss(b))};${fs(w)}">${CF.walletCard({ card, filled: 3, size: w / 26, fluid: true })}<div class="qrb">${CF.qrSvg("token-exemplo", 120)}<small>Mostre no balcão para carimbar</small></div></div>`;
    const cardScr = (w) => dev(cardInner(w), w);
    const walletInner = (w) => `<div class="wallet" style="${fs(w)}"><div class="ttl">Carteira</div>${CF.walletCard({ card, filled: 5, size: w / 26, fluid: true })}<div class="other"></div><div class="other" style="opacity:.6"></div></div>`;
    const catalogScr = (w) => CF.pubPhone("catalog", w);   // mesmo desenho da página do cliente
    const wallet = (w) => dev(walletInner(w), w, true);
    const lockInner = (w) => `<div class="lock" style="${fs(w)}"><div class="clk">9:41</div><div class="dt">quarta-feira, 7 de outubro</div><div class="ntf"><img src="${esc(b.logo)}" alt=""><div><b>${esc(b.name)}<small>agora</small></b><p>${esc((s.campaigns[0] && s.campaigns[0].notification) || "Um brinde em compras acima de R$ 40. Só esta semana.")}</p></div></div><div class="ntf" style="opacity:.75"><img src="${esc(b.logo)}" alt=""><div><b>${esc(b.name)}<small>ontem</small></b><p>🎁 Sua recompensa está disponível!</p></div></div></div>`;
    const lock = (w) => dev(lockInner(w), w, true);
    // conteúdo de cada tela sem a moldura do aparelho: o carrossel de "Aplicativo e telas" põe todas dentro de UM aparelho grande
    const BARE = {
      home: (w) => CF.phonePage({ bare: true, tall: true, width: w, items: CF.pageBlocks() }), card: cardInner, menu: (w) => CF.pubPhone("menu", w, true), catalog: (w) => CF.pubPhone("catalog", w, true),
      news: (w) => CF.pubPhone("news", w, true), wallet: walletInner, lock: lockInner,
    };
    return [
      { k: "home", short: "Home", t: "Home do app", d: "A primeira tela que o cliente vê ao abrir o seu link ou QR: capa, logo, cartão e seus blocos.", r: home, href: "#/page", cta: "Editar a home" },
      { k: "card", short: "Cartão", t: "Cartão e QR", d: "O cartão com os carimbos e o QR que o cliente mostra no balcão.", r: cardScr, href: "#/cards", cta: "Editar o cartão" },
      { k: "menu", short: "Menu", t: "Menu", d: "Cardápio por abas; o cliente monta o pedido e envia pelo WhatsApp.", r: (w) => CF.demoPhone("menu", w), try: "menu", href: "#/page/catalog", cta: "Editar menus" },
      { k: "catalog", short: "Catálogo", t: "Catálogo", d: "Seus produtos com foto, descrição e preço — a vitrine da sua página.", r: catalogScr, href: "#/page/catalog", cta: "Editar catálogos" },
      { k: "news", short: "Novidades", t: "Novidades", d: "Publicações e ofertas, com botão opcional.", r: (w) => CF.demoPhone("news", w), try: "news", href: "#/page/add", cta: "Adicionar novidade" },
      { k: "wallet", short: "Carteira", t: "Na carteira", d: "Como o cartão aparece na carteira do celular (Apple/Google).", r: wallet, href: "#/cards", cta: "Editar o cartão" },
      { k: "lock", short: "Notificação", t: "Notificação", d: "A mensagem da campanha na tela de bloqueio.", r: lock, href: "#/campaigns", cta: "Criar campanha" },
    ].map((x) => Object.assign(x, { bare: BARE[x.k], dark: x.k === "wallet" || x.k === "lock" }));
  };
  /* Painel do app (estilo painel rápido do Samsung One UI): tudo o que está ligado na página do cliente.
     Cada botão mostra o estado e leva à tela onde aquilo se edita. Abaixo, os recursos Premium. */
  const appStatus = () => {
    const s = CF.state, b = s.biz, items = s.pageItems || [], card = CF.card(), cnt = (t) => items.filter((i) => i.type === t).length;
    const bg = (b.pageBg && b.pageBg.type) || "color", camp = (s.campaigns || []).find((k) => k.status === "active"), surv = (s.surveys || []).find((v) => v.status === "active");
    const contact = items.find((i) => i.type === "contact"), wifi = items.find((i) => i.type === "wifi"), icons = items.filter((i) => i.iconOnly).length;
    const plural = (n, a, p) => `${n} ${(window.CF_T || ((x) => x))(n === 1 ? a : p)}`; // palavra traduzida antes de juntar ao número
    return [
      { ic: "image-plus", t: "Capa", on: !!b.cover, st: b.cover ? "Com foto" : "Sem foto", href: "#/page" },
      { ic: "user", t: "Logotipo", on: !!b.logo && b.logo.indexOf("assets/") !== 0, st: b.logo && b.logo.indexOf("assets/") !== 0 ? "Personalizado" : "Padrão", href: "#/settings" },
      { ic: "palette", t: "Fundo", on: bg !== "color", st: { color: "Cor lisa", gradient: "Degradê", image: "Imagem" }[bg], href: "#/page" },
      { ic: "card", t: "Cartão", on: !!(card && card.active), st: card ? `${card.stamps} carimbos` : "Sem cartão", href: card ? "#/cards/" + card.id : "#/cards" },
      { ic: "grid", t: "Linha de ícones", on: icons > 0, st: icons ? plural(icons, "ícone", "ícones") : "Desligada", href: "#/page" },
      { ic: "utensils", t: "Menus", on: cnt("menu") > 0, st: cnt("menu") ? plural(cnt("menu"), "menu", "menus") : "Nenhum", href: "#/page/catalog" },
      { ic: "tag", t: "Catálogos", on: cnt("catalog") > 0, st: cnt("catalog") ? plural(cnt("catalog"), "catálogo", "catálogos") : "Nenhum", href: "#/page/catalog" },
      { ic: "sparkles", t: "Novidades", on: cnt("news") > 0, st: cnt("news") ? plural(cnt("news"), "publicação", "publicações") : "Nenhuma", href: "#/page/add" },
      { ic: "brand:whatsapp", t: "WhatsApp", on: !!(contact && (contact.href || contact.url)), st: contact && (contact.href || contact.url) ? "Conectado" : "Sem número", href: "#/page" },
      { ic: "wifi", t: "Wi-Fi", on: !!(wifi && wifi.body), st: wifi && wifi.body ? "Com senha" : wifi ? "Sem senha" : "Desligado", href: "#/page" },
      { ic: "link", t: "Links", on: cnt("link") + cnt("social") > 0, st: plural(cnt("link") + cnt("social"), "link", "links"), href: "#/page" },
      { ic: "megaphone", t: "Campanha", on: !!camp, st: camp ? "No ar" : "Nenhuma ativa", href: "#/campaigns" },
      { ic: "cake", t: "Aniversários", on: !!(s.birthday && s.birthday.active), st: s.birthday && s.birthday.active ? "Automático" : "Desligado", href: "#/birthdays" },
      { ic: "clipboard", t: "Pesquisa", on: !!surv, st: surv ? "Ativa" : "Nenhuma ativa", href: surv ? "#/surveys/" + surv.id : "#/surveys" },
      { ic: "brand:google", t: "Avaliações Google", on: !!(s.google && s.google.url), st: s.google && s.google.url ? "Conectado" : "Não conectado", href: "#/reviews" },
      { ic: "bell", t: "Notificações", on: !!(CF.notifyOn && CF.notifyOn()), st: CF.notifyOn && CF.notifyOn() ? "Ligadas" : "Desligadas", act: "notify" },
      { ic: "printer", t: "QR impresso", on: !!(s.onboarding && s.onboarding.shared), st: "Material e PDF", href: "#/page/share" },
      { ic: "brand:googlemaps", t: "Mapa", on: !!(s.gmaps && s.gmaps.main), st: s.gmaps && s.gmaps.main ? `★ ${String(s.gmaps.main.nota || "—").replace(".", ",")} no Google` : "Buscar no Maps", act: "maps-open" },
    ].map((x) => Object.assign(x, { d: DESC[x.t] || "" }));
  };
  const DESC = {"Capa": "Mostre seu espaço ou o seu trabalho.", "Logotipo": "Sua marca no cartão e na página.", "Fundo": "Cor, degradê ou imagem de fundo.", "Cartão": "Carimbos, prêmio e visual do cartão.", "Linha de ícones": "Atalhos de WhatsApp, Wi-Fi e redes.", "Menus": "Cardápio com preços antes da visita.", "Catálogos": "Produtos com foto, descrição e preço.", "Novidades": "Ofertas e avisos na sua página.", "WhatsApp": "O cliente fala com você em um toque.", "Wi-Fi": "Senha da rede e contato de quem usa.", "Links": "Seu site, Instagram e outras redes.", "Campanha": "Uma oferta com prazo para voltar.", "Aniversários": "Presente automático no aniversário.", "Pesquisa": "Saiba o que o cliente pensa.", "Avaliações Google": "Mais estrelas no Google, automático.", "Notificações": "Avisos de carimbos e prêmios.", "QR impresso": "Material para o balcão e as sacolas.", "Mapa": "Sua ficha do Maps com nota e fotos."};
  // recursos Premium: os que já existem levam à tela; os demais avisam que estão chegando
  const PREMIUM = [
    { k: "lang", ic: "message", t: "Idioma da página", d: "Página multi idiomas.", soon: true },
    { k: "ai", ic: "chat", t: "Atendimento com IA", d: "Assistente com IA 24 horas.", soon: true },
    { k: "pdf", ic: "file", t: "Mídias em PDF", d: "Cardápio, catálogo e materiais em PDF para download.", href: "#/page/share" },
    { k: "rot", ic: "refresh", t: "Banner rotativo", d: "Vários banners no topo, um de cada vez.", soon: true },
    { k: "video", ic: "play", t: "Vídeo de fundo", d: "Vídeo curto e mudo no fundo da página.", soon: true },
    { k: "wm", ic: "crown", t: "Remover marca d’água", d: "Sua página sem a marca d’água.", href: "#/billing", on: () => CF.isPremium() },
  ];
  CF.appFeatures = () => appStatus().map((x) => Object.assign({ premium: false }, x)).concat(PREMIUM.map((x) => ({ ic: x.ic, t: x.t, d: x.d, premium: true, soon: !!x.soon, href: x.soon ? "#/app" : x.href })));
  // ordem das bolas escolhida pelo dono (arrastar e soltar): CF.state.appOrder = { main: [títulos], prem: [chaves] }
  const ordered = (list, key, grid) => { const o = ((CF.state.appOrder || {})[grid]) || []; return o.length ? list.slice().sort((a, b) => { const ia = o.indexOf(a[key]), ib = o.indexOf(b[key]); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); }) : list; };
  const statusPanel = () => `<div class="sp">
      <div class="sp-head"><b>Seu app em um toque</b><span class="sp-head-r"><small>Tudo o que está ligado na página do cliente. Toque para editar; arraste para organizar.</small><span class="pill ${CF.isPremium() ? "ok" : "gray"}">${CF.isPremium() ? "Pro" : "Free"}</span></span></div>
      <div class="sp-grid" data-drag="main">${ordered(appStatus(), "t", "main").map((x) => `<${x.href ? `a href="${x.href}"` : `button type="button" data-act="${x.act}"`} class="sp-tile ${x.on ? "on" : ""}" data-tile="${esc(x.t)}" draggable="false" aria-label="${esc(x.t)}: ${esc(x.st)}"><span class="sp-ico">${I(x.ic)}</span><b>${esc(x.t)}</b><small>${esc(x.st)}</small></${x.href ? "a" : "button"}>`).join("")}</div>
      <div class="sp-grid prem" data-drag="prem">${ordered(PREMIUM, "k", "prem").map((x) => `<button type="button" class="sp-tile prem ${CF.isPremium() && !x.soon ? "on" : ""}" data-prem="${x.k}" data-tile="${esc(x.k)}"><span class="sp-ico">${I(x.ic)}<i class="sp-crown">${I("crown", "xs")}</i></span><b>${esc(x.t)}</b><small>${x.soon ? "Em breve" : x.k === "wm" ? (CF.isPremium() ? "Removida" : "Pro") : CF.isPremium() ? "Liberado" : "Pro"}</small></button>`).join("")}</div>
    </div>`;
  // arrastar e soltar das bolas (mouse e toque, via Pointer Events): segurar e mover troca a posição; um toque simples continua abrindo
  function bindTileDrag(root) {
    root.querySelectorAll(".sp-grid[data-drag]").forEach((grid) => {
      let drag = null;
      grid.addEventListener("pointerdown", (e) => { const t = e.target.closest(".sp-tile"); if (!t || e.button) return; drag = { t, x: e.clientX, y: e.clientY, on: false, id: e.pointerId }; });
      grid.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.on) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return; drag.on = true; drag.t.classList.add("dragging"); grid.classList.add("sorting"); try { grid.setPointerCapture(e.pointerId); } catch (x) {} }
        e.preventDefault();
        drag.t.style.transform = `translate(${e.clientX - drag.x}px,${e.clientY - drag.y}px)`;
        const over = [...grid.querySelectorAll(".sp-tile")].find((x) => x !== drag.t && (() => { const r = x.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; })());
        grid.querySelectorAll(".sp-tile.over").forEach((x) => x !== over && x.classList.remove("over")); if (over) over.classList.add("over");
      });
      const end = (e) => {
        if (!drag || (e && e.pointerId !== drag.id)) return; const d = drag; drag = null;
        d.t.style.transform = ""; d.t.classList.remove("dragging"); grid.classList.remove("sorting");
        const over = grid.querySelector(".sp-tile.over"); grid.querySelectorAll(".sp-tile.over").forEach((x) => x.classList.remove("over"));
        if (!d.on) return;
        d.t.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true }); // soltar não conta como toque
        if (over) { const tiles = [...grid.querySelectorAll(".sp-tile")]; tiles.indexOf(d.t) < tiles.indexOf(over) ? over.after(d.t) : over.before(d.t); }
        const order = [...grid.querySelectorAll(".sp-tile")].map((x) => x.dataset.tile);
        CF.update((s) => { s.appOrder = Object.assign({}, s.appOrder, { [grid.dataset.drag]: order }); });
      };
      grid.addEventListener("pointerup", end); grid.addEventListener("pointercancel", end);
    });
  }
  /* Carrossel das telas no aparelho grande: passa sozinho (uma tela por vez, deslizando na vertical). Só pontinhos embaixo (o ativo é alongado);
     o botão sobre a tela diz "Toque para interagir com <TELA>": tocar pausa e libera a interação (rolar, tocar nos blocos) e aparece "Continuar".
     Para sozinho ao sair da tela e respeita "reduzir movimento". */
  function bindReel(view, S) {
    const g = (q) => view.querySelector(q), reel = g("#reel"); if (!reel) return;
    const track = g("#reel-track"), slides = [...view.querySelectorAll(".reel-slide")], dots = [...view.querySelectorAll("[data-reel-go]")], dev = g("#hero-dev .device-png"), hit = g("#reel-hit"), resume = g("#reel-resume");
    const hintN = g("#reel-hint-n"), pill = g("#reel-pill"), desc = g("#reel-desc"), cta = g("#reel-cta"), tryBtn = g("#reel-try"), n = S.length;
    let i = 0, playing = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches), last = Date.now();
    const show = (k) => {
      i = (k + n) % n; const x = S[i]; last = Date.now();
      track.style.transform = `translateY(-${(i * 100) / n}%)`;
      slides.forEach((el, j) => { el.classList.toggle("on", j === i); el.setAttribute("aria-hidden", j !== i); if (j !== i) { const sc = el.querySelector(".screen"); if (sc) sc.scrollTop = 0; } });
      dots.forEach((d, j) => { d.classList.toggle("on", j === i); d.setAttribute("aria-selected", j === i); });
      dev.classList.toggle("dark-status", !!x.dark);
      hintN.textContent = x.short; hit.setAttribute("aria-label", "Toque para interagir com " + x.short);
      pill.textContent = x.t; desc.innerHTML = x.d; cta.href = x.href; cta.querySelector("span").textContent = x.cta;
      tryBtn.hidden = !x.try; if (x.try) tryBtn.dataset.try = x.try;
    };
    const sync = () => { reel.classList.toggle("is-live", !playing); hit.hidden = !playing; resume.hidden = playing; };
    hit.addEventListener("click", () => { playing = false; sync(); });
    resume.addEventListener("click", () => { playing = true; last = Date.now(); sync(); });
    dots.forEach((d) => d.addEventListener("click", () => show(+d.dataset.reelGo)));   // pular para a tela; segue passando (ou parado, se já estava)
    const timer = setInterval(() => { if (!view.isConnected) return clearInterval(timer); if (playing && !document.hidden && Date.now() - last >= 3400) show(i + 1); }, 400);
    show(0); sync();
  }
  // Aparelho do carrossel com a ALTURA igual à da coluna de texto + box ao lado: topo e base alinhados com as margens da direita
  // (só quando estão lado a lado; empilhados no celular, mantém a largura padrão).
  function fitReel(view, build, model) {
    const stage = view.querySelector(".app-hero-stage"), txt = view.querySelector(".app-hero-txt"), host = view.querySelector("#hero-dev"), dots = view.querySelector(".reel-dots"); if (!stage || !txt || !host || !dots) return;
    const spec = CF.deviceSpecs[model] || CF.deviceSpecs["iphone-15-pro"], first = host.querySelector(".device-png");
    const zoom = first && first.offsetWidth ? first.getBoundingClientRect().width / first.offsetWidth : 1;   // o painel original usa zoom na página: medidas da tela ÷ zoom = pixels CSS
    const minW = first ? first.offsetWidth : 300;                                                              // só cresce: nunca fica menor que o tamanho padrão
    for (let k = 0; k < 2; k++) {
      if (Math.abs(stage.getBoundingClientRect().top - txt.getBoundingClientRect().top) > 8) return;   // empilhados: não mexe
      const target = (txt.getBoundingClientRect().height - dots.getBoundingClientRect().height) / zoom - 16, w = Math.max(minW, Math.min(460, Math.round((target * spec.W) / spec.H)));
      const cur = host.querySelector(".device-png"), curW = cur ? cur.offsetWidth : 0;
      if (Math.abs(w - curW) < 6) return;
      host.innerHTML = build(w);
    }
  }
  CF.route("/app", () => {
    const S = appScreens(), reelW = Math.min(380, window.innerWidth - 90), reelModel = (CF.state.preview && CF.state.preview.model) || "iphone-15-pro", share = CF.shareRoute ? CF.shareRoute() : null;
    // "Compartilhar online" vai ao lado de "Carimbar pelo celular" (duas caixas); o resto do Compartilhar (post para redes, materiais impressos) fica embaixo
    const shareParts = (() => { if (!share) return { online: "", rest: "" }; const m = share.html.match(/<!--sh-online-start-->([\s\S]*?)<!--sh-online-end-->/); return m ? { online: m[1], rest: share.html.replace(m[0], "") } : { online: "", rest: share.html }; })();
    const reelDevice = (w) => CF.device(`<div class="reel" id="reel" style="--n:${S.length}"><div class="reel-track" id="reel-track">${S.map((x, i) => `<div class="reel-slide ${i === 0 ? "on" : ""}" data-i="${i}" aria-hidden="${i !== 0}">${x.bare(w)}</div>`).join("")}</div>
      <button type="button" class="reel-hit" id="reel-hit" aria-label="Toque para interagir com ${esc(S[0].short)}"><span class="idea-hint">${I("sparkles", "sm")}<span>Toque para interagir com</span> <b id="reel-hint-n">${esc(S[0].short)}</b></span></button>
      <button type="button" class="reel-resume idea-hint" id="reel-resume" hidden>${I("play", "sm")}<span>Continuar</span></button></div>`, { model: reelModel, width: w });
    return {
      title: "Aplicativo e telas", sub: "Veja como o app do seu cliente fica com os seus dados — e baixe o aplicativo do negócio para dar carimbos.", nav: "app", crumbs: [{ t: "Início", href: "/" }, { t: "Aplicativo e telas" }],
      html: `<div class="stack">
        <section class="card"><div class="card-h"><h2>Telas do app do seu cliente</h2><p>Tudo aqui usa o que você já cadastrou. As telas passam sozinhas no aparelho: pause, ou toque na tela para ver de perto e interagir.</p></div>
          <div class="card-b app-hero"><div class="app-hero-stage"><div id="hero-dev">${reelDevice(reelW)}</div>
              <div class="reel-dots" role="tablist" aria-label="Escolher a tela">${S.map((x, i) => `<button type="button" role="tab" class="${i === 0 ? "on" : ""}" data-reel-go="${i}" aria-selected="${i === 0}" aria-label="${esc(x.t)}" title="${esc(x.t)}"></button>`).join("")}</div></div>
            <div class="app-hero-txt"><span class="pill brand" id="reel-pill">${esc(S[0].t)}</span><h3 style="font-size:22px;font-weight:600;margin:10px 0 8px">${esc(CF.state.biz.name)}</h3><div class="app-hero-row"><p class="muted" id="reel-desc">${S[0].d}</p><div class="app-hero-btns"><a class="btn sm primary" id="reel-cta" href="${S[0].href}">${I("pencil", "sm")}<span>${S[0].cta}</span></a><button type="button" class="btn sm" id="reel-try" hidden>${I("sparkles", "sm")}Testar no celular</button><a class="btn sm" href="preview.html" target="_blank" rel="noopener">${I("phone", "sm")}Abrir em tela cheia</a><a class="btn sm" href="#/app?sec=share">${I("share", "sm")}Compartilhar</a></div></div>
              ${statusPanel()}</div></div></section>

        ${shareParts.rest ? `<div class="stack app-share" id="app-share">${shareParts.rest}</div>` : ""}
        <div class="center"><a class="btn" href="#/">${I("arrow-left", "sm")}Voltar ao painel</a></div></div>`,
      mount(view) {
        // altura do aparelho = altura do texto + box ao lado: mede depois que as fontes carregam (senão as linhas quebram diferente) e só então liga o carrossel
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { if (!view.isConnected) return; fitReel(view, reelDevice, reelModel); bindReel(view, S); });
        if (share && share.mount) share.mount(view);
        if (/[?&]sec=share/.test(location.hash)) setTimeout(() => { const t = view.querySelector("#app-share"); t && t.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
        if (!CF.state.onboarding.app) { CF.state.onboarding.app = true; CF.save(); }   // abriu a tela: o passo "veja como aparece no celular" está feito
        bindTileDrag(view);
        view.addEventListener("click", (e) => {
          const pm = e.target.closest("[data-prem]"); if (pm) { const x = PREMIUM.find((p) => p.k === pm.dataset.prem);
            if (CF.isPremium() && x.href) return CF.go(x.href.slice(1));
            return CF.modal({ title: x.t, sub: x.soon ? "Recurso Premium · em breve" : "Recurso Premium", body: `<div class="row" style="gap:14px;align-items:flex-start"><span class="sp-ico big">${I(x.ic)}</span><p>${esc(x.d)}</p></div>${x.soon ? `<p class="small muted" style="margin-top:12px">Estamos finalizando este recurso. Quem tem o plano Pro recebe primeiro, sem custo extra.</p>` : ""}`, foot: `<button class="btn" data-close>Fechar</button>${CF.isPremium() ? "" : `<a class="btn primary" href="#/billing">${I("crown", "sm")}Ver o plano Pro</a>`}` }); }
          const pv = e.target.closest(".app-hero-stage [data-pv]"); if (pv && CF.previewItem) return CF.previewItem(pv.dataset.pv);
          const t = e.target.closest("[data-try]"); if (t && CF.openDemo) return CF.openDemo(t.dataset.try); });
        view.addEventListener("keydown", (e) => { const t = e.target.closest("[data-try]"); if (t && (e.key === "Enter" || e.key === " ") && CF.openDemo) { e.preventDefault(); CF.openDemo(t.dataset.try); } }); },
    };
  });

  /* ============================== Faturamento ============================== */
  // Sem servidor (demonstração), "Ativar" só muda o plano neste navegador. Com o Supabase ligado, data.js troca CF.billing pelo
  // pagamento de verdade na Stripe (função billing): Checkout para assinar e Portal para cartão, recibos e cancelamento.
  CF.billing = { demo: true, info: { enabled: false, yearly: true }, account: null };
  CF.route("/billing", () => {
    const s = CF.state, pr = CF.config.prices, tr = CF.trial(), BL = CF.billing || { demo: true };
    const live = !BL.demo, info = live ? BL.info : null, online = !!(info && info.enabled), acct = live ? BL.account : null;
    const prov = (info && info.provider) || "stripe";   // provedor padrão da plataforma (painel da plataforma › Pagamentos)
    const noYear = live && !!info && info.yearly === false, bill = noYear ? "monthly" : s.plan.billing;   // sem preço anual na Stripe: só o mensal
    const FREE = CF.config.freeClientLimit, PAID = CF.config.paidClientLimit, MULT = PAID / FREE;
    const n = (x) => x.toLocaleString(CF.locale());
    const pp = info && info.prices && +info.prices.month > 0 ? info.prices : null;   // preços do servidor (mesmos da cobrança)
    const price = (m) => (bill === "annual" ? Math.round(pp && +pp.year > 0 ? pp.year / 12 : (CF.config.prices.proYear || m * 12) / 12) : pp ? +pp.month : m);
    const monthly = price(pr.pro), perClient = monthly / PAID;
    const fmtDate = (d) => d.toLocaleDateString(CF.locale(), { day: "numeric", month: "long" });
    const longDate = (iso) => new Date(iso).toLocaleDateString(CF.locale(), { day: "numeric", month: "long", year: "numeric" });
    // assinatura (só com servidor): situação, próxima cobrança ou validade, e o portal (só a Stripe tem)
    const LIVE = ["active", "trialing", "past_due"], ap = (acct && acct.provider) || "stripe";
    const sub = acct && LIVE.includes(acct.status) && (acct.stripe_subscription_id || ap !== "stripe") ? acct : null;
    const once = !!(sub && sub.auto_renew === false && !sub.cancel_at_period_end);   // Pix manual / pagamento avulso: vale até a data
    const stripeOn = info && info.providers ? !!info.providers.stripe : online;
    const manage = stripeOn && ap === "stripe" && !!(acct && acct.stripe_customer_id && acct.status);
    const PV = { stripe: "pela Stripe", asaas: "pelo Asaas", mercadopago: "pelo Mercado Pago", pix: "por Pix" }, by = PV[ap] || "";
    const subInfo = !sub ? "" : sub.status === "past_due"
      ? `<div class="alert warn" style="margin-top:12px">${I("warn")}<div>${ap === "stripe" ? "O último pagamento não passou. A Stripe tenta de novo nos próximos dias: atualize o cartão em “Gerenciar assinatura” para continuar no Pro."
          : once || sub.auto_renew === false ? "O período pago terminou. Pague o próximo para continuar no Pro." : `O último pagamento não foi confirmado. Pague a cobrança que chegou por e-mail (${by.replace(/^(pela|pelo|por) /, "")}) para continuar no Pro.`}</div></div>`
      : sub.cancel_at_period_end
      ? `<div class="alert info" style="margin-top:12px">${I("info")}<div><span>Assinatura cancelada. O Pro continua até</span> <b>${sub.current_period_end ? longDate(sub.current_period_end) : "o fim do período pago"}</b><span>; depois o plano volta ao Free.</span></div></div>`
      : once
      ? `<p class="small muted" style="margin-top:8px"><span>${sub.billing_interval === "year" ? "Plano anual" : "Plano mensal"} pago ${by}</span>${sub.current_period_end ? ` · <span>válido até</span> <b>${longDate(sub.current_period_end)}</b>` : ""}</p>`
      : `<p class="small muted" style="margin-top:8px"><span>${sub.billing_interval === "year" ? "Assinatura anual" : "Assinatura mensal"} ${by}</span>${sub.current_period_end ? ` · <span>próxima cobrança em</span> <b>${longDate(sub.current_period_end)}</b>` : ""}</p>`;
    const renew = online && sub && (once || (sub.status === "past_due" && sub.auto_renew === false));   // pagar o próximo período pelo provedor padrão
    const proBtn = tr.paid ? (renew ? `<button class="btn primary block" data-pay="checkout">${I("lock", "sm")}Pagar o próximo período</button>` : `<button class="btn primary block" disabled>Plano atual</button>`)
      : !live ? `<button class="btn primary block" data-plan="Pro">Ativar o Pro por ${money(monthly)}/mês</button>`
      : !info ? `<button class="btn primary block" disabled><span class="spinner sm"></span>Carregando…</button>`
      : online ? `<button class="btn primary block" data-pay="checkout">${I("lock", "sm")}Ativar o Pro por ${money(monthly)}/mês</button>`
      : `<button class="btn primary block" disabled>Pagamento online em breve</button>`;
    const freeBtn = !tr.paid ? `<button class="btn block" disabled>${tr.active ? "Vale depois do teste" : "Plano atual"}</button>`
      : !live ? `<button class="btn block" data-plan="Free">Voltar ao Free</button>`
      : `<button class="btn block" ${manage && sub && !sub.cancel_at_period_end ? `data-pay="cancel"` : "disabled"}>Voltar ao Free</button>`;
    const NOTE = { stripe: "Pagamento seguro pela Stripe, com cartão de crédito. O recibo chega por e-mail e você cancela quando quiser em “Gerenciar assinatura”.",
      asaas: "Pagamento seguro pelo Asaas: Pix, boleto ou cartão de crédito. A cobrança se renova sozinha e o recibo chega por e-mail.",
      mercadopago: "Pagamento seguro pelo Mercado Pago, com cartão de crédito. A assinatura se renova sozinha e o recibo chega por e-mail.",
      pix: "Pagamento por Pix. Depois de pagar, a confirmação é feita pela nossa equipe e o Pro é ativado em até 1 dia útil." };
    const note = !live ? `Preço de exemplo para demonstração, ajuste em <code>CF.config.prices.pro</code>. A cobrança real ainda não está ligada: "Ativar" só muda o plano.`
      : online ? NOTE[prov] || NOTE.stripe
      : info ? "O pagamento online ainda não foi ligado. Enquanto isso, nada é cobrado." : "";
    const stripe = online;   // (nome antigo usado abaixo para o cadeado da nota)
    const all = ["Todas as funções, sem tirar nada", "Cartões ilimitados, modelo Premium e fundos por segmento", "Campanhas, aniversários, pesquisas e avaliações Google", "Página do negócio, QR, material impresso e imagens para redes sociais", "Equipe e scanner de carimbos"];
    const state = tr.paid ? `Você está no plano <b>Pro</b>: até <b>${n(PAID)} clientes</b>.`
      : tr.active ? `Seu <b>teste grátis</b> está no dia <b>${tr.day} de ${tr.total}</b> e termina em <b>${fmtDate(tr.end)}</b>. Até lá tudo está liberado, com até ${n(PAID)} clientes.`
      : `Seu teste de ${tr.total} dias terminou. Você está no plano <b>Free</b>, com até <b>${n(FREE)} clientes</b>. Ative o Pro para chegar a ${n(PAID)}.`;
    const over = !tr.paid && !tr.active && s.customers.length > FREE;
    const cust = s.customers.length, left = Math.max(0, FREE - cust), perDay = monthly / 30;
    const yearSave = pp && +pp.year > 0 ? Math.round(+pp.month * 12 - +pp.year) : Math.round(pr.pro * 12 - (pr.proYear || pr.pro * 12));
    const cta = (extra = "") => proBtn.replace('class="btn primary block"', `class="btn primary block bl-cta ${extra}"`);
    // manchete: só o que é verdade agora (dias do teste, clientes já no cartão, limite do Free)
    const head = tr.paid ? ["Plano Pro ativo. Tudo liberado.", `Até <b>${n(PAID)} clientes</b>, todas as funções, sem marca d’água.`]
      : tr.active ? [`Faltam <b>${tr.left}</b> ${tr.left === 1 ? "dia" : "dias"} de teste.`, `Em <b>${fmtDate(tr.end)}</b> o cartão volta ao Free: ${cust > FREE ? `você já tem <b>${n(cust)} clientes</b>, e cliente novo não entra mais` : `só ${n(FREE)} clientes cabem, e você já tem <b>${n(cust)}</b>`}. Ative o Pro hoje e nada muda.`]
      : over ? [`${n(cust)} clientes no cartão. Cliente novo não entra.`, `O Free vai até ${n(FREE)}. Quem chegar agora no balcão com o QR fica de fora até você ativar o Pro.`]
      : [`Sobram ${n(left)} ${left === 1 ? "vaga" : "vagas"} no Free.`, `Depois disso, o cliente nº ${n(FREE + 1)} não consegue entrar. Com o Pro cabem ${n(PAID)}.`];
    const lose = [`Cliente novo <b>não entra</b> depois do ${n(FREE)}º`, "Marca d’água na página do negócio", "Sem cartão Premium com foto", "Sem estatística de visitantes", "Sem contato em troca do Wi-Fi"];
    const keep = [`<b>${n(PAID)} clientes</b> no cartão`, "Todas as funções, hoje e as próximas", "Página limpa, com a sua marca", "Cancela quando quiser, sem multa", `Sai por <b>${money(Math.round(perDay * 100) / 100)}</b> por dia`];
    const faq = [["E se eu cancelar?", "Você cancela sozinho em “Gerenciar assinatura”. O Pro continua até o fim do período pago e depois o cartão volta ao Free. Os clientes ficam."],
      ["Tem fidelidade ou multa?", "Não. É mês a mês, ou um ano de uma vez com desconto. Sem contrato, sem taxa de saída."],
      ["O que acontece com quem já está no cartão?", "Nada. Quem entrou continua com os carimbos. O limite só vale para cadastro novo."],
      ["Como é a cobrança?", NOTE[prov] || NOTE.stripe]];
    const yearMo = Math.round((pp && +pp.year > 0 ? +pp.year : (pr.proYear || pr.pro * 12)) / 12);
    return {
      title: "Faturamento", nav: "billing", crumbs: [{ t: "Início", href: "/" }, { t: "Faturamento" }],
      html: `<div class="stack bl-page">
        <section class="card bl-hero${tr.paid ? "" : " urgent"}"><div class="card-b"><div class="bl-hero-g">
          <div class="bl-hero-copy"><span class="pill${tr.paid ? " ok" : ""}">${tr.paid ? "Plano Pro ativo" : tr.active ? `Teste grátis · dia ${tr.day} de ${tr.total}` : "Plano Free"}</span>
            <h2 class="bl-h">${head[0]}</h2><p class="bl-p">${head[1]}</p>
            ${over ? `<div class="alert warn" style="margin-top:12px">${I("warn")}<div>Você já tem ${n(cust)} clientes. Eles continuam no cartão, mas só dá para cadastrar novos com o plano Pro.</div></div>` : ""}${subInfo}
            ${tr.paid ? (manage ? `<div style="margin-top:14px"><button class="btn" data-pay="portal">${I("card", "sm")}Gerenciar assinatura</button></div>` : "") : `<div class="bl-hero-cta">${cta()}<small class="muted">${money(monthly)}/mês${bill === "annual" ? ", cobrado por ano" : ""} · cancele quando quiser · sem fidelidade</small></div>`}</div>
          ${tr.paid ? "" : `<div class="bl-meter"><div class="bl-meter-n"><b>${n(cust)}</b><span>de ${n(tr.active ? PAID : FREE)} clientes</span></div><div class="tc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${tr.total}" aria-valuenow="${Math.min(tr.day, tr.total)}"><i style="width:${Math.min(100, Math.round((Math.min(tr.day, tr.total) / tr.total) * 100))}%"></i></div><small class="muted">${tr.ended ? "Teste encerrado" : `Teste: dia ${tr.day} de ${tr.total} · termina em ${fmtDate(tr.end)}`}</small></div>`}
        </div></div></section>

        ${noYear || tr.paid ? "" : `<div class="row" style="justify-content:center"><div class="seg" id="bl-seg"><button class="${bill === "monthly" ? "on" : ""}" data-b="monthly">Mensal · ${money(pp ? +pp.month : pr.pro)}</button><button class="${bill === "annual" ? "on" : ""}" data-b="annual">Anual · R$ ${yearMo}/mês <span class="pill ok" style="text-transform:none;letter-spacing:0">economize ${money(yearSave)}</span></button></div></div>`}

        <section class="vs" aria-label="Comparação dos planos">
          <div class="vs-col"><span class="pill gray">Free</span><b class="vs-n">${n(FREE)}</b><span class="vs-u">clientes</span><div class="vs-price">R$ 0</div>
            <ul class="bl-list bad">${lose.map((t) => `<li>${I("x", "sm")}<span>${t}</span></li>`).join("")}</ul>${freeBtn}</div>
          <div class="vs-mid"><div class="vs-x">${MULT}×</div><span>mais clientes</span><small>${n(PAID)} ÷ ${n(FREE)} = ${MULT}</small></div>
          <div class="vs-col pro"><span class="pill">Pro</span><b class="vs-n">${n(PAID)}</b><span class="vs-u">clientes</span><div class="vs-price">${money(monthly)}<small>/mês${bill === "annual" ? " · cobrado por ano" : ""}</small></div>
            <ul class="bl-list good">${keep.map((t) => `<li>${I("check", "sm")}<span>${t}</span></li>`).join("")}</ul>${proBtn}</div>
        </section>

        <section class="acc open" id="bl-calc"><button class="acc-h" type="button"><div class="row"><span class="ico-tile brand">${I("calculator")}</span><div><h3>Quanto o Pro devolve para você</h3><p style="color:var(--brand-700)">Com os números do seu balcão, não os nossos</p></div></div>${I("chevron-down")}</button>
          <div class="acc-b"><div class="grid g3" style="gap:16px"><div class="field"><label for="cl-t">Ticket médio (R$)</label><input class="input" id="cl-t" type="number" min="1" value="25"></div><div class="field"><label for="cl-v">Visitas extras por cliente/mês</label><input class="input" id="cl-v" type="number" min="0" step="0.1" value="0.5"></div></div>
          <div id="cl-out" style="margin-top:16px"></div>${tr.paid ? "" : `<div style="margin-top:16px;max-width:420px">${cta()}</div>`}</div></section>

        <section class="bl-guar" aria-label="Garantias"><div>${I("lock")}<b>Pagamento seguro</b><small>${prov === "stripe" ? "Stripe, cartão de crédito" : prov === "pix" ? "Pix" : "Pix, boleto ou cartão"}</small></div><div>${I("calendar-x")}<b>Cancele quando quiser</b><small>Sem multa, sem contrato</small></div><div>${I("users")}<b>Ninguém é apagado</b><small>Seus clientes ficam no cartão</small></div><div>${I("sparkles")}<b>Tudo liberado</b><small>Funções novas entram sem custo</small></div></section>

        <section class="card"><div class="card-h"><h2>Dúvidas antes de ativar</h2></div><div class="card-b bl-faq">${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></section>
        ${note ? `<p class="small muted" id="bl-note">${online ? I("lock", "sm") : ""}${note}</p>` : ""}
        ${tr.paid || (live && !online) ? "" : `<div class="bl-sticky">${cta("sm")}</div>`}</div>`,
      mount(view) {
        const seg = view.querySelector("#bl-seg");
        if (seg) seg.addEventListener("click", (e) => { const b = e.target.closest("[data-b]"); if (b) { CF.update((st) => (st.plan.billing = b.dataset.b)); CF.refresh(); } });
        // Stripe: abre o Checkout (assinar) ou o Portal (cartão, recibos, cancelar); a página da Stripe volta para cá
        const pay = async (btn, kind) => {
          if (kind === "cancel") return CF.confirm({ title: "Voltar ao plano Free?", text: `O cancelamento é feito no portal seguro da Stripe. O Pro continua até o fim do período já pago; depois o limite cai para ${n(FREE)} clientes.`, ok: "Abrir o portal", onOk: () => pay(btn, "portal") });
          const viaStripe = kind !== "checkout" || prov === "stripe";
          const html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner sm"></span>${viaStripe ? "Abrindo a Stripe…" : "Abrindo o pagamento…"}`;
          const r = kind === "checkout" ? await BL.checkout(bill === "annual" ? "year" : "month") : await BL.portal();
          if (r && r.url) return location.assign(r.url);
          btn.disabled = false; btn.innerHTML = html;
          CF.toast((r && r.error) || (viaStripe ? "Não foi possível abrir a Stripe. Tente de novo." : "Não foi possível abrir o pagamento. Tente de novo."), "err");
        };
        view.addEventListener("click", (e) => {
          const p = e.target.closest("[data-pay]"); if (p && !p.disabled) return pay(p, p.dataset.pay);
          const b = e.target.closest("[data-plan]"); if (!b) return; const k = b.dataset.plan;
          CF.confirm({ title: k === "Free" ? "Voltar ao plano Free?" : "Ativar o plano Pro?", text: k === "Free" ? `O limite cai para ${n(FREE)} clientes. Quem já está cadastrado continua no cartão.` : `Você passa a ter até ${n(PAID)} clientes. Demonstração: nenhuma cobrança é feita ainda.`, ok: "Confirmar", onOk() { CF.update((st) => { st.plan.name = k; st.plan.trial = false; }); CF.toast(`Plano ${k} ativo.`); CF.refresh(); } });
        });
        const calc = () => {
          const t = +view.querySelector("#cl-t").value || 0, v = +view.querySelector("#cl-v").value || 0, a = FREE * t * v, c = PAID * t * v, cost = monthly;
          view.querySelector("#cl-out").innerHTML = `<div class="calc-grid"><div class="calc-box"><small>Free · ${n(FREE)} clientes</small><b>${money(Math.round(a))}<span>/mês</span></b><em>${n(FREE)} × ${money(t)} × ${String(v).replace(".", ",")} visitas</em></div>
            <div class="calc-x">${MULT}×</div><div class="calc-box pro"><small>Pro · ${n(PAID)} clientes</small><b>${money(Math.round(c))}<span>/mês</span></b><em>${n(PAID)} × ${money(t)} × ${String(v).replace(".", ",")} visitas</em></div></div>
            <div class="alert ok" style="margin-top:14px">${I("info")}<div>O Pro custa <b>${money(cost)}/mês</b> e, com esses números, pode trazer <b>${money(Math.round(c))}/mês</b> a mais: um retorno de <b>${cost ? (c / cost).toFixed(1).replace(".", ",") : 0}×</b> sobre o plano. Mesmo preenchendo só 10% dos ${n(PAID)} clientes (${n(PAID / 10)}), seriam <b>${money(Math.round(c / 10))}/mês</b>.</div></div>`;
        };
        view.querySelector("#bl-calc").addEventListener("input", calc); calc();
      },
    };
  });

  /* ============================== Configurações ============================== */
  const TZS = ["America/Sao_Paulo", "America/Manaus", "America/Fortaleza", "America/Cuiaba", "Europe/Lisbon", "Europe/Madrid", "America/New_York", "UTC"];
  const TYPES = [["Café", "coffee"], ["Salão de beleza", "sparkles"], ["Salão de unhas", "sparkles"], ["Restaurante", "utensils"], ["Barbearia", "scissors"], ["Cabeleireiro", "scissors"], ["Padaria", "utensils"]];
  const FREQ = [["weekly", "Algumas vezes por semana", "refresh"], ["biweekly", "A cada 1–2 semanas", "calendar"], ["monthly", "A cada 3–6 semanas", "calendar"], ["other", "Outro", "pencil"]];
  /* Dados do negócio (nome, idioma, fuso, moeda, tipo, localização e logotipo): ficam na tela Sua vitrine (pages/page.js, rota /page); aqui só guardamos o HTML e a ligação dos eventos. */
  const sec = (id, t, d, body) => `<section class="card" id="${id}"><div class="card-h"><h2>${t}</h2>${d ? `<p>${d}</p>` : ""}</div><div class="card-b stack-sm" style="gap:16px">${body}</div></section>`;
  CF.bizSettings = {
    html() {
      const b = CF.state.biz;
      const tzNow = (tz) => { try { return new Date().toLocaleString(CF.locale(), { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
      const dev = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return `        ${sec("st-gen", "Geral", "", `
          <div class="field" style="max-width:448px"><label for="st-name">Nome da empresa</label><div class="input-wrap"><input class="input" id="st-name" maxlength="100" value="${esc(b.name)}" style="padding-left:14px"><span class="suffix" id="st-nc"></span></div></div>
          <div class="field"><label for="st-lang">Idioma</label><span class="hint" style="font-size:13px;color:var(--gray-500)">Afeta os rótulos padrão dos cartões, as notificações push nas carteiras e os e-mails do Cliente Fiel.</span><select class="select" id="st-lang" style="max-width:320px"><option value="pt-BR" ${b.lang === "pt-BR" ? "selected" : ""}>BR Português</option><option value="en" ${b.lang === "en" ? "selected" : ""}>EN English</option><option value="es" ${b.lang === "es" ? "selected" : ""}>ES Español</option></select></div>
          <div class="field"><label for="st-tz">Fuso horário</label><span class="hint" style="font-size:13px;color:var(--gray-500)">É utilizado para enviar mensagens de aniversário e outras mensagens automáticas à hora local correta.</span><select class="select" id="st-tz" style="max-width:448px">${TZS.map((z) => `<option ${z === b.tz ? "selected" : ""}>${z}</option>`).join("")}</select><span class="hint" id="st-tznow">Hora local agora: ${tzNow(b.tz)}</span>${TZS.includes(dev) && dev !== b.tz ? `<button class="link-btn" id="st-tzdev" style="text-align:left">Usar o fuso horário deste dispositivo (${dev})</button>` : ""}</div>
          <div class="field"><label for="st-cur">Moeda</label><span class="hint" style="font-size:13px;color:var(--gray-500)">A moeda em que define os preços. Adivinhamos no cadastro, por isso altere-a aqui se nos enganamos.</span><select class="select" id="st-cur" style="max-width:200px">${["BRL", "EUR", "USD"].map((c) => `<option ${c === b.currency ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label>Que tipo de negócio você tem?</label><span class="hint" style="font-size:13px;color:var(--gray-500)">Vamos sugerir os campos que negócios como o seu costumam pedir.</span><p>Sua resposta: <b>${esc(b.type)}</b></p>
            <div class="chips" id="st-type">${TYPES.map(([t, ic]) => `<button class="chip lg ${b.type === t ? "on" : ""}" data-ty="${esc(t)}">${I(ic, "sm")}${t}${b.type === t ? I("check", "sm") : ""}</button>`).join("")}</div>
            <div class="input-wrap" style="margin-top:8px">${I("search", "sm")}<input class="input" id="st-tyo" placeholder="Outra coisa? Comece a escrever..." value="${TYPES.some((t) => t[0] === b.type) ? "" : esc(b.type)}"></div></div>
          <div><button class="btn primary" id="st-gen-save" disabled>Salvar</button></div>`)}
        ${sec("st-loc", "Localização da empresa", "Esta é a localização visível para clientes, usada pela sua página pública, links de mapas e pedidos de avaliações no Google.", `<button class="loc-row card" id="st-addr" style="border:1px solid var(--gray-200);border-radius:12px;padding:14px 16px">${I("pin", "pin")}<div style="flex:1"><b class="strong" style="font-weight:500">${esc(b.name)}</b><div class="small muted">${esc(b.address || "Defina o endereço")}</div></div>${I("chevron-right", "sm")}</button>`)}
        ${sec("st-logo", "Logotipo da empresa", "Este logotipo é exibido em todos os seus cartões de fidelidade e na sua página.", `<div class="center stack-sm" style="align-items:center"><span class="img-edit" style="display:inline-block;border-radius:50%"><img src="${esc(b.logo)}" alt="Logotipo" style="width:112px;height:112px;border-radius:50%;object-fit:cover;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/12px 12px;display:block">${CF.imgEditBtn("logo")}</span><p class="small muted" style="margin:0"><b>Recomendado: quadrado 1:1 · 512×512 px</b> (PNG com fundo transparente fica ótimo)</p><p class="small muted">Estes logotipos estarão visíveis em cada cartão Cliente Fiel e na sua página.</p><label class="btn primary"><input type="file" accept="image/*" class="sr-only" id="st-logo-f">Alterar logotipo</label></div>`)}`;
    },
    bind(view) {
      const g = (s) => view.querySelector(s); if (!g("#st-gen-save")) return;
      const b = CF.state.biz;
      const tzNow = (tz) => { try { return new Date().toLocaleString(CF.locale(), { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
      const dev = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const gen = { name: b.name, lang: b.lang, tz: b.tz, currency: b.currency, type: b.type };
        const dirty = () => { g("#st-gen-save").disabled = !Object.keys(gen).some((k) => gen[k] !== CF.state.biz[k]); g("#st-nc").textContent = `${gen.name.length}/100`; };
        g("#st-name").addEventListener("input", (e) => { gen.name = e.target.value; dirty(); });
        g("#st-lang").addEventListener("change", (e) => { gen.lang = e.target.value; dirty(); });
        g("#st-cur").addEventListener("change", (e) => { gen.currency = e.target.value; dirty(); });
        g("#st-tz").addEventListener("change", (e) => { gen.tz = e.target.value; g("#st-tznow").textContent = "Hora local agora: " + tzNow(gen.tz); dirty(); });
        const dv = g("#st-tzdev"); dv && dv.addEventListener("click", () => { gen.tz = dev; g("#st-tz").value = dev; g("#st-tznow").textContent = "Hora local agora: " + tzNow(dev); dirty(); });
        g("#st-type").addEventListener("click", (e) => { const c = e.target.closest("[data-ty]"); if (!c) return; gen.type = c.dataset.ty; g("#st-tyo").value = ""; view.querySelectorAll("#st-type .chip").forEach((x) => x.classList.toggle("on", x === c)); dirty(); });
        g("#st-tyo").addEventListener("input", (e) => { if (e.target.value.trim()) { gen.type = e.target.value.trim(); view.querySelectorAll("#st-type .chip").forEach((x) => x.classList.remove("on")); dirty(); } });
        g("#st-gen-save").addEventListener("click", () => { if (!gen.name.trim()) return CF.toast("Informe o nome da empresa.", "err"); CF.update((s) => Object.assign(s.biz, gen, { name: gen.name.trim() })); CF.toast("Configurações salvas."); CF.refresh(); });
        g("#st-addr").addEventListener("click", () => CF.placeDrawer({ title: "Localização da empresa", sub: "Escolha a localização exibida na sua página pública.", label: "Encontre sua empresa", onPick: (p) => { CF.update((s) => { s.biz.address = p.address || p.name; }); CF.toast("Localização atualizada."); CF.refresh(); } }));
        CF.imgEditors.logo = { get: () => CF.state.biz.logo, set: (u) => { CF.update((st) => (st.biz.logo = u)); CF.toast("Logotipo atualizado."); CF.refresh(); }, opts: CF.IMG.logo };
        g("#st-logo-f").addEventListener("change", async (e) => { try { const d = await CF.readImageAdjusted(e.target.files[0], 512, 0.85, CF.imgPreset(CF.IMG.logo)); CF.update((s) => (s.biz.logo = d)); CF.toast("Logotipo atualizado."); CF.refresh(); } catch (err) { CF.toast(err.message, "err"); } });
      dirty();
    },
  };
  CF.route("/settings", () => {
    const b = CF.state.biz;
    return {
      title: "Configurações", sub: "Estas configurações se aplicam a todos os seus cartões de fidelidade e à sua página.", nav: "settings", crumbs: [{ t: "Início", href: "/" }, { t: "Configurações" }],
      html: `<div class="stack">
        ${sec("st-freq", "Frequência de visita dos clientes", "Com que frequência seus clientes costumam visitar?", `<div class="chips" id="st-fq">${FREQ.map(([k, v, ic]) => `<button class="chip lg ${b.visitFreq === k ? "on" : ""}" data-f="${k}">${I(ic, "sm")}${v}</button>`).join("")}</div><p class="muted">Recomendações de quantidade de carimbos ao criar cartões.</p><div><button class="btn primary" id="st-fq-save" disabled>Salvar</button></div>`)}
        ${sec("st-save", "Salvamento", "Como as suas alterações são gravadas.", `
          <label class="row" style="gap:12px;align-items:flex-start"><span class="toggle"><input type="checkbox" id="st-autosave" ${CF.autosave() ? "checked" : ""}><span></span></span><span><b>Salvar automaticamente</b><br><span class="hint" style="font-size:13px;color:var(--gray-500)">Ligado: cada mudança é gravada na hora. Desligado: você mexe à vontade e grava quando quiser com o botão <b>Salvar</b> (no topo e nas telas); ao sair com algo por salvar, o navegador avisa.</span></span></label>`)}
        ${sec("st-legal", "Dados da empresa", "Sua identidade legal, exibida no Aviso de Privacidade do Cliente.", `
          <div class="field"><label>Como você opera?</label><div class="legal-opts" id="st-lt"><button data-l="individual" class="${b.legalType === "individual" ? "on" : ""}"><b>Pessoa física / Autônomo</b><span>Opera em seu nome (p. ex., trabalhador independente, empresário individual, freelancer).</span></button><button data-l="company" class="${b.legalType === "company" ? "on" : ""}"><b>Empresa registrada</b><span>Seu negócio é uma empresa separada com nome próprio (LTDA, S.A. etc.).</span></button></div></div>
          <div class="field" style="max-width:448px"><label for="st-ln">Seu nome completo ou nome da empresa</label><input class="input" id="st-ln" value="${esc(b.legalName)}"></div>
          <div class="field" style="max-width:448px"><label for="st-pm">E-mail de contato para privacidade</label><input class="input" id="st-pm" type="email" value="${esc(b.privacyEmail)}"></div>
          <div><button class="btn primary" id="st-legal-save">Salvar</button></div>`)}
        ${sec("st-cf", `${I("tag", "sm")} Campos personalizados`, "", `<p class="muted">Registre o mesmo tipo de informação em todos os clientes (ex.: número de cliente, tamanho de camiseta, alergias).</p>
          ${b.customFields.length ? `<div>${b.customFields.map((f, i) => `<div class="list-row"><span style="flex:1">${esc(f)}</span><button class="btn sm danger" data-cfr="${i}">${I("trash", "sm")}</button></div>`).join("")}</div>` : `<p class="muted">Ainda não existem campos personalizados. Adicione um abaixo.</p>`}
          <div class="row"><button class="btn" id="st-cf-add" ${b.customFields.length >= 5 ? "disabled" : ""}>${I("plus", "sm")}Adicionar campo</button></div><p class="small muted">Usando ${b.customFields.length} de 5 campos</p>`)}
        <section class="card danger-zone"><div class="card-h"><h2>Excluir conta</h2><p>Exclua permanentemente sua conta e todos os dados associados. Esta ação não pode ser desfeita.</p></div><div class="card-b"><p class="strong" style="font-weight:500;margin-bottom:8px">Isso excluirá permanentemente:</p><ul class="muted" style="margin:0 0 16px;padding-left:20px"><li>Todos os dados e configurações da empresa</li><li>Todas as contas de funcionários</li><li>Todos os dados de clientes e cartões de fidelidade</li></ul><button class="btn danger-solid" id="st-del">Excluir conta</button></div></section></div>`,
      mount(view) {
        const g = (s) => view.querySelector(s);
        let fq = b.visitFreq; g("#st-fq").addEventListener("click", (e) => { const c = e.target.closest("[data-f]"); if (!c) return; fq = c.dataset.f; view.querySelectorAll("#st-fq .chip").forEach((x) => x.classList.toggle("on", x === c)); g("#st-fq-save").disabled = fq === CF.state.biz.visitFreq; });
        g("#st-fq-save").addEventListener("click", () => { CF.update((s) => (s.biz.visitFreq = fq)); g("#st-fq-save").disabled = true; CF.toast("Frequência salva."); });
        g("#st-autosave").addEventListener("change", (e) => { CF.setAutosave(e.target.checked); CF.toast(e.target.checked ? "Salvamento automático ligado." : "Salvamento automático desligado. Use o botão Salvar."); });
        let lt = b.legalType; g("#st-lt").addEventListener("click", (e) => { const c = e.target.closest("[data-l]"); if (!c) return; lt = c.dataset.l; view.querySelectorAll("#st-lt button").forEach((x) => x.classList.toggle("on", x === c)); });
        g("#st-legal-save").addEventListener("click", () => { const em = g("#st-pm").value.trim(); if (em && !/^\S+@\S+\.\S+$/.test(em)) return CF.toast("E-mail inválido.", "err"); CF.update((s) => Object.assign(s.biz, { legalType: lt, legalName: g("#st-ln").value.trim(), privacyEmail: em })); CF.toast("Dados da empresa salvos."); });
        g("#st-cf-add").addEventListener("click", () => { const ov = CF.modal({ title: "Novo campo personalizado", body: `<div class="field"><label for="cf-n">Nome do campo</label><input class="input" id="cf-n" placeholder="Ex.: Tamanho de camiseta" autofocus></div>`, foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="cf-ok">Adicionar</button>` }); ov.querySelector("#cf-ok").addEventListener("click", () => { const v = ov.querySelector("#cf-n").value.trim(); if (!v) return; CF.update((s) => s.biz.customFields.push(v)); ov.close(); CF.refresh(); }); });
        view.addEventListener("click", (e) => { const r = e.target.closest("[data-cfr]"); if (r) { CF.update((s) => s.biz.customFields.splice(+r.dataset.cfr, 1)); CF.refresh(); } });
        g("#st-del").addEventListener("click", () => {
          const ov = CF.modal({ title: "Excluir conta?", sub: "Digite <b>EXCLUIR</b> para confirmar. Nesta demonstração, isso apenas restaura os dados deste navegador.", body: `<input class="input" id="dl-t" autocomplete="off" autofocus>`, foot: `<button class="btn" data-close>Cancelar</button><button class="btn danger-solid" id="dl-ok" disabled>Excluir conta</button>` });
          const t = ov.querySelector("#dl-t"), ok = ov.querySelector("#dl-ok"); // a palavra de confirmação acompanha o idioma do painel (EXCLUIR / ELIMINAR / DELETE / ELIMINA); a original em PT também vale
          const word = (window.CF_T ? CF_T("EXCLUIR") : "EXCLUIR").toUpperCase();
          t.addEventListener("input", () => { const v = t.value.trim().toUpperCase(); ok.disabled = v !== word && v !== "EXCLUIR"; });
          ok.addEventListener("click", () => { ov.close(); CF.resetDemo(); CF.toast("Dados restaurados ao estado inicial."); CF.go("/"); CF.render(); });
        });
      },
    };
  });
})();
