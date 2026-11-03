/* Dados do painel da plataforma. Ordem: servidor LOCAL (tools/dev-server.py → /api/admin, service_role, só neste computador e com
   CF_ADMIN_LOCAL=1) → Supabase (login + RPCs admin_* protegidas por is_platform_admin; funções admin-api e forja-proxy)
   → demonstração (dados de exemplo em memória, para ver as telas sem servidor).
   A.api(action, params, body) · A.source = "local" | "supabase" | "demo" · A.login/A.logout/A.session */
(function () {
  "use strict";
  const A = (window.A = { source: null, user: null, remote: null });
  const cfg = window.CF_SUPABASE || {};
  const sb = cfg.url && cfg.anonKey && window.supabase ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
  A.sb = sb; A.online = !!sb;

  /* ---------------- demonstração ---------------- */
  const day = 864e5, now = Date.now();
  const demoBiz = (id, name, slug, plan, trial, created, billing, extra = {}) => Object.assign({
    id, name, slug, plan, trial, created_at: new Date(now - created * day).toISOString(), logo_url: "../assets/img/logo-placeholder.png", owner_email: slug + "@exemplo.com.br",
    tagline: "O melhor da região", address: "Rua das Flores, 120 · Centro", tz: "America/Sao_Paulo", currency: "BRL", type: "Café", page_color: "#fef0c7",
    customers: 36, stamps_30d: 120, redeemed_30d: 9, visitors_30d: 210, stamps_total: 980, redeemed_total: 61, leads: 7, staff: 2, webhooks: 1, nav_count: 2,
    gmaps: { main: { nome: name, nota: 4.7, total_avaliacoes: 132, categoria: "Cafeteria", endereco: "Rua das Flores, 120", place_id: "demo" } },
    cards: [{ id: id + "-c1", name, stamps: 8, header: "RECOMPENSAS", reward_text: "Colete carimbos e ganhe recompensas!", reward_label: "Um café por conta da casa", active: true }],
    items: [{ id: id + "-m", type: "menu", title: "Café", body: "", label: "", url: "", items: [{ name: "Espresso", price: "8,00" }, { name: "Cappuccino", price: "12,00" }], icon_only: false, onsite: false },
      { id: id + "-w", type: "contact", title: "Falar no WhatsApp", url: "(48) 99999-0000", icon_only: true, items: [] }],
    nav: [], forja: null, billing, settings: { welcome: { mode: "auto", qty: 1 }, receipts: { on: true, phone: "" } },
  }, extra);
  const D = { businesses: [
      demoBiz("b1", "Café da Praça", "cafe-da-praca", "pro", false, 120, { status: "active", interval: "month", period_end: new Date(now + 12 * day).toISOString(), cancel_at_end: false, customer_id: "cus_demo1", subscription_id: "sub_demo1" }),
      demoBiz("b2", "Barbearia Norte", "barbearia-norte", "pro", false, 80, { status: "active", interval: "year", period_end: new Date(now + 200 * day).toISOString(), cancel_at_end: true, customer_id: "cus_demo2", subscription_id: "sub_demo2" }, { customers: 210, type: "Barbearia" }),
      demoBiz("b3", "Pet Shop Amigo", "pet-shop-amigo", "pro", false, 40, { status: "past_due", interval: "month", period_end: new Date(now - 3 * day).toISOString(), cancel_at_end: false, customer_id: "cus_demo3", subscription_id: "sub_demo3" }, { customers: 58, type: "Pet shop" }),
      demoBiz("b4", "Loja Tech", "demonstrativo", "free", true, 5, null, { customers: 12, stamps_30d: 20, forja: { id: "f1", name: "Robit", base_url: "https://robit.workers.dev", tier: "pro", status: "ok", last_seen_at: new Date(now - 3600e3).toISOString(), last_metrics: { range: "7d", leads: 12, messages: 348, conversations: 57, health_score: 93 }, has_token: true }, nav: [{ id: "n1", group_label: "Atendimento", label: "Conversas do chatbot", icon: "message", kind: "forja", target: "conversations", active: true }] }),
      demoBiz("b5", "Salão Bela", "salao-bela", "free", false, 300, { status: "canceled", interval: "month", period_end: new Date(now - 40 * day).toISOString(), cancel_at_end: false, customer_id: "cus_demo5", subscription_id: "sub_demo5" }, { customers: 90, type: "Salão" }),
      demoBiz("b6", "Barbearia Exemplo (em preparação)", "barbearia-exemplo", "free", true, 1, null, { customers: 0, stamps_30d: 0, redeemed_30d: 0, visitors_30d: 0, stamps_total: 0, redeemed_total: 0, leads: 0, staff: 0, webhooks: 0, nav_count: 0, type: "Barbearia",
        owner_email: "prospeccao@seuclientefiel.com.br", prospect: { status: "preview", source: "prospector", segmento: "Barbearia", grupo: "Beleza", whatsapp: "5547999990000", rating: 4.9, reviews: 218 }, claim: { created_at: new Date(now - day).toISOString(), expires_at: new Date(now + 59 * day).toISOString(), claimed_at: null } }),
      demoBiz("b7", "Pizzaria Exemplo (conta própria)", "pizzaria-exemplo", "free", true, 1, null, { customers: 0, stamps_30d: 0, redeemed_30d: 0, visitors_30d: 0, stamps_total: 0, redeemed_total: 0, leads: 0, staff: 0, webhooks: 0, nav_count: 0, type: "Pizzaria",
        owner_email: "pizzaria-exemplo@seuclientefiel.com.br", prospect: { status: "preview", source: "google-maps", segmento: "Pizzaria", grupo: "Alimentação", whatsapp: "5547999991111", rating: 4.8, reviews: 120 }, claim: { created_at: new Date(now - day).toISOString(), expires_at: new Date(now + 59 * day).toISOString(), claimed_at: null } }),
    ], audit: [{ id: 1, at: new Date(now - 2 * day).toISOString(), action: "set_plan", business: "Café da Praça", by: "voce@exemplo.com", details: { plan: "pro" } }],
    // sugestões de exemplo (no real: tools/ficha_jev.py com os dados do site + Jev)
    sugs: [
      { id: "s1", business_id: "b7", kind: "reward", title: "Prêmio do cartão: Uma pizza broto", current: { reward_label: "Um café por conta da casa", stamps: 8 }, proposal: { reward_label: "Uma pizza broto", stamps: 8 }, confidence: 0.72, source: "jev", evidence: "Exemplo: opções com os preços do site. Jev: Uma pizza grátis 5% · Uma pizza broto 72% · Um refrigerante 2 L 13%.", status: "open", created_at: new Date(now - day).toISOString() },
      { id: "s2", business_id: "b7", kind: "item", title: "Adicionar à página: Taxa de entrega", current: null, proposal: { type: "menu", title: "Taxa de entrega", body: "Por bairro.", label: "", url: "", items: [{ name: "Centro", price: "7,00" }, { name: "Praia", price: "6,00" }, { name: "Morro", price: "9,00" }] }, confidence: 0.82, source: "jev", evidence: "Exemplo: 3 linhas lidas do site. Jev: útil 82% · muda logo 47% · concorre com o cartão 4%.", status: "open", created_at: new Date(now - day).toISOString() },
      { id: "s3", business_id: "b7", kind: "note", title: "Já tem programa de pontos próprio", current: null, proposal: {}, confidence: 0.98, source: "jev", evidence: "Exemplo: o site de delivery tem a página “Programa de Fidelidade”.", status: "open", created_at: new Date(now - day).toISOString() },
      { id: "s4", business_id: "b7", kind: "note", title: "Horário do site diferente do Google", current: null, proposal: {}, confidence: null, source: "regra", evidence: "Exemplo: Google 18:00–00:00; site 17:50–23:50.", status: "open", created_at: new Date(now - day).toISOString() },
    ],
    pay: { provider: "stripe", prices: { month: 79, year: 708 }, pix: { key: "", name: "", city: "" }, grace_days: 5 },
    links: [{ id: "l1", business_id: "b1", provider: "stripe", kind: "subscription", interval: "month", method: "card", amount: 79, url: "https://buy.stripe.com/test_demo1", status: "paid", origin: "owner", created_at: new Date(now - 120 * day).toISOString(), paid_at: new Date(now - 120 * day).toISOString() },
      { id: "l2", business_id: "b3", provider: "pix", kind: "one_time", interval: "month", method: "pix", amount: 79, url: "../pagar/?c=DEMONSTRACAO0000000000", status: "open", origin: "admin", note: "pediu para pagar por Pix", created_at: new Date(now - day).toISOString(), expires_at: new Date(now + 29 * day).toISOString() }],
    customers: (bid) => Array.from({ length: 8 }, (_, i) => ({ id: bid + "-u" + i, name: ["Ana Beatriz", "Carlos Mendes", "Juliana Rocha", "Marcos Lima", "Fernanda Souza", "Pedro Alves", "Lúcia Dias", "Rafael Costa"][i], email: `cliente${i}@exemplo.com.br`, phone: "4899999000" + i, code: "K7P4Q" + i, stamps: i % 8, total: 4 + i, created_at: new Date(now - (i + 1) * 9 * day).toISOString(), last: new Date(now - i * 2 * day).toISOString() })),
  };
  const find = (id) => { const b = D.businesses.find((x) => x.id === id); if (!b) throw new Error("Negócio não encontrado."); return b; };
  const log = (action, b, details) => D.audit.unshift({ id: D.audit.length + 1, at: new Date().toISOString(), action, business: b && b.name, by: "demo", details });
  const demoStats = () => { const P = D.businesses.filter((b) => b.prospect && b.prospect.status === "preview"), B = D.businesses.filter((b) => !P.includes(b)), S = B.filter((b) => b.billing && ["active", "trialing", "past_due"].includes(b.billing.status));
    return { prospects_preview: P.length, prospects_claimed_30d: 0, businesses: B.length, new_30d: B.filter((b) => now - new Date(b.created_at) < 30 * day).length, active_30d: B.filter((b) => b.stamps_30d > 0).length, paid: B.filter((b) => b.plan !== "free").length, trial: B.filter((b) => b.trial && b.plan === "free").length,
      sub_active: S.filter((b) => b.billing.status !== "past_due").length, sub_past_due: S.filter((b) => b.billing.status === "past_due").length, sub_canceling: S.filter((b) => b.billing.cancel_at_end).length,
      sub_month: S.filter((b) => b.billing.interval === "month").length, sub_year: S.filter((b) => b.billing.interval === "year").length, customers: B.reduce((a, b) => a + b.customers, 0), stamps_30d: B.reduce((a, b) => a + b.stamps_30d, 0), redeemed_30d: B.reduce((a, b) => a + b.redeemed_30d, 0) }; };
  const exportModel = (b) => ({ version: 1, exported_at: new Date().toISOString(), source: { id: b.id, slug: b.slug }, business: { name: b.name, tagline: b.tagline, address: b.address, page_color: b.page_color, tz: b.tz, currency: b.currency, type: b.type, settings: b.settings }, cards: b.cards.map(({ id, ...c }) => c), page_items: b.items.map(({ id, ...p }) => p) });
  const viaDemo = async (action, p = {}, body = {}) => {
    A.source = "demo";
    switch (action) {
      case "stats": return demoStats();
      case "businesses": return { items: D.businesses.map((b) => Object.assign({}, b, { gmaps: b.gmaps && b.gmaps.main ? Object.assign({ filiais: 0 }, b.gmaps.main) : null })) };
      case "business": { const b = find(p.id); b.suggestions_open = D.sugs.filter((s) => s.business_id === b.id && s.status === "open").length; return { item: b }; }
      case "suggestions": return { items: D.sugs.filter((s) => s.business_id === p.id).sort((a, b) => (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1)) };
      case "suggestion-decide": { const s = D.sugs.find((x) => x.id === body.id); if (!s) throw new Error("Sugestão não encontrada."); s.status = body.status; s.decided_at = body.status === "open" ? null : new Date().toISOString(); log("suggestion_" + body.status, find(s.business_id), { title: s.title }); return { item: s }; }
      case "payments": return { items: D.businesses.filter((b) => !(b.prospect && b.prospect.status === "preview")).map((b) => ({ id: b.id, name: b.name, slug: b.slug, plan: b.plan, trial: b.trial, created_at: b.created_at, owner_email: b.owner_email, customers: b.customers,
        phone: (b.settings && b.settings.receipts && b.settings.receipts.phone) || "", links_open: D.links.filter((l) => l.business_id === b.id && l.status === "open").length,
        billing: b.billing && Object.assign({ provider: "stripe", method: "card", auto_renew: !b.billing.cancel_at_end }, b.billing) })) };
      case "events": return { items: find(p.id).billing ? [{ id: "evt_1", type: "invoice.paid", at: new Date(now - 20 * day).toISOString() }, { id: "evt_2", type: "customer.subscription.updated", at: new Date(now - 50 * day).toISOString() }] : [] };
      case "customers": return { items: D.customers(p.id) };
      case "audit": return { items: D.audit };
      case "visit-route": return { item: { id: "demo", title: "Roteiro de visitas (exemplo)", updated_at: new Date().toISOString(), html: "<!doctype html><meta charset=utf-8><body style=\"font-family:sans-serif;padding:24px\"><h2>Roteiro de visitas</h2><p>Demonstração: o conteúdo real só aparece para o superadmin na produção.</p></body>" } };
      case "set-plan": { const b = find(body.id); b.plan = body.plan; b.trial = !!body.trial; log("set_plan", b, { plan: body.plan, trial: body.trial }); return { ok: true, plan: b.plan, trial: b.trial }; }
      case "update-business": { const b = find(body.id); const pt = body.patch || {}; ["name", "tagline", "address", "page_color", "tz", "currency", "type"].forEach((k) => { if (pt[k] != null && pt[k] !== "") b[k] = pt[k]; }); if ("logo_url" in pt) b.logo_url = pt.logo_url || null; if (pt.settings) Object.assign(b.settings, pt.settings); log("update_business", b, pt); return { item: b }; }
      case "set-card": { const b = find(body.id), c = body.card || {}; let k = b.cards.find((x) => x.id === c.id); if (!k) { k = { id: b.id + "-c" + (b.cards.length + 1) }; b.cards.push(k); } Object.assign(k, { name: c.name || k.name || "Cartão", stamps: +c.stamps || 8, header: c.header || "RECOMPENSAS", reward_text: c.reward_text || "", reward_label: c.reward_label || "Recompensa", active: !!c.active }); if (k.active) b.cards.forEach((x) => { if (x !== k) x.active = false; }); if (!b.cards.some((x) => x.active)) b.cards[b.cards.length - 1].active = true; log("set_card", b, { card: k.id }); return { item: k }; }
      case "delete-card": { const b = find(body.id); if (b.cards.length <= 1) throw new Error("É o único cartão."); b.cards = b.cards.filter((x) => x.id !== body.card); if (!b.cards.some((x) => x.active)) b.cards[0].active = true; return { ok: true }; }
      case "set-items": { const b = find(body.id); b.items = (body.items || []).map((it, i) => Object.assign({ id: it.id || b.id + "-i" + i + Date.now().toString(36) }, it)); log("set_items", b, { count: b.items.length }); return { items: b.items }; }
      case "set-nav": { const b = find(body.id); b.nav = (body.items || []).map((it, i) => Object.assign({ id: it.id || "n" + i + Date.now().toString(36) }, it)); b.nav_count = b.nav.length; return { items: b.nav }; }
      case "export": return { model: exportModel(find(p.id)) };
      case "import": { const b = find(body.id), m = body.model || {}; const bz = m.business || {}; ["tagline", "address", "page_color", "tz", "currency", "type"].forEach((k) => { if (bz[k]) b[k] = bz[k]; }); if (bz.settings) Object.assign(b.settings, bz.settings);
        if (body.replace) { b.items = []; if ((m.cards || []).length) b.cards = []; }
        (m.cards || []).forEach((c, i) => b.cards.push(Object.assign({ id: b.id + "-mc" + i + Date.now().toString(36) }, c, { active: !!c.active && !!body.replace })));
        if (!b.cards.some((x) => x.active) && b.cards.length) b.cards[b.cards.length - 1].active = true;
        (m.page_items || []).forEach((it, i) => b.items.push(Object.assign({ id: b.id + "-mi" + i + Date.now().toString(36) }, it)));
        log("import_model", b, { replace: !!body.replace, cards: (m.cards || []).length, items: (m.page_items || []).length }); return { ok: true, cards: (m.cards || []).length, items: (m.page_items || []).length }; }
      case "create-business": { const rows = body.rows || [body]; const results = rows.map((r, i) => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email || "")) return { email: r.email, ok: false, error: "E-mail inválido." }; if (!(r.name || "").trim()) return { email: r.email, ok: false, error: "Informe o nome do negócio." };
          const slug = String(r.name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "negocio"; const id = "b" + Date.now().toString(36) + i;
          const b = demoBiz(id, r.name.trim(), slug, r.plan || "free", r.trial !== false, 0, null, { owner_email: r.email, customers: 0, stamps_30d: 0, redeemed_30d: 0, visitors_30d: 0, stamps_total: 0, redeemed_total: 0, leads: 0, staff: 0, webhooks: 0, nav_count: 0, gmaps: null, items: [] });
          if (body.model) { b.items = (body.model.page_items || []).map((it, j) => Object.assign({ id: id + "-i" + j }, it)); if ((body.model.cards || []).length) b.cards = body.model.cards.map((c, j) => Object.assign({ id: id + "-c" + j }, c)); if (!b.cards.some((x) => x.active)) b.cards[0].active = true; }
          D.businesses.unshift(b); log("create_business", b, { owner: r.email, plan: b.plan }); return { email: r.email, ok: true, business_id: id, slug, invited: true, link: null }; });
        return { ok: results.every((r) => r.ok), results }; }
      case "forja-upsert": { const b = find(body.id); b.forja = Object.assign(b.forja || { id: "f" + Date.now().toString(36), status: "pending", last_seen_at: null, last_metrics: null }, { name: body.name, base_url: body.base_url, tier: body.tier || "free", has_token: !!body.token || !!(b.forja && b.forja.has_token) }); return { item: b.forja }; }
      case "forja-remove": { const b = find(body.id); b.forja = null; b.nav = b.nav.filter((n) => n.kind !== "forja"); return { ok: true }; }
      case "forja-metrics": { const b = find(p.id); if (!b.forja) return { ok: false, error: "Este negócio ainda não tem um chatbot vinculado." }; b.forja.status = "ok"; b.forja.last_seen_at = new Date().toISOString(); b.forja.last_metrics = { range: p.range || "7d", leads: 12, messages: 348, conversations: 57, health_score: 93 }; return { ok: true, instance: b.forja, data: b.forja.last_metrics }; }
      case "serp-status": return { chaves: [{ chave: "demo…1234", ok: true, plano: "Exemplo", limite_mes: 250, usadas_mes: 61, restantes: 189 }], total_restantes: 189 };
      case "status": return { ok: true, supabase: null, chaves: 1 };
      // ---------- acesso e prospecção
      case "owner": { const b = find(p.id), pre = b.prospect && b.prospect.status === "preview" && /prospeccao@/.test(b.owner_email || "");
        return { owner: pre ? { id: "u-plat", email: "prospeccao@seuclientefiel.com.br", name: "Prospecção (plataforma)", created_at: b.created_at, last_sign_in_at: null, email_confirmed_at: b.created_at, is_platform_account: true, businesses: D.businesses.filter((x) => x.prospect && x.prospect.status === "preview").length, is_admin: false }
            : { id: "u-" + b.id, email: b.owner_email, name: "Dono de " + b.name, created_at: b.created_at, last_sign_in_at: new Date(now - 2 * day).toISOString(), email_confirmed_at: b.created_at, is_platform_account: false, businesses: 1, is_admin: false },
          staff: b.staff ? [{ id: "s1", name: "Atendente", email: "atendente@" + b.slug + ".com.br", status: "active", user_id: "u-s-" + b.id, last_sign_in_at: new Date(now - day).toISOString() }] : [], prospect: b.prospect || null }; }
      case "set-password": if (String(body.password || "").length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres."); log("set_password", find(body.business_id), {}); return { ok: true, email: "exemplo@exemplo.com.br" };
      case "recovery-link": case "magic-link": log(action.replace("-", "_"), find(body.business_id), {}); return { ok: true, email: "exemplo@exemplo.com.br", link: "https://exemplo.supabase.co/auth/v1/verify?token=DEMONSTRACAO&type=" + (action === "recovery-link" ? "recovery" : "magiclink") };
      case "send-recovery": log("send_recovery", find(body.business_id), {}); return { ok: true, email: "exemplo@exemplo.com.br", sent: true };
      case "set-email": { const b = find(body.business_id), novo = String(body.email || "").trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo)) throw new Error("E-mail inválido.");
        const prev = b.owner_email; b.owner_email = novo; log("set_email", b, { from: prev, to: novo }); return { ok: true, email: novo, previous: prev }; }
      case "activate-prospect": { const b = find(body.id); if (!b.prospect || b.prospect.status !== "preview") return { ok: true, already: true }; if (!b.owner_email || /prospeccao@/.test(b.owner_email)) throw new Error("Esta página ainda está na conta de prospecção: crie a conta do estabelecimento ou mande o link de ativação.");
        b.prospect.status = "claimed"; b.trial = true; b.created_at = new Date().toISOString(); log("activate_business", b, { via: "admin" }); return { ok: true, id: b.id, name: b.name }; }
      case "prospects": return { items: D.businesses.filter((b) => b.prospect).map((b) => ({ id: b.id, name: b.name, slug: b.slug, created_at: b.created_at, prospect: b.prospect, owner_email: b.owner_email, claim: b.claim || null, customers: b.customers })) };
      case "claim-link": { const b = find(body.id); if (!b.prospect || b.prospect.status !== "preview") throw new Error("Esta página já foi ativada."); const tok = Math.random().toString(16).slice(2).padEnd(36, "0"); b.claim = { created_at: new Date().toISOString(), expires_at: new Date(now + 60 * day).toISOString(), claimed_at: null }; log("claim_link", b, {}); return { ok: true, token: tok, expires_at: b.claim.expires_at }; }
      case "leads": throw new Error("A base do Prospector só aparece com o servidor local (python tools/dev-server.py com CF_ADMIN_LOCAL=1).");
      // ---------- cobrança (formas de pagamento e links)
      case "features": return { items: D.businesses.map((b) => { const it = b.items || [], n = (t) => it.filter((x) => x.type === t).length;
        return { id: b.id, f: { capa: b.id === "b1", logo: b.id !== "b6" && b.id !== "b7", fundo: b.id === "b1" || b.id === "b2", cartao: (b.cards.find((c) => c.active) || {}).stamps || null, icones: it.filter((x) => x.icon_only).length,
          menus: n("menu"), catalogos: n("catalog"), novidades: n("news"), whatsapp: it.some((x) => x.type === "contact" && x.url), wifi: false, links: n("link") + n("social"), campanha: b.id === "b1", aniversarios: b.id === "b2",
          pesquisa: false, google: !!b.gmaps, qr: b.id !== "b6" && b.id !== "b7", mapa: !!b.gmaps, pro: b.plan !== "free" } }; }) };
      case "pay-config": return JSON.parse(JSON.stringify(D.pay));
      case "pay-config-set": { const c = body.config || {}; if (c.provider === "pix" && !(c.pix && c.pix.key && c.pix.name && c.pix.city)) throw new Error("Para usar o Pix manual como padrão, preencha a chave, o nome e a cidade do recebedor.");
        D.pay = { provider: c.provider || D.pay.provider, prices: { month: +(c.prices || {}).month || 79, year: +(c.prices || {}).year || 708 }, pix: Object.assign({ key: "", name: "", city: "" }, c.pix), grace_days: c.grace_days == null ? 5 : c.grace_days }; log("billing_config", null, { provider: D.pay.provider }); return D.pay; }
      case "pay-status": { const px = D.pay.pix || {}; return { provider: D.pay.provider, providers: { stripe: true, asaas: true, mercadopago: true, pix: !!(px.key && px.name && px.city) }, prices: D.pay.prices, grace_days: D.pay.grace_days,
        mode: { stripe: "teste", asaas: "sandbox", mercadopago: "teste" }, webhooks: { stripe: "https://exemplo.supabase.co/functions/v1/billing/webhook", asaas: "https://exemplo.supabase.co/functions/v1/billing/webhook/asaas", mercadopago: "https://exemplo.supabase.co/functions/v1/billing/webhook/mercadopago" } }; }
      case "pay-links": return { items: D.links.filter((l) => !p.id || l.business_id === p.id).map((l) => Object.assign({ business: (D.businesses.find((x) => x.id === l.business_id) || {}).name, created_by: l.origin === "admin" ? "demo" : null }, l)) };
      case "pay-link": { const b = find(body.business), pv = body.provider, iv = body.interval === "year" ? "year" : "month";
        if (pv === "pix" && !(D.pay.pix.key && D.pay.pix.name && D.pay.pix.city)) throw new Error("Cadastre a chave Pix (nome e cidade do recebedor) em Pagamentos › Formas de pagamento.");
        const id = "l" + Date.now().toString(36), kind = pv === "stripe" ? "subscription" : pv === "pix" ? "one_time" : body.kind === "one_time" ? "one_time" : "subscription";
        const url = { stripe: "https://buy.stripe.com/test_" + id, asaas: "https://sandbox.asaas.com/c/" + id, mercadopago: kind === "subscription" ? "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=" + id : "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=" + id, pix: "../pagar/?c=DEMO" + id.padEnd(18, "0") }[pv];
        const l = { id, business_id: b.id, provider: pv, kind, interval: iv, method: body.method || (pv === "stripe" ? "card" : pv === "pix" ? "pix" : null), amount: +body.amount || D.pay.prices[iv], url, status: "open", origin: "admin", note: body.note || null, created_at: new Date().toISOString(), expires_at: pv === "pix" ? new Date(Date.now() + 30 * day).toISOString() : null };
        D.links.unshift(l); log("payment_link", b, { provider: pv, amount: l.amount }); return { item: Object.assign({ business: b.name }, l) }; }
      case "pay-cancel-link": { const l = D.links.find((x) => x.id === body.link); if (!l || l.status !== "open") throw new Error("Este link não está em aberto."); l.status = "canceled"; l.canceled_at = new Date().toISOString(); return { item: l, provider_ok: true }; }
      case "pay-mark-paid": { const l = D.links.find((x) => x.id === body.link); if (!l) throw new Error("Link não encontrado."); if (l.provider !== "pix") throw new Error("Só o Pix manual é confirmado à mão.");
        if (l.status === "paid") return { ok: true, already: true };
        const b = find(l.business_id), cur = b.billing && ["active", "trialing", "past_due"].includes(b.billing.status) && b.billing.period_end ? Math.max(Date.now(), +new Date(b.billing.period_end)) : Date.now();
        const end = new Date(cur + (l.interval === "year" ? 365 : 30) * day).toISOString(); l.status = "paid"; l.paid_at = new Date().toISOString();
        b.billing = { status: "active", interval: l.interval, period_end: end, cancel_at_end: false, provider: "pix", method: "pix", amount: l.amount, auto_renew: false }; b.plan = "pro"; b.trial = false; log("mark_paid", b, { amount: l.amount }); return { ok: true, business: b.id, plan: "pro", period_end: end }; }
      case "pay-cancel-sub": { const b = find(body.business); if (!b.billing || !["active", "trialing", "past_due"].includes(b.billing.status)) throw new Error("Este negócio não tem assinatura ativa."); b.billing.cancel_at_end = true; b.billing.auto_renew = false; log("cancel_renewal", b, {}); return { ok: true }; }
    }
    throw new Error("Ação desconhecida: " + action);
  };

  /* ---------------- servidor local (/api/admin) ---------------- */
  let localOk = null;
  const viaLocal = async (action, params, body) => {
    if (!/^https?:/.test(location.protocol) || localOk === false) throw Object.assign(new Error("sem servidor local"), { skip: true });
    let r;
    try { const u = new URL("/api/admin", location.origin); u.searchParams.set("action", action); Object.entries(params || {}).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
      r = await fetch(u, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ action }, body)) } : undefined); }
    catch (e) { localOk = false; throw Object.assign(new Error("sem servidor local"), { skip: true }); }
    if (r.status === 404) { localOk = false; throw Object.assign(new Error("sem /api/admin"), { skip: true }); }
    localOk = true; A.source = "local";
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Falha no servidor local."); return d;
  };

  /* ---------------- Supabase (RPCs admin_*) ---------------- */
  const rpc = async (name, args) => { const { data, error } = await sb.rpc(name, args); if (error) throw new Error(/forbidden/.test(error.message) ? "Só o superadmin da plataforma pode fazer isso." : /does not exist|schema cache/.test(error.message) ? "O banco precisa da atualização (Atualizar banco (Supabase).bat)." : error.message); return data; };
  const fn = async (name, body) => { const { data, error } = await sb.functions.invoke(name, { body }); if (error) { let m = error.message || "Falha."; try { const j = await error.context.json(); if (j && j.error) m = j.error; } catch (e) {} throw new Error(m); } return data; };
  const viaRemote = async (action, p = {}, body = {}) => {
    if (!sb || !A.user) throw Object.assign(new Error("sem sessão"), { skip: true });
    A.source = "supabase";
    switch (action) {
      case "stats": return rpc("admin_stats");
      case "businesses": return { items: await rpc("admin_businesses") };
      case "business": return { item: await rpc("admin_business", { p_business: p.id }) };
      case "payments": return { items: await rpc("admin_payments") };
      case "events": return { items: await rpc("admin_billing_events", { p_business: p.id }) };
      case "customers": return { items: await rpc("admin_customers", { p_business: p.id }) };
      case "audit": return { items: await rpc("admin_audit_list", { p_limit: 300 }) };
      case "visit-route": return { item: await rpc("admin_visit_route", { p_id: p.id || "itapema" }) };
      case "set-plan": return rpc("admin_set_plan", { p_business: body.id, p_plan: body.plan, p_trial: !!body.trial });
      case "update-business": return { item: await rpc("admin_update_business", { p_business: body.id, p_patch: body.patch || {} }) };
      case "set-card": return { item: await rpc("admin_set_card", { p_business: body.id, p_card: body.card || {} }) };
      case "delete-card": await rpc("admin_delete_card", { p_business: body.id, p_card: body.card }); return { ok: true };
      case "set-items": return { items: await rpc("admin_set_items", { p_business: body.id, p_items: (body.items || []).map(({ id, ...it }) => it) }) };
      case "set-nav": return { items: await rpc("admin_set_nav", { p_business: body.id, p_items: (body.items || []).map((n) => ({ group_label: n.group_label, label: n.label, icon: n.icon, kind: n.kind, target: n.target, active: n.active !== false })) }) };
      case "export": return { model: await rpc("admin_export_business", { p_business: p.id }) };
      case "import": return rpc("admin_import_model", { p_business: body.id, p_model: body.model, p_replace: !!body.replace });
      case "create-business": return fn("admin-api", body.rows ? { action: "bulk-create", rows: body.rows, model: body.model || null } : { action: "create-business", email: body.email, name: body.name, plan: body.plan, trial: body.trial, model: body.model || null });
      case "forja-upsert": return { item: await rpc("admin_upsert_forja", { p_business: body.id, p_name: body.name, p_base_url: body.base_url, p_token: body.token || null, p_tier: body.tier || "free" }) };
      case "forja-remove": await rpc("admin_remove_forja", { p_business: body.id }); return { ok: true };
      case "forja-metrics": { try { return await fn("forja-proxy", { action: p.kind === "health" ? "health" : "metrics", business: p.id, range: p.range || "7d" }); } catch (e) { return { ok: false, error: e.message }; } }
      case "serp-status": throw new Error("O saldo das chaves só aparece com o servidor local (python tools/dev-server.py com CF_ADMIN_LOCAL=1).");
      case "status": return { ok: true, supabase: "remoto" };
      // ---------- acesso (função admin-api: precisa da service_role) e prospecção (RPCs da migração 27)
      case "owner": return rpc("admin_owner", { p_business: p.id });
      case "set-password": case "recovery-link": case "send-recovery": case "magic-link": case "set-email": return fn("admin-api", { action, user_id: body.user_id, password: body.password, email: body.email, business_id: body.business_id });
      case "activate-prospect": return rpc("admin_activate_prospect", { p_business: body.id });
      case "prospects": return { items: await rpc("admin_prospects") };
      case "claim-link": return rpc("admin_claim_link", { p_business: body.id, p_days: body.days || 60 });
      case "create-prospect": return rpc("admin_create_prospect", { p_lead: body.lead });
      // ---------- cobrança (migração 29 + função billing/admin/*)
      case "features": return { items: await rpc("admin_feature_usage") };
      case "pay-config": return rpc("admin_billing_config");
      case "pay-config-set": return rpc("admin_set_billing_config", { p: body.config || {} });
      case "pay-links": return { items: await rpc("admin_payment_links", { p_business: p.id || null, p_status: p.status || null, p_limit: 300 }) };
      case "pay-status": return fn("billing/admin/status", {});
      case "pay-link": return fn("billing/admin/link", body);
      case "pay-cancel-link": return fn("billing/admin/cancel-link", { link: body.link });
      case "pay-mark-paid": return fn("billing/admin/mark-paid", { link: body.link, note: body.note || null });
      case "pay-cancel-sub": return fn("billing/admin/cancel-sub", { business: body.business });
      case "leads": throw new Error("A base do Prospector só aparece com o servidor local (python tools/dev-server.py com CF_ADMIN_LOCAL=1).");
      // ---------- sugestões da página (migração 20261102: tools/ficha_jev.py grava, o superadmin aprova)
      case "suggestions": return { items: await rpc("admin_suggestions", { p_business: p.id }) };
      case "suggestion-decide": return { item: await rpc("admin_suggestion_decide", { p_id: body.id, p_status: body.status }) };
    }
    throw new Error("Ação desconhecida: " + action);
  };

  A.api = async (action, params, body) => {
    if (window.CF_V2_DEMO) return viaDemo(action, params, body);
    for (const f of [viaLocal, viaRemote, viaDemo]) { try { return await f(action, params, body); } catch (e) { if (!e || !e.skip) throw e; } }
    throw new Error("Sem servidor disponível.");
  };
  A.isDemo = () => A.source === "demo" || (!sb && localOk !== true);

  /* ---------------- sessão ---------------- */
  A.session = async () => { if (!sb) return null; const { data } = await sb.auth.getSession(); A.user = data.session ? data.session.user : null; return A.user; };
  A.isAdmin = async () => { if (!sb || !A.user) return false; const { data, error } = await sb.rpc("is_platform_admin"); return !error && data === true; };
  A.login = async (email, password) => { const { data, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw new Error(error.message); A.user = data.user; return A.user; };
  A.logout = async () => { if (sb) await sb.auth.signOut(); A.user = null; };
})();
