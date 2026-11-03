/* Superadmin da plataforma — #/admin (clientes), #/admin/:id (detalhe + menu do cliente + Forja), #/admin/forja (bots), #/admin/keys (SerpAPI).
   Só aparece para quem está em platform_admins (CF.state.ext.isAdmin). Dados por CF.ext.api (servidor local → Supabase → exemplo). */
(function () {
  "use strict";
  const CF = window.CF, esc = CF.esc, I = CF.icon, E = CF.ext;

  const guard = () => { if (CF.state.ext && CF.state.ext.isAdmin) return true; CF.toast("Esta área é só do superadmin da plataforma.", "err"); setTimeout(() => CF.go("/"), 0); return false; };
  const denied = { title: "Acesso restrito", html: `<p class="muted">Esta área é só do superadmin da plataforma.</p>` };
  const when = (d) => (d ? new Date(d).toLocaleString(CF.locale(), { dateStyle: "short", timeStyle: "short" }) : "—");
  const planPill = (b) => `<span class="pill ${b.plan && b.plan !== "free" ? "" : "gray"}">${b.plan && b.plan !== "free" ? I("crown") : ""}${esc({ free: "Free", pro: "Pro", business: "Pro", multi: "Pro" }[b.plan] || b.plan || "Free")}${b.trial ? " · teste" : ""}</span>`;
  const forjaPill = (f) => !f ? `<span class="pill gray">sem chatbot</span>` : `<span class="pill ${f.status === "ok" ? "green" : f.status === "error" ? "red" : "gray"}" title="${esc(f.last_error || "")}">${I("zap")}${esc({ ok: "no ar", error: "com erro", pending: "aguardando", off: "desligado" }[f.status] || f.status)}</span>`;
  const gm = (g) => !g || !g.nome ? `<span class="muted">sem ficha</span>` : `★ ${esc(String(g.nota || "—"))} · ${esc(String(g.total_avaliacoes || 0))}${g.filiais ? ` <small class="muted">+${g.filiais} filiais</small>` : ""}`;
  const srcNote = () => `<p class="hint" id="adm-src">${E.source === "local" ? "Dados do servidor local (este computador)." : E.source === "supabase" ? "Dados do Supabase (produção)." : "Dados de exemplo (demonstração)."}</p>`;
  const errBox = (m) => `<div class="alert err" style="background:var(--err-50);color:var(--err-700);border-radius:10px;padding:10px 12px">${esc(m)}</div>`;

  /* ============================================================ /admin — clientes da plataforma */
  CF.route("/admin", () => {
    if (!guard()) return denied;
    return {
      title: "Clientes da plataforma", sub: "Todos os negócios cadastrados: plano, uso, ficha do Google e chatbot (Forja).", nav: "admin",
      crumbs: [{ t: "Início", href: "/" }, { t: "Plataforma" }],
      actions: `<button class="btn" id="adm-reload">${I("refresh", "sm")}Atualizar</button>`,
      html: `<div class="stack">
        <div class="grid g3" id="adm-kpis"><div class="card stat"><div class="k">Negócios</div><div class="v">…</div></div><div class="card stat"><div class="k">Clientes com cartão</div><div class="v">…</div></div><div class="card stat"><div class="k">Chatbots no ar</div><div class="v">…</div></div></div>
        <section class="card"><div class="card-h row between wrap" style="gap:10px"><div><h2>Negócios</h2><p>Clique para abrir o detalhe, atribuir itens do menu e vincular o chatbot.</p></div>
          <input class="input" id="adm-q" type="search" placeholder="Buscar por nome, slug ou e-mail" aria-label="Buscar negócio" style="max-width:320px"></div>
          <div class="card-b"><div id="adm-list"><p class="muted">Carregando…</p></div>${srcNote()}</div></section>
      </div>`,
      mount(view) {
        let items = [];
        const draw = () => {
          const q = CF.norm(view.querySelector("#adm-q").value || "");
          const rows = items.filter((b) => !q || CF.norm(`${b.name} ${b.slug} ${b.owner_email || ""}`).includes(q));
          view.querySelector("#adm-list").innerHTML = rows.length ? `<div class="table-wrap"><div class="table-scroll"><table class="t"><thead><tr><th>Negócio</th><th>Plano</th><th>Clientes</th><th>Carimbos 30 d</th><th>Visitantes 30 d</th><th>Google</th><th>Chatbot</th><th>Menu</th><th></th></tr></thead><tbody>
            ${rows.map((b) => `<tr><td><div class="row" style="gap:10px"><img src="${esc(b.logo_url || "assets/img/logo-placeholder.png")}" alt="" width="28" height="28" style="border-radius:8px;object-fit:cover"><div><b>${esc(b.name)}</b><br><small class="muted">${esc(b.slug)}${b.owner_email ? " · " + esc(b.owner_email) : ""}</small></div></div></td>
              <td>${planPill(b)}</td><td>${esc(String(b.customers || 0))}</td><td>${esc(String(b.stamps_30d || 0))}</td><td>${esc(String(b.visitors_30d || 0))}</td><td>${gm(b.gmaps)}</td><td>${forjaPill(b.forja)}</td><td>${esc(String(b.nav_count || 0))} ${b.nav_count === 1 ? "item" : "itens"}</td>
              <td><a class="btn sm" href="#/admin/${esc(b.id)}">Abrir</a></td></tr>`).join("")}</tbody></table></div></div>` : `<p class="muted">Nenhum negócio encontrado.</p>`;
          const k = view.querySelectorAll("#adm-kpis .v"); k[0].textContent = items.length; k[1].textContent = items.reduce((a, b) => a + (+b.customers || 0), 0).toLocaleString(CF.locale()); k[2].textContent = items.filter((b) => b.forja && b.forja.status === "ok").length;
          const sn = view.querySelector("#adm-src"); if (sn) sn.outerHTML = srcNote();
        };
        const load = async () => { view.querySelector("#adm-list").innerHTML = `<p class="muted">Carregando…</p>`; try { items = (await E.api("businesses")).items || []; draw(); } catch (e) { view.querySelector("#adm-list").innerHTML = errBox(e.message || "Não foi possível carregar."); } };
        view.querySelector("#adm-q").addEventListener("input", CF.debounce(draw, 150));
        view.querySelector("#adm-reload").addEventListener("click", load);
        load();
      },
    };
  });

  /* ============================================================ /admin/forja — todos os bots */
  CF.route("/admin/forja", () => {
    if (!guard()) return denied;
    return {
      title: "Chatbots (Forja)", sub: "Um bot Forja por cliente, cada um no próprio Cloudflare. Daqui você vê quem está no ar e consulta as métricas.", nav: "admin-forja",
      crumbs: [{ t: "Início", href: "/" }, { t: "Plataforma", href: "/admin" }, { t: "Chatbots" }],
      html: `<div class="stack"><section class="card"><div class="card-b"><div id="fj-list"><p class="muted">Carregando…</p></div>${srcNote()}</div></section>
        <section class="acc"><button class="acc-h" type="button"><div class="row"><span class="ico-tile gray">${I("info")}</span><div><h3>Como vincular um bot</h3><p>O que precisa estar pronto no Worker do Forja.</p></div></div>${I("chevron-down")}</button>
          <div class="acc-b"><ol class="small stack-sm" style="padding-left:18px;gap:6px"><li>Publique o bot do cliente com o Forja (<code>npx forjabot init</code>) e anote a URL do Worker (ex.: <code>https://cafe-da-praca.workers.dev</code>).</li>
            <li>No Worker, defina o segredo <code>CONTROL_PLANE_TOKEN</code> (<code>npx wrangler secret put CONTROL_PLANE_TOKEN</code>). É esse token que o painel usa para ler <code>/api/metrics</code> — nunca a senha do <code>/admin</code>.</li>
            <li>Abra o negócio em <a href="#/admin">Clientes da plataforma</a>, cole nome, URL e token em “Chatbot (Forja)” e salve. O token fica só no servidor.</li>
            <li>Atribua os itens do menu (Conversas, Leads, Base de conhecimento…) — o cliente passa a ver o grupo “Atendimento” no painel dele.</li></ol></div></section></div>`,
      mount(view) {
        E.api("businesses").then(({ items }) => {
          const rows = (items || []).filter((b) => b.forja);
          view.querySelector("#fj-list").innerHTML = rows.length ? `<div class="table-wrap"><div class="table-scroll"><table class="t"><thead><tr><th>Negócio</th><th>Bot</th><th>Endereço</th><th>Plano do bot</th><th>Estado</th><th>Último contato</th><th></th></tr></thead><tbody>
            ${rows.map((b) => `<tr><td><b>${esc(b.name)}</b></td><td>${esc(b.forja.name)}</td><td><a href="${esc(b.forja.base_url)}/admin" target="_blank" rel="noopener">${esc(b.forja.base_url.replace(/^https:\/\//, ""))}${I("external", "xs")}</a></td><td>${esc(b.forja.tier === "pro" ? "Pro" : "Free")}</td><td>${forjaPill(b.forja)}</td><td>${esc(when(b.forja.last_seen_at))}</td><td><a class="btn sm" href="#/admin/${esc(b.id)}">Abrir</a></td></tr>`).join("")}</tbody></table></div></div>` : `<p class="muted">Nenhum chatbot vinculado ainda. Abra um negócio em <a href="#/admin">Clientes da plataforma</a> para vincular.</p>`;
          const sn = view.querySelector("#adm-src"); if (sn) sn.outerHTML = srcNote();
        }).catch((e) => { view.querySelector("#fj-list").innerHTML = errBox(e.message); });
      },
    };
  });

  /* ============================================================ /admin/keys — SerpAPI e consumo */
  CF.route("/admin/keys", () => {
    if (!guard()) return denied;
    return {
      title: "Chaves e consumo", sub: "Saldo das chaves da SerpAPI (busca do Google Maps). Só aparece com o servidor local ligado — as chaves nunca saem deste computador.", nav: "admin-keys",
      crumbs: [{ t: "Início", href: "/" }, { t: "Plataforma", href: "/admin" }, { t: "Chaves" }],
      html: `<div class="stack"><section class="card"><div class="card-h row between"><div><h2>SerpAPI</h2><p>Uma linha por chave de <code>.env.local</code>. Quando uma acaba, a busca passa para a próxima.</p></div><button class="btn" id="k-reload">${I("refresh", "sm")}Atualizar</button></div>
        <div class="card-b"><div id="k-list"><p class="muted">Consultando…</p></div>${srcNote()}</div></section></div>`,
      mount(view) {
        const load = async () => {
          view.querySelector("#k-list").innerHTML = `<p class="muted">Consultando…</p>`;
          try {
            const d = await E.api("serp-status");
            view.querySelector("#k-list").innerHTML = `<div class="stat-inline" style="margin-bottom:16px"><div><b>${esc(String(d.total_restantes || 0))}</b><span>buscas restantes</span></div><div><b>${esc(String((d.chaves || []).length))}</b><span>chaves</span></div></div>
              <div class="table-wrap"><div class="table-scroll"><table class="t" style="min-width:0"><thead><tr><th>Chave</th><th>Plano</th><th>Usadas no mês</th><th>Restantes</th><th>Estado</th></tr></thead><tbody>
              ${(d.chaves || []).map((c) => `<tr><td><code>${esc(c.chave)}</code></td><td>${esc(c.plano || "—")}</td><td>${esc(String(c.usadas_mes ?? "—"))}${c.limite_mes ? " / " + esc(String(c.limite_mes)) : ""}</td><td><b>${esc(String(c.restantes ?? "—"))}</b></td><td>${c.ok ? `<span class="pill green">ok</span>` : `<span class="pill red" title="${esc(c.erro || "")}">erro</span>`}</td></tr>`).join("")}</tbody></table></div></div>`;
            const sn = view.querySelector("#adm-src"); if (sn) sn.outerHTML = srcNote();
          } catch (e) { view.querySelector("#k-list").innerHTML = errBox(e.message); }
        };
        view.querySelector("#k-reload").addEventListener("click", load); load();
      },
    };
  });

  /* ============================================================ /admin/:id — detalhe do negócio */
  CF.route("/admin/:id", ({ id }) => {
    if (!guard()) return denied;
    return {
      title: "Negócio", sub: "Uso, ficha do Google, chatbot e itens do menu deste cliente.", nav: "admin", back: "/admin",
      crumbs: [{ t: "Início", href: "/" }, { t: "Plataforma", href: "/admin" }, { t: "Negócio" }],
      html: `<div class="stack" id="adm-detail"><p class="muted">Carregando…</p></div>`,
      mount(view) {
        let b = null, nav = [];
        const root = view.querySelector("#adm-detail");
        const paint = () => {
          const f = b.forja, m = f && f.last_metrics;
          root.innerHTML = `
          <div class="row wrap" style="gap:12px;align-items:center"><img src="${esc(b.logo_url || "assets/img/logo-placeholder.png")}" alt="" width="44" height="44" style="border-radius:10px;object-fit:cover"><div><h2 style="font-size:20px">${esc(b.name)}</h2><small class="muted">${esc(b.slug)}${b.owner_email ? " · " + esc(b.owner_email) : ""} · desde ${esc(when(b.created_at))}</small></div><div style="margin-left:auto">${planPill(b)}</div></div>
          <div class="stat-inline card" style="padding:18px 24px"><div><b>${esc(String(b.customers || 0))}</b><span>clientes</span></div><div><b>${esc(String(b.stamps_total || 0))}</b><span>carimbos</span></div><div><b>${esc(String(b.redeemed_total || 0))}</b><span>recompensas</span></div><div><b>${esc(String(b.visitors_30d || 0))}</b><span>visitantes 30 d</span></div><div><b>${esc(String(b.leads || 0))}</b><span>contatos Wi-Fi</span></div><div><b>${esc(String(b.staff || 0))}</b><span>funcionários</span></div><div><b>${esc(String(b.webhooks || 0))}</b><span>webhooks</span></div></div>

          <section class="card"><div class="card-h"><h2>Ficha do Google</h2><p>O que o cliente trouxe do Google Maps (principal e filiais).</p></div>
            <div class="card-b">${gmapsHtml(b.gmaps)}</div></section>

          <section class="card"><div class="card-h row between wrap" style="gap:10px"><div><h2>Chatbot (Forja)</h2><p>Bot de IA do cliente no Cloudflare. O token fica só no servidor.</p></div>${f ? forjaPill(f) : ""}</div>
            <div class="card-b stack-sm" style="gap:14px">
              ${f ? `<div class="row wrap" style="gap:16px;align-items:center"><div><b>${esc(f.name)}</b><br><a href="${esc(f.base_url)}/admin" target="_blank" rel="noopener" class="small">${esc(f.base_url)}/admin ${I("external", "xs")}</a></div>
                <div class="small muted">Plano do bot: <b>${esc(f.tier === "pro" ? "Pro" : "Free")}</b> · Token: <b>${f.has_token ? "cadastrado" : "falta"}</b> · Último contato: <b>${esc(when(f.last_seen_at))}</b></div>
                <div class="row" style="gap:8px;margin-left:auto"><select class="select" id="fj-range" aria-label="Período"><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="all">Tudo</option></select><button class="btn" id="fj-poll">${I("refresh", "sm")}Consultar agora</button></div></div>
                ${f.last_error ? errBox(f.last_error) : ""}
                <div class="stat-inline" id="fj-metrics">${m ? metricsHtml(m) : `<p class="muted small">Ainda sem métricas. Clique em “Consultar agora”.</p>`}</div>` : `<p class="muted">Este negócio ainda não tem chatbot vinculado.</p>`}
              <details class="adm-form"><summary class="btn ghost sm" style="display:inline-flex">${I(f ? "pencil" : "plus", "sm")}${f ? "Alterar vínculo" : "Vincular um bot Forja"}</summary>
                <form class="grid g2" id="fj-form" style="gap:12px;margin-top:12px">
                  <div class="field"><label for="fj-name">Nome do bot</label><input class="input" id="fj-name" required maxlength="60" value="${esc(f ? f.name : "")}" placeholder="Ex.: Robit do Café da Praça"></div>
                  <div class="field"><label for="fj-url">URL do Worker (https)</label><input class="input" id="fj-url" type="url" required value="${esc(f ? f.base_url : "")}" placeholder="https://cafe-da-praca.workers.dev"></div>
                  <div class="field"><label for="fj-token">CONTROL_PLANE_TOKEN ${f && f.has_token ? "(deixe em branco para manter)" : ""}</label><input class="input" id="fj-token" type="password" autocomplete="new-password" placeholder="${f && f.has_token ? "••••••••" : "cole o token do Worker"}"></div>
                  <div class="field"><label for="fj-tier">Plano do bot</label><select class="select" id="fj-tier"><option value="free" ${f && f.tier === "free" ? "selected" : ""}>Free</option><option value="pro" ${f && f.tier === "pro" ? "selected" : ""}>Pro</option></select></div>
                  <div class="row" style="grid-column:1/-1;justify-content:flex-end;gap:8px">${f ? `<button class="btn danger" type="button" id="fj-rm">${I("trash", "sm")}Desvincular</button>` : ""}<button class="btn primary" type="submit">${I("check", "sm")}Salvar vínculo</button></div>
                </form></details>
            </div></section>

          <section class="card"><div class="card-h row between wrap" style="gap:10px"><div><h2>Menu do cliente</h2><p>Itens que aparecem no menu lateral deste cliente, em grupos (ex.: “Atendimento”). Até 12.</p></div>
              <div class="row" style="gap:8px"><button class="btn sm" id="nv-preset" ${f ? "" : "disabled title='Vincule o chatbot antes'"}>${I("sparkles", "sm")}Pacote Forja padrão</button><button class="btn sm" id="nv-add">${I("plus", "sm")}Adicionar item</button></div></div>
            <div class="card-b stack-sm" style="gap:10px"><div id="nv-rows"></div>
              <div class="row between wrap" style="gap:8px;margin-top:6px"><span class="hint">Tipos: <b>Forja</b> abre uma tela do painel do bot · <b>Link</b> abre um endereço https · <b>Rota</b> abre uma tela deste painel (ex.: /integrations).</span><button class="btn primary" id="nv-save">${I("check", "sm")}Salvar menu</button></div></div></section>
          ${srcNote()}`;
          drawNav();
          // Forja
          const pf = root.querySelector("#fj-poll"); if (pf) pf.addEventListener("click", async () => { pf.disabled = true; try { const r = await E.api("forja-metrics", { id: b.id, range: root.querySelector("#fj-range").value }); if (!r.ok) throw new Error(r.error || "Sem resposta."); b.forja = Object.assign(b.forja || {}, r.instance, { last_metrics: r.data, last_error: null, has_token: true }); CF.toast("Métricas atualizadas."); paint(); } catch (e) { CF.toast(e.message || "Não foi possível consultar o bot.", "err"); pf.disabled = false; } });
          root.querySelector("#fj-form").addEventListener("submit", async (e) => {
            e.preventDefault(); const g = (s) => root.querySelector(s);
            try { const r = await E.api("forja-upsert", {}, { id: b.id, name: g("#fj-name").value.trim(), base_url: g("#fj-url").value.trim(), token: g("#fj-token").value, tier: g("#fj-tier").value }); b.forja = r.item; CF.toast("Chatbot vinculado."); paint(); }
            catch (err) { CF.toast(err.message || "Não foi possível salvar.", "err"); }
          });
          const rm = root.querySelector("#fj-rm"); if (rm) rm.addEventListener("click", () => CF.confirm({ title: "Desvincular o chatbot?", text: "O token é apagado e os itens do menu do tipo Forja saem do painel do cliente. O bot continua existindo no Cloudflare.", ok: "Desvincular", danger: true, async onOk() { try { await E.api("forja-remove", {}, { id: b.id }); b.forja = null; nav = nav.filter((n) => n.kind !== "forja"); CF.toast("Chatbot desvinculado."); paint(); } catch (e) { CF.toast(e.message, "err"); } } }));
          // menu
          root.querySelector("#nv-add").addEventListener("click", () => { if (nav.length >= 12) return CF.toast("Limite de 12 itens.", "err"); nav.push({ group_label: "Atendimento", label: "", icon: "zap", kind: f ? "forja" : "url", target: f ? "overview" : "", active: true }); drawNav(); const last = root.querySelector("#nv-rows .adm-nav-row:last-child input"); last && last.focus(); });
          root.querySelector("#nv-preset").addEventListener("click", () => { E.PRESET_FORJA.forEach(([label, icon, target]) => { if (!nav.some((n) => n.kind === "forja" && n.target === target) && nav.length < 12) nav.push({ group_label: "Atendimento", label, icon, kind: "forja", target, active: true }); }); drawNav(); });
          root.querySelector("#nv-save").addEventListener("click", async () => {
            const bad = nav.find((n) => !n.label.trim() || !n.target.trim() || (n.kind === "url" && !/^https:\/\//.test(n.target)) || (n.kind === "route" && !/^\//.test(n.target)));
            if (bad) return CF.toast("Preencha rótulo e destino de todos os itens (links só https://, rotas começam com /).", "err");
            try { const r = await E.api("set-nav", {}, { id: b.id, items: nav }); nav = r.items || nav; b.nav = nav; CF.toast("Menu do cliente salvo."); if (E.isDemo() || (CF.bizId && CF.bizId === b.id)) { CF.state.ext.nav = nav.map(E.fromRow); CF.repaintShell && CF.repaintShell(); } drawNav(); }
            catch (e) { CF.toast(e.message || "Não foi possível salvar o menu.", "err"); }
          });
        };
        const drawNav = () => {
          const box = root.querySelector("#nv-rows");
          box.innerHTML = nav.length ? nav.map((n, i) => `<div class="adm-nav-row" data-i="${i}">
              <input class="input sm" data-k="group_label" value="${esc(n.group_label || "Atendimento")}" aria-label="Grupo" placeholder="Grupo">
              <input class="input sm" data-k="label" value="${esc(n.label)}" aria-label="Rótulo" placeholder="Rótulo no menu" maxlength="40">
              <select class="select sm" data-k="icon" aria-label="Ícone">${E.ICONS.map((ic) => `<option value="${ic}" ${ic === n.icon ? "selected" : ""}>${ic}</option>`).join("")}</select>
              <select class="select sm" data-k="kind" aria-label="Tipo"><option value="forja" ${n.kind === "forja" ? "selected" : ""}>Forja</option><option value="url" ${n.kind === "url" ? "selected" : ""}>Link</option><option value="route" ${n.kind === "route" ? "selected" : ""}>Rota</option></select>
              ${n.kind === "forja" ? `<select class="select sm" data-k="target" aria-label="Tela do bot">${E.FORJA_VIEWS.map(([v, t]) => `<option value="${v}" ${v === n.target ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>` : `<input class="input sm" data-k="target" value="${esc(n.target)}" aria-label="Destino" placeholder="${n.kind === "url" ? "https://…" : "/integrations"}">`}
              <div class="row" style="gap:4px"><label class="check small" title="Ativo"><input type="checkbox" data-k="active" ${n.active !== false ? "checked" : ""}><span class="sr-only">Ativo</span></label>
                <button class="icon-btn" type="button" data-mv="-1" aria-label="Subir" ${i === 0 ? "disabled" : ""}>${I("chevron-up")}</button><button class="icon-btn" type="button" data-mv="1" aria-label="Descer" ${i === nav.length - 1 ? "disabled" : ""}>${I("chevron-down")}</button><button class="icon-btn" type="button" data-del aria-label="Remover item">${I("trash")}</button></div></div>`).join("") : `<p class="muted">Nenhum item. Use “Pacote Forja padrão” ou “Adicionar item”.</p>`;
          box.querySelectorAll(".adm-nav-row").forEach((row) => {
            const i = +row.dataset.i;
            row.addEventListener("input", (e) => { const k = e.target.dataset.k; if (!k) return; nav[i][k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; if (k === "kind") { nav[i].target = e.target.value === "forja" ? "overview" : ""; drawNav(); } });
            row.addEventListener("change", (e) => { const k = e.target.dataset.k; if (k === "kind" || k === "icon" || (k === "target" && e.target.tagName === "SELECT") || k === "active") { nav[i][k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; if (k === "kind") { nav[i].target = e.target.value === "forja" ? "overview" : ""; drawNav(); } } });
            row.addEventListener("click", (e) => { const mv = e.target.closest("[data-mv]"); if (mv) { const j = i + +mv.dataset.mv; [nav[i], nav[j]] = [nav[j], nav[i]]; return drawNav(); } if (e.target.closest("[data-del]")) { nav.splice(i, 1); drawNav(); } });
          });
        };
        E.api("business", { id }).then(({ item }) => { b = item; nav = (b.nav || []).map((n) => ({ id: n.id, group_label: n.group_label || "Atendimento", label: n.label, icon: n.icon || "zap", kind: n.kind, target: n.target, active: n.active !== false })); paint(); })
          .catch((e) => { root.innerHTML = errBox(e.message || "Não foi possível carregar."); });
      },
    };
  });

  const metricsHtml = (m) => `<div><b>${esc(String(m.conversations ?? 0))}</b><span>conversas</span></div><div><b>${esc(String(m.messages ?? 0))}</b><span>mensagens</span></div><div><b>${esc(String(m.leads ?? 0))}</b><span>leads</span></div><div><b>${esc(String(m.health_score ?? 100))}%</b><span>sem precisar de humano</span></div><div><small class="muted">período: ${esc({ "7d": "7 dias", "30d": "30 dias", all: "tudo" }[m.range] || m.range || "7 dias")}</small></div>`;
  const gmapsHtml = (g) => {
    if (!g || !g.main) return `<p class="muted">O cliente ainda não buscou a ficha do Google (Configuração inicial › Google Maps).</p>`;
    const one = (k, f) => `<div class="list-row" style="gap:14px"><span class="ico-tile ${k === "main" ? "brand" : "gray"}">${I("pin")}</span><div style="flex:1"><b>${esc(f.nome || "—")}</b> <small class="muted">${k === "main" ? "principal" : "filial"}${f.categoria ? " · " + esc(f.categoria) : ""}</small><br><small class="muted">${esc(f.endereco || "")}</small></div>
      <div class="small" style="text-align:right">★ <b>${esc(String(f.nota ?? "—"))}</b> · ${esc(String(f.total_avaliacoes ?? 0))} avaliações${f.telefone ? `<br><span class="muted">${esc(f.telefone)}</span>` : ""}</div>
      ${f.link || f.place_id ? `<a class="icon-btn" href="${esc(f.link || "https://www.google.com/maps/place/?q=place_id:" + encodeURIComponent(f.place_id))}" target="_blank" rel="noopener" aria-label="Abrir no Google Maps">${I("external")}</a>` : ""}</div>`;
    return Object.keys(g).sort((a) => (a === "main" ? -1 : 1)).map((k) => one(k, g[k] || {})).join("");
  };
})();
