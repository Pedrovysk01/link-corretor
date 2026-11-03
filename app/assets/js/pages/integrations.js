/* Integrações: avisos para outros sistemas (webhooks) — n8n, Make, Zapier, CRM, automação de WhatsApp…
   Com o banco (data.js), tudo vai para a tabela webhooks e as funções webhook_test / webhook_rotate_secret; o envio, a
   assinatura (HMAC-SHA256) e o reenvio saem do próprio banco (migração 20261023). Sem servidor: demonstração local. */
(function () {
  "use strict";
  const CF = window.CF, I = CF.icon, esc = CF.esc;
  const EVENTS = [
    ["customer.created", "Cliente novo", "Pegou o cartão pela sua página (ou foi cadastrado no painel)."],
    ["stamp.added", "Carimbo", "Carimbo dado no painel, no leitor, de boas-vindas ou por comprovante."],
    ["reward.redeemed", "Recompensa resgatada", "Completou o cartão e resgatou o prêmio."],
    ["stamp.undone", "Carimbo desfeito", "Um carimbo foi desfeito no painel."],
    ["stamp_request.created", "Pedido de carimbo", "Boas-vindas ou comprovante pelo WhatsApp esperando você."],
    ["stamp_request.approved", "Pedido aprovado", "Você aprovou um pedido de carimbo."],
    ["stamp_request.rejected", "Pedido recusado", "Você recusou um pedido de carimbo."],
    ["lead.wifi", "Contato do Wi-Fi", "Deixou nome e WhatsApp para pegar a senha do Wi-Fi."],
  ];
  const EV = Object.fromEntries(EVENTS.map((e) => [e[0], e[1]])); EV["webhook.test"] = "Teste";
  const urlOk = (u) => /^https:\/\/([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}(:\d{2,5})?([/?#]\S*)?$/i.test(u || "") && !/\.(local|localhost|internal|lan|home|corp|intranet|test|invalid)(:\d+)?([/?#]|$)/i.test(u);
  const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

  // modo demonstração (sem servidor): guarda neste navegador; data.js troca tudo por chamadas ao banco
  CF.webhooks = {
    demo: true,
    list: async () => CF.state.webhooks || [],
    add: async (url, events) => { if ((CF.state.webhooks || []).length >= 5) return { error: "Máximo de 5 webhooks." };
      const w = { id: CF.uid(), url, events, secret: hex(24), active: true, fails: 0, lastStatus: null, lastError: null, lastAt: null, created: new Date().toISOString() };
      CF.update((s) => (s.webhooks = (s.webhooks || []).concat([w]))); return { ok: true, item: w }; },
    update: async (id, patch) => { CF.update((s) => (s.webhooks || []).forEach((w) => { if (w.id === id) Object.assign(w, patch); })); return { ok: true }; },
    remove: async (id) => { CF.update((s) => (s.webhooks = (s.webhooks || []).filter((w) => w.id !== id))); return { ok: true }; },
    test: async (id) => { const now = new Date().toISOString();
      CF.update((s) => { s.webhookLog = [{ id: CF.uid(), webhookId: id, event: "webhook.test", status: "ok", code: 200, attempts: 1, error: "", at: now }].concat(s.webhookLog || []).slice(0, 50); (s.webhooks || []).forEach((w) => { if (w.id === id) Object.assign(w, { lastStatus: 200, lastAt: now, lastError: null }); }); });
      return { ok: true }; },
    rotate: async (id) => { const s2 = hex(24); CF.update((s) => (s.webhooks || []).forEach((w) => { if (w.id === id) w.secret = s2; })); return { ok: true, secret: s2 }; },
    deliveries: async (id) => (CF.state.webhookLog || []).filter((d) => d.webhookId === id),
  };

  const ago = (iso) => { if (!iso) return ""; const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000)); return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : CF.fmtDate(iso); };
  const statusPill = (w) => !w.active ? `<span class="pill gray">Pausado</span>` : w.lastStatus == null ? `<span class="pill gray">Sem envios ainda</span>`
    : w.lastStatus >= 200 && w.lastStatus < 300 ? `<span class="pill ok">Entregando · ${w.lastStatus}</span>` : `<span class="pill warn" title="${esc(w.lastError || "")}">Com erro · ${w.lastStatus || "sem resposta"}</span>`;
  const evList = (w) => (w.events && w.events.length ? w.events.map((e) => EV[e] || e).join(", ") : "Todos os eventos");
  const SAMPLE = JSON.stringify({ id: "3f2c…", event: "stamp.added", created_at: "2026-10-09T15:04:05Z", business: { id: "…", name: "Café da Praça", slug: "cafe-da-praca" },
    data: { customer: { id: "…", name: "Ana Clara", code: "K7P4QX", phone: "48999990000", email: null }, qty: 1, source: "panel", stamps: 3, total: 3, redeemed: 0, full: false, card: { name: "Café da Praça", stamps: 8, reward: "Um café grátis" } } }, null, 2);
  const VERIFY = `// Node: confira a assinatura antes de usar o aviso
const [t, v1] = req.headers["x-scf-signature"].split(",").map((p) => p.split("=")[1]);
const mac = crypto.createHmac("sha256", SEGREDO).update(t + "." + corpoBruto).digest("hex");
if (mac !== v1 || Math.abs(Date.now() / 1000 - t) > 300) return res.status(401).end();`;

  CF.route("/integrations", () => ({
    title: "Integrações", sub: "Envie os eventos do seu cartão para outros sistemas: n8n, Make, Zapier, CRM ou automação de WhatsApp.", nav: "settings",
    crumbs: [{ t: "Início", href: "/" }, { t: "Integrações" }],
    html: `<div class="stack">
      <section class="card"><div class="card-h row between"><div><h2>Avisos para outros sistemas (webhook)</h2><p>A cada evento escolhido, o Seu Cliente Fiel manda um aviso (JSON) para o endereço que você cadastrar. Até 5 endereços.</p></div></div>
        <div class="card-b stack-sm" style="gap:16px"><div id="wh-list"><p class="muted">Carregando…</p></div>
          <form class="wh-new stack-sm" id="wh-new" style="gap:10px"><div class="field"><label for="wh-url">Endereço do webhook</label><input class="input" id="wh-url" type="url" inputmode="url" placeholder="https://hooks.zapier.com/hooks/catch/…" autocomplete="off" spellcheck="false"></div>
            <div class="field"><label id="wh-ev-l">Eventos</label><span class="hint">Deixe todos marcados para receber tudo.</span><div class="wh-evs" role="group" aria-labelledby="wh-ev-l">${EVENTS.map(([k, t, d]) => `<label class="check"><input type="checkbox" value="${k}" checked><span><b>${esc(t)}</b><small class="muted">${esc(d)}</small></span></label>`).join("")}</div></div>
            <div class="row" style="justify-content:flex-end"><button class="btn primary" id="wh-add" type="submit">${I("plus", "sm")}Adicionar webhook</button></div></form></div></section>
      <section class="acc" id="wh-fmt"><button class="acc-h" type="button"><div class="row"><span class="ico-tile gray">${I("file")}</span><div><h3>Formato do aviso e como conferir a assinatura</h3><p>Para quem vai configurar o sistema que recebe.</p></div></div>${I("chevron-down")}</button>
        <div class="acc-b"><ul class="wh-spec small">
            <li><span>Cada aviso é um POST em JSON, como no exemplo abaixo.</span></li>
            <li><code>X-SCF-Event</code> <span>o nome do evento.</span></li>
            <li><code>X-SCF-Delivery</code> <span>id único do aviso: use para não processar o mesmo duas vezes.</span></li>
            <li><code>X-SCF-Signature: t=…,v1=…</code> <span>HMAC-SHA256 do segredo sobre “t”, um ponto e o corpo.</span></li>
            <li><span>Se o destino não responder 2xx, tentamos de novo até 5 vezes (1, 4, 9 e 16 minutos depois).</span></li></ul>
          <pre class="wh-code">${esc(SAMPLE)}</pre><pre class="wh-code">${esc(VERIFY)}</pre></div></section></div>`,
    mount(view) {
      const g = (s) => view.querySelector(s), list = g("#wh-list");
      const errText = (e) => { const m = String((e && (e.message || e.error)) || e || ""); return /url_invalida/.test(m) ? "Use um endereço https:// com domínio (ex.: https://hooks.zapier.com/…)." : /limite_de_webhooks/.test(m) ? "Máximo de 5 webhooks." : /schema cache|does not exist|not find/i.test(m) ? "Esta função precisa da atualização do banco (Atualizar banco (Supabase).bat)." : m || "Não foi possível agora."; };
      let items = [];
      const draw = () => {
        list.innerHTML = items.length ? `<ul class="wh-items">${items.map((w) => `<li class="wh-item" data-id="${esc(w.id)}"><div class="wh-main"><code class="wh-url" title="${esc(w.url)}">${esc(w.url)}</code><small class="muted">${esc(evList(w))}${w.lastAt ? ` · último envio ${ago(w.lastAt)}` : ""}</small></div>
          <div class="wh-side">${statusPill(w)}<div class="wh-acts"><button type="button" class="btn sm" data-wh="test">${I("send", "sm")}Testar</button><button type="button" class="btn sm" data-wh="log">${I("list", "sm")}Entregas</button><button type="button" class="btn sm" data-wh="secret">${I("key", "sm")}Segredo</button>
            <button type="button" class="btn sm" data-wh="toggle">${w.active ? `${I("pause", "sm")}Pausar` : `${I("play", "sm")}Ativar`}</button><button type="button" class="btn sm danger" data-wh="rm" aria-label="Remover webhook">${I("trash", "sm")}</button></div></div></li>`).join("")}</ul>`
          : `<p class="muted">Nenhum webhook ainda. Cadastre abaixo o endereço que o seu sistema (n8n, Make, Zapier…) deu para receber avisos.</p>`;
      };
      const load = async () => { const r = await CF.webhooks.list(); if (r && r.error) { list.innerHTML = `<div class="alert warn">${I("warn")}<div>${esc(errText(r.error))}</div></div>`; return; } items = r || []; draw(); };
      load();
      g("#wh-new").addEventListener("submit", async (e) => {
        e.preventDefault(); const url = g("#wh-url").value.trim(), events = [...view.querySelectorAll(".wh-evs input:checked")].map((x) => x.value);
        if (!urlOk(url)) return CF.toast("Use um endereço https:// com domínio (ex.: https://hooks.zapier.com/…).", "err");
        if (!events.length) return CF.toast("Marque pelo menos um evento.", "err");
        const btn = g("#wh-add"); btn.disabled = true;
        const r = await CF.webhooks.add(url, events.length === EVENTS.length ? [] : events); btn.disabled = false;
        if (!r || r.error) return CF.toast(errText(r && r.error), "err");
        g("#wh-url").value = ""; CF.toast("Webhook adicionado. Toque em “Testar” para ver se chega."); load();
      });
      list.addEventListener("click", async (e) => {
        const b = e.target.closest("[data-wh]"); if (!b) return; const id = b.closest("[data-id]").dataset.id, w = items.find((x) => x.id === id), act = b.dataset.wh;
        if (act === "test") { b.disabled = true; const r = await CF.webhooks.test(id); b.disabled = false; if (!r || r.error) return CF.toast(errText(r && r.error), "err"); CF.toast(CF.webhooks.demo ? "Teste enviado (demonstração)." : "Teste enviado. Em alguns segundos aparece em Entregas."); return setTimeout(load, CF.webhooks.demo ? 0 : 2500); }
        if (act === "toggle") { const r = await CF.webhooks.update(id, { active: !w.active }); if (!r || r.error) return CF.toast(errText(r && r.error), "err"); return load(); }
        if (act === "rm") return CF.confirm({ title: "Remover este webhook?", text: "O endereço para de receber os avisos.", ok: "Remover", danger: true, async onOk() { const r = await CF.webhooks.remove(id); if (!r || r.error) return CF.toast(errText(r && r.error), "err"); CF.toast("Webhook removido."); load(); } });
        if (act === "secret") {
          const ov = CF.modal({ title: "Segredo do webhook", sub: "Use no sistema que recebe para conferir que o aviso veio mesmo do Seu Cliente Fiel. Não compartilhe.",
            body: `<div class="row" style="gap:8px"><code class="wh-secret" id="wh-s">${esc(w.secret || "")}</code><button type="button" class="btn sm" id="wh-copy">${I("copy", "sm")}Copiar</button></div><p class="small muted" style="margin-top:10px">Se o segredo vazou, troque: o antigo para de valer na hora.</p>`,
            foot: `<button class="btn" data-close>Fechar</button><button class="btn danger" id="wh-rot">${I("refresh", "sm")}Trocar segredo</button>` });
          ov.querySelector("#wh-copy").addEventListener("click", async () => CF.toast((await CF.copy(ov.querySelector("#wh-s").textContent)) ? "Segredo copiado." : "Não foi possível copiar.", "ok"));
          ov.querySelector("#wh-rot").addEventListener("click", async () => { const r = await CF.webhooks.rotate(id); if (!r || r.error) return CF.toast(errText(r && r.error), "err"); ov.querySelector("#wh-s").textContent = r.secret; w.secret = r.secret; CF.toast("Segredo trocado. Atualize no sistema que recebe."); });
          return;
        }
        if (act === "log") {
          const r = await CF.webhooks.deliveries(id); if (r && r.error) return CF.toast(errText(r.error), "err");
          const st = (d) => d.status === "ok" ? `<span class="pill ok">Entregue</span>` : d.status === "retry" ? `<span class="pill warn">Vai tentar de novo</span>` : d.status === "failed" ? `<span class="pill warn">Falhou</span>` : `<span class="pill gray">Enviando</span>`;
          CF.drawer({ title: "Entregas", sub: w.url, body: (r || []).length ? `<div class="table-wrap"><table class="t wh-log"><thead><tr><th>Quando</th><th>Evento</th><th>Situação</th><th>Resposta</th></tr></thead><tbody>${r.map((d) => `<tr><td>${esc(ago(d.at))}</td><td>${esc(EV[d.event] || d.event)}</td><td>${st(d)}${d.attempts > 1 ? ` <small class="muted">${d.attempts}×</small>` : ""}</td><td>${d.code ? esc(String(d.code)) : "—"}${d.error ? ` <small class="muted">${esc(d.error)}</small>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhuma entrega ainda. Toque em “Testar”.</p>` });
        }
      });
    },
  }));
  CF.actions.integrations = () => { const m = document.getElementById("user-menu"); if (m) m.classList.add("hide"); CF.go("/integrations"); };
})();
