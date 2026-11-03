/* Cliente Fiel — camada de dados (Supabase).
   Carregado DEPOIS das páginas e ANTES de CF.boot(). Se CF_SUPABASE estiver configurado:
   - exige login (e-mail/senha) e garante um negócio para o usuário (ensure_business)
   - hidrata CF.state a partir do banco (negócio, cartões, clientes com progresso, campanhas, conteúdo da página)
   - substitui as operações críticas por RPCs atômicas (carimbar, resgatar, desfazer, substituir cartão)
   - sincroniza (write-through, com debounce) biz/cards/customers/campaigns/pageItems após cada CF.update
   Sem configuração, nada muda: o painel segue 100% em localStorage. */
(function () {
  "use strict";
  const CF = window.CF, I = CF.icon, esc = CF.esc;
  const cfg = window.CF_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey || !window.supabase) return;
  // link de "Esqueci minha senha": o Supabase volta com #access_token=…&type=recovery (lido antes do createClient limpar)
  const recovering = /type=recovery/.test(location.hash || "");
  // os botões "Criar meu cartão grátis" do site chegam com ?criar=1: a tela já abre em "Criar conta"
  let wantSignup = false;
  try { const q = new URLSearchParams(location.search); if (q.get("criar") === "1") { wantSignup = true; q.delete("criar"); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); } } catch (e) {}
  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  window.CF_SB = sb; // maps.js usa a sessão para chamar a função maps-lookup
  CF.sb = sb;
  CF.online = true;
  const packFx = (b, fx) => (b && fx && (fx.blur || fx.amount) ? `${b}|fx=${+fx.blur || 0}.${fx.tint === "light" ? "light" : "dark"}.${+fx.amount || 0}` : b || null);
  const unpackFx = (v) => { const m = /^(.*)\|fx=(\d+)\.(light|dark)\.(\d+)$/.exec(v || ""); return m ? { banner: m[1], bannerFx: { blur: +m[2], tint: m[3], amount: +m[4] } } : { banner: v || null, bannerFx: null }; };
  const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s));
  let bizId = null, syncing = false, snapshot = null;

  /* ------------------------------------------------------------ ativação de página pré-criada (…/app/?ativar=<token>) */
  // O token fica guardado neste navegador: se a conta nova precisar confirmar o e-mail, a ativação acontece no próximo login.
  const CLAIM_KEY = "cf.claim";
  let claimTok = "";
  try {
    const t = new URLSearchParams(location.search).get("ativar");
    if (t && /^[0-9a-f]{20,64}$/i.test(t)) { localStorage.setItem(CLAIM_KEY, t.toLowerCase()); history.replaceState(null, "", location.pathname + location.hash); }
    claimTok = localStorage.getItem(CLAIM_KEY) || "";
  } catch (e) {}
  const dropClaim = () => { claimTok = ""; try { localStorage.removeItem(CLAIM_KEY); } catch (e) {} };
  // convite para a equipe (tela Funcionários): ?equipe=<código> — fica guardado até a conta entrar e o convite ser aceito (staff_accept)
  const STAFF_KEY = "cf.staffinvite";
  let staffTok = "";
  try {
    const q = new URLSearchParams(location.search), t = q.get("equipe");
    if (t && /^[0-9a-f]{20,64}$/i.test(t)) { localStorage.setItem(STAFF_KEY, t.toLowerCase()); q.delete("equipe"); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); }
    staffTok = localStorage.getItem(STAFF_KEY) || "";
  } catch (e) {}
  const dropStaffTok = () => { staffTok = ""; try { localStorage.removeItem(STAFF_KEY); } catch (e) {} };
  const claimErr = (m) => (/link_ja_usado/.test(m) ? "Este link de ativação já foi usado por outra conta." : /link_expirado/.test(m) ? "Este link de ativação expirou. Peça um novo para quem te enviou."
    : /pagina_ja_ativada/.test(m) ? "Esta página já foi ativada." : /link_invalido/.test(m) ? "Link de ativação inválido." : m);

  /* ------------------------------------------------------------ login */
  // msg: texto de erro, ou { ok: true, text } para aviso de sucesso. o.signup / o.email preservam o modo e o e-mail ao redesenhar.
  function loginScreen(msg, o = {}) {
    const ok = msg && typeof msg === "object" && msg.ok, text = msg ? (ok ? msg.text : String(msg)) : "";
    const trial = CF.config.trialDays, free = CF.config.freeClientLimit;
    document.body.innerHTML = `<div class="app" style="justify-content:center;align-items:center;background:var(--gray-50)">
      <form class="card" id="lg" style="width:400px;max-width:92vw;padding:32px;display:flex;flex-direction:column;gap:16px">
        <div class="center"><img class="login-logo" src="assets/img/seucliente-logo.svg" alt="${esc(CF.config.product)}"><p class="muted" id="lg-sub" style="margin-top:14px">Entre para gerenciar seu cartão fidelidade.</p></div>
        <div id="lg-claim" class="hide" style="background:var(--brand-50);color:var(--gray-800);border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.45"></div>
        <div class="field"><label for="lg-e">E-mail</label><input class="input" id="lg-e" type="email" required autocomplete="username" autofocus value="${esc(o.email || "")}"></div>
        <div class="field"><label for="lg-p">Senha</label><input class="input" id="lg-p" type="password" required minlength="6" autocomplete="current-password">
          <button class="link-btn small" type="button" id="lg-fg" style="align-self:flex-start;margin-top:6px">Esqueci minha senha</button></div>
        <div class="field hide" id="lg-nf"><label for="lg-n">Nome do seu negócio</label><input class="input" id="lg-n" placeholder="Ex.: Café da Praça"><span class="hint" style="font-size:12.5px;color:var(--gray-500)">Depois de entrar, um passo a passo busca seu logo e seus dados no Google Maps.</span></div>
        ${text ? (ok ? `<div class="alert ok" role="status" style="border-radius:10px;padding:10px 12px">${esc(text)}</div>` : `<div class="alert err" role="alert" style="background:var(--err-50);color:var(--err-700);border-radius:10px;padding:10px 12px">${esc(text)}</div>`) : ""}
        <button class="btn primary lg block" id="lg-ok">Entrar</button>
        <p class="small muted hide" id="lg-terms" style="margin:-6px 0 0;text-align:center;line-height:1.45">${trial} dias com tudo do Pro, sem cartão de crédito. Depois, o plano Free segue grátis com até ${free} clientes. Ao criar a conta, você aceita os <a href="/termos/" target="_blank" rel="noopener">Termos de uso</a> e a <a href="/privacidade/" target="_blank" rel="noopener">Política de Privacidade</a>.</p>
        <button class="link-btn" type="button" id="lg-sw">Não tem conta? Criar conta</button>
      </form></div><div id="toasts" aria-live="polite" role="status"></div>`;
    let signup = false;
    const f = document.getElementById("lg"), $id = (x) => document.getElementById(x);
    const setMode = (on) => { signup = on; $id("lg-nf").classList.toggle("hide", !signup || !!claimTok || !!staffTok); $id("lg-terms").classList.toggle("hide", !signup); $id("lg-fg").classList.toggle("hide", signup);
      $id("lg-p").setAttribute("autocomplete", signup ? "new-password" : "current-password");
      $id("lg-sub").textContent = signup ? "Crie sua conta e monte o cartão do seu negócio." : "Entre para gerenciar seu cartão fidelidade.";
      $id("lg-ok").textContent = signup ? "Criar conta" : "Entrar"; $id("lg-sw").textContent = signup ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"; };
    setMode(o.signup != null ? !!o.signup : wantSignup);
    $id("lg-sw").addEventListener("click", () => setMode(!signup));
    // esqueci a senha: manda o link sem dizer se o e-mail tem conta (não revela quem é cliente)
    $id("lg-fg").addEventListener("click", async () => {
      const email = $id("lg-e").value.trim();
      if (!email || !$id("lg-e").checkValidity()) { $id("lg-e").focus(); return loginScreen("Digite o seu e-mail acima e toque de novo em “Esqueci minha senha”.", { signup: false, email }); }
      $id("lg-fg").disabled = true;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (error && !/not found|user/i.test(error.message)) return loginScreen(CF.humanError(error.message), { signup: false, email });
      loginScreen({ ok: true, text: `Se houver uma conta com ${email}, enviamos um link para criar uma senha nova. Confira também a caixa de spam.` }, { signup: false, email });
    });
    // veio de um link de ativação: mostra qual página vai assumir e já abre em "Criar conta"
    if (claimTok) sb.rpc("public_claim_info", { p_token: claimTok }).then(({ data: ci }) => {
      const box = document.getElementById("lg-claim"); if (!box) return;
      box.classList.remove("hide");
      if (ci && ci.ok) { box.innerHTML = `<b>Ative a página de ${esc(ci.name)}</b><br>Crie sua conta (ou entre, se já tiver) para assumir a página e o cartão fidelidade. O teste grátis começa agora.`; if (!msg) setMode(true); }
      else { box.innerHTML = ci && ci.claimed ? "Este link de ativação já foi usado." : ci && ci.expired ? "Este link de ativação expirou. Peça um novo para quem te enviou." : "Link de ativação inválido."; dropClaim(); }
    }, () => {});
    if (staffTok && !claimTok) sb.rpc("staff_invite_info", { p_token: staffTok }).then(({ data: si }) => {
      const box = document.getElementById("lg-claim"); if (!box) return;
      box.classList.remove("hide");
      if (si && si.ok) { box.innerHTML = `<b>Convite para a equipe de ${esc(si.business)}</b><br>${esc(si.name)}, crie sua conta com o e-mail ${esc(si.email)} (ou entre, se já tiver) para carimbar e buscar clientes.`; if (!msg) { setMode(true); const el = $id("lg-e"); if (el && !el.value) el.value = si.email || ""; } }
      else { box.innerHTML = si && si.used ? "Este convite já foi usado. Entre com a sua conta." : si && si.revoked ? "Este convite foi cancelado. Peça um novo ao dono do negócio." : "Convite inválido. Peça o link de novo a quem te convidou."; dropStaffTok(); }
    }, () => {});
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = f.querySelector("#lg-e").value.trim(), password = f.querySelector("#lg-p").value, name = f.querySelector("#lg-n").value.trim();
      document.getElementById("lg-ok").disabled = true;
      const r = signup ? await sb.auth.signUp({ email, password, options: { data: { business_name: name } } }) : await sb.auth.signInWithPassword({ email, password });
      if (r.error) return loginScreen(CF.humanError(r.error.message), { signup, email });
      if (signup && !r.data.session) return loginScreen({ ok: true, text: `Conta criada! Enviamos um link de confirmação para ${email}. Abra o e-mail, toque no link e volte aqui para entrar.` }, { signup: false, email });
      CF.pendingBizName = name;
      start();
    });
  }

  /* ------------------------------------------------------------ senha nova (volta do link de "Esqueci minha senha") */
  function newPasswordScreen(msg) {
    if (/access_token=/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);   // tira o token da barra
    document.body.innerHTML = `<div class="app" style="justify-content:center;align-items:center;background:var(--gray-50)">
      <form class="card" id="np" style="width:400px;max-width:92vw;padding:32px;display:flex;flex-direction:column;gap:16px">
        <div class="center"><img class="login-logo" src="assets/img/seucliente-logo.svg" alt="${esc(CF.config.product)}"><p class="muted" style="margin-top:14px">Crie uma senha nova para a sua conta.</p></div>
        <div class="field"><label for="np-p">Senha nova</label><input class="input" id="np-p" type="password" required minlength="6" autocomplete="new-password" autofocus></div>
        ${msg ? `<div class="alert err" role="alert" style="background:var(--err-50);color:var(--err-700);border-radius:10px;padding:10px 12px">${esc(msg)}</div>` : ""}
        <button class="btn primary lg block" id="np-ok">Salvar senha e entrar</button>
      </form></div><div id="toasts" aria-live="polite" role="status"></div>`;
    document.getElementById("np").addEventListener("submit", async (e) => {
      e.preventDefault(); document.getElementById("np-ok").disabled = true;
      const { error } = await sb.auth.updateUser({ password: document.getElementById("np-p").value });
      if (error) return newPasswordScreen(CF.humanError(error.message));
      await start(); CF.toast("Senha alterada.");
    });
  }
  let recoveryShown = false;
  sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY" && !recoveryShown) { recoveryShown = true; newPasswordScreen(); } });

  /* ------------------------------------------------------------ hidratação */
  const mapCustomer = (c) => { const p = (c.customer_cards || []).find((x) => x.card_id === (CF.card() || {}).id) || (c.customer_cards || [])[0] || {}; return { id: c.id, name: c.name, email: c.email || "", phone: c.phone || "", birthday: c.birthday, consent: c.marketing_consent, token: c.token, code: c.code || "", stamps: p.stamps || 0, total: p.total || 0, last: p.last_stamp_at || null, created: c.created_at }; };
  const mapRequest = (r) => ({ id: r.id, customerId: r.customer_id, kind: r.kind, qty: r.qty || 1, note: r.note || "", created: r.created_at });
  // pedidos de carimbo abertos (tabela da migração 20261021 — se ainda não existir no servidor, a lista fica vazia)
  // redes Wi-Fi da loja (conteúdo só no local) — tabela da migração 20261022; se ainda não existir, a lista fica vazia
  async function loadNetworks() {
    const { data } = await sb.from("business_networks").select("id, label, created_at, last_seen_at").eq("business_id", bizId).order("created_at");
    CF.state.networks = (data || []).map((x) => ({ id: x.id, label: x.label || "", created: x.created_at, lastSeen: x.last_seen_at }));
  }
  async function loadRequests() {
    const { data, error } = await sb.from("stamp_requests").select("id, customer_id, kind, qty, note, created_at").eq("business_id", bizId).eq("status", "pending").order("created_at", { ascending: false }).limit(200);
    CF.state.requestsReady = !error; CF.state.requests = (data || []).map(mapRequest);
  }
  const planName = (p) => ({ free: "Free", pro: "Pro", business: "Pro", multi: "Pro" })[p] || "Free";
  async function load() {
    // Todas as consultas saem JUNTAS (antes eram ~9 idas e voltas em fila, uma esperando a outra). Cada resultado é usado mais abaixo, na mesma ordem de antes.
    const since = new Date(Date.now() - 90 * 864e5).toISOString();
    const [bizR, locsR, mainR, visR, , , , extR, userR] = await Promise.all([
      sb.from("businesses").select("*").eq("id", bizId).single(),
      sb.from("locations").select("*").eq("business_id", bizId).order("position"),
      Promise.all([
        sb.from("cards").select("*").eq("business_id", bizId).order("created_at"),
        sb.from("customers").select("*, customer_cards(*)").eq("business_id", bizId).order("created_at", { ascending: false }),
        sb.from("campaigns").select("*").eq("business_id", bizId).order("created_at", { ascending: false }),
        sb.from("page_items").select("*").eq("business_id", bizId).order("position"),
        sb.from("staff").select("*").eq("business_id", bizId),
        sb.from("surveys").select("*").eq("business_id", bizId).order("created_at"),
        sb.from("survey_responses").select("*, customers(name)").order("created_at"),
        sb.from("stamp_events").select("customer_id, kind, qty, by_user, source, location_id, created_at").eq("business_id", bizId).order("created_at", { ascending: false }),
      ]),
      Promise.all([sb.from("visits").select("visitor_id, kind, src, device, created_at").eq("business_id", bizId).gte("created_at", since).order("created_at", { ascending: false }).limit(5000), sb.from("visitor_leads").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(1000)]),
      loadRequests(), loadNetworks(), loadBilling(),
      // superadmin + itens de menu atribuídos + chatbot Forja (migração 20261024 — sem ela, fica tudo vazio e nada quebra)
      Promise.all([sb.rpc("is_platform_admin"), sb.from("nav_items").select("*").eq("business_id", bizId).eq("active", true).order("position"), sb.rpc("my_forja")]),
      sb.auth.getUser(),
    ]);
    const { data: biz, error } = bizR;
    if (error) throw error;
    // ATENÇÃO: a ordem dos nomes tem que ser a mesma das consultas abaixo (estava trocada: pesquisas recebiam as respostas e os carimbos recebiam as pesquisas)
    { const locs = locsR.data; CF.state.locations = (locs || []).map((l) => ({ id: l.id, name: l.name, address: l.address || "", phone: l.phone || "", active: l.active !== false, created: l.created_at })); }
    const [cards, customers, campaigns, items, staff, surveys, sresp, totals] = mainR;
    const S = CF.state, st = biz.settings || {};
    Object.assign(S.biz, { name: biz.name, slug: biz.slug, tagline: biz.tagline || "", address: biz.address || "", logo: biz.logo_url || S.biz.logo, cover: biz.cover_url || null, pageColor: biz.page_color || "#fef0c7", tz: biz.tz, currency: biz.currency, type: biz.type, legalType: st.legalType || "individual", legalName: st.legalName || "", privacyEmail: st.privacyEmail || "", customFields: st.customFields || [], visitFreq: st.visitFreq || "weekly", lang: st.lang || "pt-BR", pageBg: st.pageBg || { type: "color", colors: [biz.page_color || "#fef0c7", "#fce7f6"], angle: 160, image: null } });
    S.gmaps = st.gmaps || {}; // fichas do Google Maps (principal e filiais)
    CF.prospect = st.prospect || null; // página criada pela plataforma: em prévia (sem cadastro de clientes) até o dono ativar (migração 30)
    // visitantes da página pública (só leitura; tabela da migração 20261018 — se ainda não existir, fica "não disponível")
    const [vis, lds] = visR;
    S.visitors = { ready: !vis.error, visits: vis.data || [], leads: lds.data || [] };
    S.welcome = Object.assign({ mode: "off", qty: 1 }, st.welcome || {}); S.receipts = Object.assign({ on: true, phone: "" }, st.receipts || {});
    S.presence = Object.assign({ radius: 150 }, st.presence || {});
    if (st.share) S.share = Object.assign(S.share, st.share); if (st.print) S.print = Object.assign(S.print, st.print); if (st.birthday) S.birthday = Object.assign(S.birthday, st.birthday); if (st.google) S.google = Object.assign(S.google, st.google); if (st.onboarding) S.onboarding = Object.assign(S.onboarding, st.onboarding); if (st.monthlySends) S.monthlySends = st.monthlySends;
    S.plan = { name: planName(biz.plan), trial: biz.trial, billing: st.billing || "monthly", since: biz.created_at };
    S.cards = (cards.data || []).map((c) => ({ id: c.id, name: c.name, stamps: c.stamps, header: c.header, rewardText: c.reward_text, rewardLabel: c.reward_label, theme: c.theme || "classico", autoSeasonal: !!c.auto_seasonal, model: "premium", design: c.design && typeof c.design === "object" ? c.design : {}, active: c.active }));
    S.customers = (customers.data || []).map(mapCustomer);
    attachHistory(S.customers, totals.data || []);
    S.campaigns = (campaigns.data || []).map((k) => ({ id: k.id, tpl: k.tpl, title: k.title, notification: k.notification, header: k.header, text: k.card_text, audience: k.audience, reach: k.reach, style: k.style, banner: unpackFx(k.banner).banner, bannerFx: unpackFx(k.banner).bannerFx, created: k.created_at, endsAt: k.ends_at, status: k.status }));
    S.pageItems = (items.data || []).map((p) => ({ id: p.id, type: p.type, iconOnly: !!p.icon_only, onsite: !!p.onsite, title: p.title, body: p.body, label: p.label, url: p.url, items: p.items, date: p.created_at }));
    S.surveys = (surveys.data || []).map((v) => ({ id: v.id, title: v.title, status: v.status, created: v.created_at, archivedAt: v.archived_at, afterStamp: !!v.after_stamp, questions: v.questions || [], sent: 0,
      responses: ((sresp.data || []).filter((r) => r.survey_id === v.id)).map((r) => ({ customer: (r.customers && r.customers.name) || "Cliente", rating: r.rating, text: r.text || "", date: r.created_at })) }));
    S.staff = (staff.data || []).map((s) => ({ id: s.id, userId: s.user_id || null, name: s.name, email: s.email, status: s.status === "pending" ? "Convite pendente" : s.status === "active" ? "Ativo" : "Revogado", date: s.created_at, token: s.invite_token || "", locationId: s.location_id || null }));
    const ev = totals.data || []; S.totals = { stamps: ev.filter((e) => e.kind === "stamp").reduce((a, e) => a + e.qty, 0) - ev.filter((e) => e.kind === "undo").reduce((a, e) => a + e.qty, 0), redeemed: ev.filter((e) => e.kind === "redeem").length };
    const [adm, navi, fj] = extR;
    S.ext = { isAdmin: !adm.error && adm.data === true, nav: (navi.data || []).map((r) => (CF.ext && CF.ext.fromRow ? CF.ext.fromRow(r) : r)), forja: !fj.error && fj.data ? fj.data : null, ready: !navi.error };
    const u = userR.data; if (u && u.user) S.ownerId = u.user.id; if (u && u.user) S.user = { name: (u.user.user_metadata && u.user.user_metadata.name) || u.user.email.split("@")[0], email: u.user.email };
    snapshot = JSON.stringify(pick(S));
  }
  const pick = (S) => ({ locations: (S.locations || []).map((l) => ({ id: l.id, name: l.name, address: l.address, phone: l.phone, active: l.active !== false })), surveys: S.surveys.map((v) => ({ id: v.id, title: v.title, status: v.status, afterStamp: !!v.afterStamp, questions: v.questions, archivedAt: v.archivedAt })), biz: S.biz, plan: S.plan, cards: S.cards, customers: S.customers.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, birthday: c.birthday })), campaigns: S.campaigns, pageItems: S.pageItems, staff: S.staff, share: S.share, print: S.print, birthday: S.birthday, google: S.google, onboarding: S.onboarding, monthlySends: S.monthlySends, gmaps: S.gmaps || {}, welcome: S.welcome || {}, receipts: S.receipts || {}, presence: S.presence || {} });

  /* ------------------------------------------------------------ sincronização (write-through) */
  const toast = (m) => CF.toast(m, "err");
  let remapped = false;    // algum item novo ganhou o id do banco nesta rodada (a tela precisa ser redesenhada para os botões acharem o item)
  let syncAgain = false;   // houve edição enquanto gravava: roda de novo ao terminar (antes ela se perdia e o painel dizia "salvo")
  async function sync() {
    if (syncing) { syncAgain = true; return; } syncing = true; syncAgain = false;
    let startSnap = null;
    try {
      const S = CF.state, cur = pick(S), prev = snapshot ? JSON.parse(snapshot) : {};
      startSnap = JSON.stringify(cur);   // o que esta rodada vai gravar: é isto que vira o "já salvo", não o estado do fim
      const ch = (k) => JSON.stringify(cur[k]) !== JSON.stringify(prev[k]), staffMode = CF.state.role === "staff";
      if (!staffMode && (ch("biz") || ch("plan") || ["share", "print", "birthday", "google", "onboarding", "monthlySends", "gmaps", "welcome", "receipts", "presence"].some(ch))) {
        const b = S.biz, settings = { legalType: b.legalType, legalName: b.legalName, privacyEmail: b.privacyEmail, customFields: b.customFields, visitFreq: b.visitFreq, lang: b.lang, pageBg: b.pageBg, share: S.share, print: S.print, birthday: S.birthday, google: S.google, onboarding: S.onboarding, monthlySends: S.monthlySends, billing: S.plan.billing, gmaps: S.gmaps || {}, welcome: S.welcome || { mode: "off", qty: 1 }, receipts: S.receipts || { on: true, phone: "" }, presence: S.presence || { radius: 150 } };
        // o plano/teste NÃO é enviado: a coluna é travada no banco (só o servidor/pagamento altera)
        const { error } = await sb.from("businesses").update({ name: b.name, tagline: b.tagline, address: b.address, logo_url: b.logo && b.logo.indexOf("assets/") !== 0 ? b.logo : null, cover_url: b.cover, page_color: b.pageColor, tz: b.tz, currency: b.currency, type: b.type, settings }).eq("id", bizId);
        if (error) { console.warn("[sync] businesses", error.message); toast("Não deu para salvar as configurações. " + CF.humanError(error.message)); }
      }
      if (!staffMode && ch("cards")) await syncTable("cards", S.cards, prev.cards || [], (c) => ({ business_id: bizId, name: c.name, stamps: c.stamps, header: c.header, reward_text: c.rewardText, reward_label: c.rewardLabel, theme: c.theme || "classico", auto_seasonal: !!c.autoSeasonal, model: "premium", design: c.design || {}, active: c.active }));
      if (ch("customers")) {
        // novos clientes vindos do modal local, edições e exclusões
        await syncTable("customers", S.customers, prev.customers || [], (c) => ({ business_id: bizId, name: c.name, email: c.email || null, phone: c.phone || null, birthday: c.birthday || null }), (row, c) => { Object.assign(c, { token: row.token, code: row.code || "", created: row.created_at }); });
      }
      if (!staffMode && ch("campaigns")) await syncTable("campaigns", S.campaigns, prev.campaigns || [], (k) => ({ business_id: bizId, tpl: k.tpl, title: k.title, notification: k.notification, header: k.header, card_text: k.text, audience: k.audience, reach: k.reach, style: k.style, banner: packFx(k.banner, k.bannerFx), ends_at: k.endsAt, status: new Date(k.endsAt) > new Date() ? "active" : "ended" }));
      if (!staffMode && ch("pageItems")) await syncTable("page_items", S.pageItems, prev.pageItems || [], (p, i) => Object.assign({ business_id: bizId, type: p.type, icon_only: !!p.iconOnly, title: p.title, body: p.body || "", label: p.label || "", url: p.url || "", items: p.items || [], position: i }, onsiteCol || p.onsite ? { onsite: !!p.onsite } : {}));
      if (!staffMode && ch("surveys")) await syncTable("surveys", S.surveys, prev.surveys || [], (v) => ({ business_id: bizId, title: v.title, status: v.status, questions: v.questions || [], after_stamp: !!v.afterStamp, archived_at: v.archivedAt || null }));
      if (!staffMode && ch("locations")) await syncTable("locations", S.locations || [], prev.locations || [], (l, i) => ({ business_id: bizId, name: l.name, address: l.address || "", phone: l.phone || null, active: l.active !== false, position: i }));
      if (!staffMode && ch("staff")) await syncTable("staff", S.staff, prev.staff || [], (s) => Object.assign({ business_id: bizId, name: s.name, email: s.email, status: s.status === "Ativo" ? "active" : s.status === "Revogado" ? "revoked" : "pending", location_id: s.locationId || null }, s.token ? { invite_token: s.token } : {}), (row, s) => { if (row.invite_token) s.token = row.invite_token; });
      // se ninguém mexeu durante a gravação, o estado atual já está salvo; se mexeu, só o que foi lido no início está salvo e a rodada seguinte grava o resto
      snapshot = syncAgain ? startSnap : JSON.stringify(pick(S));
      if (!syncAgain) CF.saveStatus("saved");
      if (remapped) { remapped = false; const a = document.activeElement; if (!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) && !document.querySelector("#overlay-root .overlay")) CF.refresh(); }
    } catch (e) { console.error(e); CF.saveStatus("error"); toast("Não deu para salvar agora. Confira a conexão e tente de novo."); }
    finally { syncing = false; if (syncAgain) { syncAgain = false; setTimeout(sync, 0); } }
  }
  // upsert por id (uuid) / insert (id local) / delete (sumiu da lista)
  // mensagem técnica (Supabase/Postgres/rede) → frase em português para o lojista; o que não reconhece vira uma frase neutra
  CF.humanError = (m) => { m = String(m || "");
    if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
    if (/email not confirmed/i.test(m)) return "Confirme o seu e-mail (o link foi enviado quando a conta foi criada) e entre de novo.";
    if (/already registered|already been registered|user already/i.test(m)) return "Este e-mail já tem conta. Entre com ele.";
    if (/password.*(at least|short|weak)|weak password/i.test(m)) return "A senha precisa ter pelo menos 8 caracteres.";
    if (/rate limit|too many/i.test(m)) return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
    if (/failed to fetch|network|timeout|load failed/i.test(m)) return "Sem conexão agora. Confira a internet e tente de novo.";
    if (/client_limit_reached/i.test(m)) return "Limite de clientes do plano atingido.";
    if (/permission denied|row-level security|forbidden|not allowed/i.test(m)) return "Você não tem permissão para isso.";
    return "Não deu certo agora. Tente de novo em instantes."; };
  // erro do banco → frase para o lojista (o detalhe técnico vai só para o console)
  const TBL = { cards: "os cartões", customers: "os clientes", campaigns: "as campanhas", page_items: "os itens da página", staff: "os funcionários", surveys: "as pesquisas", locations: "as filiais" };
  const dbFail = (what, table, error) => { console.warn("[sync]", what, table, error && error.message); toast(`Não deu para ${what} ${TBL[table] || "os dados"} agora. Tente de novo em instantes.`); };
  async function syncTable(table, list, prevList, toRow, after) {
    const prevIds = new Set(prevList.map((x) => x.id)), curIds = new Set(list.map((x) => x.id));
    for (const id of prevIds) if (!curIds.has(id) && isUuid(id)) { const { error } = await sb.from(table).delete().eq("id", id); if (error) dbFail("excluir", table, error); }
    // estado "como vai para o banco" desta tabela (todas as tabelas sincronizadas precisam estar aqui — "surveys" faltava e quebrava a gravação das pesquisas)
    const KEY = { cards: "cards", customers: "customers", campaigns: "campaigns", page_items: "pageItems", staff: "staff", surveys: "surveys", locations: "locations" };
    const curPicked = pick(CF.state)[KEY[table]] || [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i], prevItem = prevList.find((x) => x.id === item.id), curItem = curPicked.find((x) => x.id === item.id);
      if (prevItem && curItem && JSON.stringify(prevItem) === JSON.stringify(curItem) && (table !== "page_items" || prevList.indexOf(prevItem) === i)) continue; // sem mudança (na página, a posição também conta)
      const row = toRow(item, i);
      const noCol = (er) => er && "onsite" in row && /onsite/.test(er.message || "") && ((onsiteCol = false), row.onsite && onsiteWarn(), delete row.onsite, true);
      if (isUuid(item.id)) { let { error } = await sb.from(table).update(row).eq("id", item.id); if (noCol(error)) ({ error } = await sb.from(table).update(row).eq("id", item.id)); if (error) dbFail("salvar", table, error); }
      else {
        let { data, error } = await sb.from(table).insert(row).select().single(); if (noCol(error)) ({ data, error } = await sb.from(table).insert(row).select().single());
        if (error) { dbFail("criar", table, error); continue; }
        const oldId = item.id; item.id = data.id; after && after(data, item); remapped = true;   // a tela ainda mostra o id local: redesenha ao fim da gravação
        // remapeia referências ao id local (ex.: hash da rota aberta)
        if (location.hash.indexOf(oldId) >= 0) history.replaceState(null, "", location.hash.replace(oldId, data.id));
      }
    }
  }
  // a coluna page_items.onsite só existe depois da migração 20261022: sem ela, grava o resto e avisa só quem marcou "só no local"
  let onsiteCol = true, onsiteWarned = false; const onsiteWarn = () => { if (!onsiteWarned) { onsiteWarned = true; toast("“Só no local” precisa da atualização do banco (Atualizar banco (Supabase).bat). O resto foi salvo."); } };
  const origUpdate = CF.update;
  const scheduleSync = CF.debounce(sync, 400);
  CF.update = (fn) => { origUpdate(fn); if (!CF.autosave()) return CF.saveStatus("dirty"); CF.saveStatus("saving"); scheduleSync(); };
  CF.save = () => { if (!CF.autosave()) { CF.saveStatus("dirty"); return true; } scheduleSync(); return true; }; // nada vai mais para o localStorage; sem autosave, só o botão Salvar sincroniza
  CF.saveNow = async () => { CF.saveStatus("saving"); for (let i = 0; i < 40 && syncing; i++) await new Promise((r) => setTimeout(r, 100)); await sync(); };
  CF.deleteLead = async (id) => { const { error } = await sb.from("visitor_leads").delete().eq("id", id); if (error) return toast("Não foi possível excluir: " + error.message); CF.state.visitors.leads = CF.state.visitors.leads.filter((x) => x.id !== id); CF.refresh(); };
  CF.resetDemo = () => CF.toast("Com o servidor conectado, os dados de exemplo não se aplicam.", "err");

  /* ------------------------------------------------------------ operações críticas → RPC */
  // histórico de carimbos por cliente (data/hora + quem deu): by_user → funcionário em staff, senão o dono logado
  const whoName = (uid, source) => { if (source === "scan" && !uid) return "Scanner"; if (source === "welcome" && !uid) return "Automático"; const st = (CF.state.staff || []).find((x) => x.userId && x.userId === uid); if (st) return st.name; if (CF.state.ownerId && uid === CF.state.ownerId) return CF.state.user.name; return uid ? (CF.state.user && CF.state.user.name) || "Equipe" : "Cliente"; };
  const attachHistory = (customers, events) => { const by = {}; events.forEach((e) => { (by[e.customer_id] = by[e.customer_id] || []).push({ kind: e.kind, qty: e.qty, at: e.created_at, by: whoName(e.by_user, e.source), source: e.source, loc: e.location_id || null }); }); customers.forEach((c) => { c.history = by[c.id] || []; }); };
  const reloadCustomer = async (id) => {
    const { data } = await sb.from("customers").select("*, customer_cards(*)").eq("id", id).single();
    if (!data) return; const i = CF.state.customers.findIndex((c) => c.id === id);
    const oldHist = i >= 0 ? CF.state.customers[i].history || [] : [];   // antes de trocar o objeto: serve para ajustar os totais pela diferença
    if (i >= 0) CF.state.customers[i] = mapCustomer(data); else CF.state.customers.unshift(mapCustomer(data)); // cliente novo (cadastro pela página)
    // só os eventos DESTE cliente (antes baixava o negócio inteiro a cada carimbo: com 2.000 clientes, ~20 mil linhas por clique)
    const { data: ev } = await sb.from("stamp_events").select("customer_id, kind, qty, by_user, source, location_id, created_at").eq("customer_id", id).order("created_at", { ascending: false });
    if (ev) { const c = CF.state.customers.find((x) => x.id === id); if (c) attachHistory([c], ev);
      const sum = (list) => ({ s: list.filter((e) => e.kind === "stamp").reduce((a, e) => a + e.qty, 0) - list.filter((e) => e.kind === "undo").reduce((a, e) => a + e.qty, 0), r: list.filter((e) => e.kind === "redeem").length }), a = sum(oldHist), b = sum(ev);
      const t = CF.state.totals || { stamps: 0, redeemed: 0 }; CF.state.totals = { stamps: Math.max(0, t.stamps + b.s - a.s), redeemed: Math.max(0, t.redeemed + b.r - a.r) }; }
    snapshot = JSON.stringify(pick(CF.state));
  };
  const locArg = () => { const l = CF.currentLocation ? CF.currentLocation() : ""; return l ? { p_location: l } : {}; };
  const locErr = (m) => (/give_stamp.*does not exist|location/i.test(m) ? "Carimbar por filial precisa da atualização do banco (Atualizar banco (Supabase).bat)." : CF.humanError(m));
  // números por filial (RPC location_stats); devolve true quando mudou algo
  CF.loadLocationStats = async () => { const { data, error } = await sb.rpc("location_stats", { p_business: bizId }); if (error || !Array.isArray(data)) return false; const before = JSON.stringify(CF.state.locStats); CF.state.locStats = data; return before !== JSON.stringify(data); };
  CF.giveStamp = (customerId, qty = 1) => { // chamado de forma síncrona pelas páginas: devolve resultado otimista e confirma via RPC
    const c = CF.state.customers.find((x) => x.id === customerId), card = CF.card(); if (!c) return null;
    const room = card.stamps - c.stamps, add = Math.max(0, Math.min(qty, room)), prevLast = c.last;
    c.stamps += add; c.total += add; c.last = new Date().toISOString(); CF.state.totals.stamps += add; CF.state.onboarding.stamped = true;
    sb.rpc("give_stamp", Object.assign({ p_customer: customerId, p_qty: qty }, locArg())).then(({ error }) => { if (error) { toast("Carimbo não registrado. " + locErr(error.message)); } else walletSync(customerId); reloadCustomer(customerId).then(() => CF.refresh()); });
    return { name: c.name, added: add, requested: qty, full: c.stamps >= card.stamps, prevLast };
  };
  CF.undoStamp = (customerId) => { sb.rpc("undo_last_stamp", { p_customer: customerId }).then(({ data, error }) => { if (error) toast("Não foi possível desfazer. " + CF.humanError(error.message)); else walletSync(customerId); reloadCustomer(customerId).then(() => CF.refresh()); }); };
  CF.redeem = (customerId) => {
    const c = CF.state.customers.find((x) => x.id === customerId), card = CF.card(); if (!c || c.stamps < card.stamps) return false;
    c.stamps = 0; CF.state.totals.redeemed++;
    sb.rpc("redeem_reward", { p_customer: customerId }).then(({ error }) => { if (error) toast("Resgate não registrado. " + CF.humanError(error.message)); else walletSync(customerId); reloadCustomer(customerId).then(() => CF.refresh()); });
    return true;
  };
  // link público real (usado no QR, no compartilhar e na página)
  const pubBase = () => cfg.publicBase || location.origin + location.pathname.replace(/[^/]*$/, "");
  CF.publicUrl = (src) => CF.withSrc(pubBase() + "c/?s=" + encodeURIComponent(CF.state.biz.slug), src); // src: de onde veio (qr, link, whatsapp…)
  CF.cardUrl = (c) => (c && c.token ? pubBase() + "c/?t=" + encodeURIComponent(c.token) : "");

  /* ------------------------------------------------------------ pedidos de carimbo (boas-vindas / comprovante) */
  CF.decideRequest = async (id, approve) => {
    const r = (CF.state.requests || []).find((x) => x.id === id);
    const { data, error } = await sb.rpc("decide_stamp_request", { p_request: id, p_approve: !!approve });
    if (error) return { ok: false, error: error.message };
    if (data && (data.ok || data.status)) CF.state.requests = (CF.state.requests || []).filter((x) => x.id !== id); // decidido aqui ou em outro aparelho
    if (r && approve && data && data.ok) { await reloadCustomer(r.customerId); walletSync(r.customerId); }
    return data || { ok: false };
  };

  /* ------------------------------------------------------------ conteúdo só no local: redes Wi-Fi da loja */
  const netErr = (m) => (/rede_desconhecida/.test(m) ? "Não deu para identificar a rede. Tente de novo conectado ao Wi-Fi da loja." : /limite_de_redes/.test(m) ? "Já são 10 redes cadastradas. Remova uma antes." : /function|schema cache|not find/i.test(m) ? "Esta função precisa da atualização do banco (Atualizar banco (Supabase).bat)." : m);
  CF.registerNetwork = async (label) => { const { data, error } = await sb.rpc("register_network", { p_business: bizId, p_label: label || null }); if (error) return { ok: false, error: netErr(error.message) }; await loadNetworks(); return data || { ok: true }; };
  CF.removeNetwork = async (id) => { const { error } = await sb.from("business_networks").delete().eq("id", id); if (error) return { ok: false, error: error.message }; await loadNetworks(); return { ok: true }; };

  /* ------------------------------------------------------------ integrações: webhooks (migração 20261023) */
  const whRow = (w) => ({ id: w.id, url: w.url, events: w.events || [], secret: w.secret, active: w.active, fails: w.fails, lastStatus: w.last_status, lastError: w.last_error, lastAt: w.last_at, created: w.created_at });
  const whErr = (error) => ({ error: error && (error.message || String(error)) });
  CF.webhooks = {
    demo: false,
    list: async () => { const { data, error } = await sb.from("webhooks").select("id,url,events,secret,active,fails,last_status,last_error,last_at,created_at").eq("business_id", bizId).order("created_at"); return error ? whErr(error) : (data || []).map(whRow); },
    add: async (url, events) => { const { data, error } = await sb.from("webhooks").insert({ business_id: bizId, url, events }).select().single(); return error ? whErr(error) : { ok: true, item: whRow(data) }; },
    update: async (id, patch) => { const { error } = await sb.from("webhooks").update(patch).eq("id", id); return error ? whErr(error) : { ok: true }; },
    remove: async (id) => { const { error } = await sb.from("webhooks").delete().eq("id", id); return error ? whErr(error) : { ok: true }; },
    test: async (id) => { const { error } = await sb.rpc("webhook_test", { p_webhook: id }); return error ? whErr(error) : { ok: true }; },
    rotate: async (id) => { const { data, error } = await sb.rpc("webhook_rotate_secret", { p_webhook: id }); return error ? whErr(error) : { ok: true, secret: data }; },
    deliveries: async (id) => { const { data, error } = await sb.from("webhook_deliveries").select("id,event,status,response_code,attempts,error,created_at").eq("webhook_id", id).order("created_at", { ascending: false }).limit(30);
      return error ? whErr(error) : (data || []).map((d) => ({ id: d.id, event: d.event, status: d.status, code: d.response_code, attempts: d.attempts, error: d.error || "", at: d.created_at })); },
  };

  /* ------------------------------------------------------------ plano Pro pela Stripe (função billing, migração 20261023000200_billing) */
  // o navegador nunca muda o plano: abre o Checkout/Portal da Stripe e relê o banco depois que o aviso (webhook) da Stripe chega
  const payErr = "Não foi possível falar com o servidor. Tente de novo.";
  // só segue para páginas de pagamento conhecidas: Stripe, Asaas, Mercado Pago ou a página do Pix deste app (pagar/?c=…)
  const payUrl = (u) => (typeof u === "string" && (/^https:\/\/([a-z0-9-]+\.)*(stripe\.com|asaas\.com|mercadopago\.com(\.br)?|mercadolivre\.com(\.br)?)\//i.test(u)
    || /^https?:\/\/[^/?#]+\/(?:[^?#]*\/)?pagar\/\?c=[A-Za-z0-9_-]{16,64}$/.test(u) && (/^https:/.test(u) || new URL(u).host === location.host)) ? u : null);
  async function payCall(route, body) {
    try {
      const { data, error } = await sb.functions.invoke("billing/" + route, { body: body || {} });
      if (error) { let m = ""; try { const j = await error.context.json(); m = j && j.error; } catch (e) {} return { error: m || payErr }; }
      return payUrl(data && data.url) ? { url: data.url } : { error: payErr };
    } catch (e) { return { error: payErr }; }
  }
  async function loadBilling() { // sem a migração de billing a tabela não existe: fica "sem assinatura"
    let { data, error } = await sb.from("billing_accounts").select("status, billing_interval, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, provider, auto_renew, method, amount").eq("business_id", bizId).limit(1);
    if (error) ({ data, error } = await sb.from("billing_accounts").select("status, billing_interval, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id").eq("business_id", bizId).limit(1));   // antes da migração 29
    CF.billing.account = !error && data && data[0] ? data[0] : null;
  }
  CF.billing = { demo: false, info: null, account: null, checkout: (interval) => payCall("checkout", { interval }), portal: () => payCall("portal") };
  const onBilling = () => /^#\/billing/.test(location.hash || "") && !document.querySelector("#overlay-root .overlay");
  const billingCheck = () => fetch(cfg.url.replace(/\/$/, "") + "/functions/v1/billing/status").then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    .then((j) => { CF.billing.info = { enabled: !!(j && j.enabled), yearly: !(j && j.yearly === false), provider: (j && j.provider) || "stripe", providers: (j && j.providers) || null, prices: (j && j.prices) || null }; if (onBilling()) CF.refresh(); });
  // relê o plano no banco (só o servidor muda: pagamento confirmado pela Stripe). Não regrava nada.
  CF.refreshPlan = async () => {
    const { data } = await sb.from("businesses").select("plan, trial").eq("id", bizId).single();
    if (data) { const P = CF.state.plan; P.name = planName(data.plan); P.trial = data.trial;
      if (snapshot) { const prev = JSON.parse(snapshot); prev.plan = JSON.parse(JSON.stringify(P)); snapshot = JSON.stringify(prev); } }
    await loadBilling();
    return CF.isPremium();
  };
  // volta da Stripe (?stripe=ok | cancel). O aviso da Stripe pode chegar uns segundos depois da volta: confere o plano algumas vezes
  // ?pay=ok|pending|cancel: mesma volta, vinda do Asaas ou do Mercado Pago (Pix e boleto podem levar mais tempo para confirmar)
  async function stripeReturn() {
    const q = new URLSearchParams(location.search), viaStripe = q.has("stripe"), st = q.get("stripe") || q.get("pay"); if (!st) return;
    q.delete("stripe"); q.delete("pay"); try { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash); } catch (e) {}
    if (st === "pending") return CF.toast("Pagamento em processamento. O Pro é ativado assim que o pagamento for confirmado.", "ok", { ms: 9000 });
    if (st !== "ok") return CF.toast("Pagamento não concluído. Nada foi cobrado.", "err");
    for (let i = 0; i < 20; i++) {
      if (await CF.refreshPlan()) { if (!document.querySelector("#overlay-root .overlay")) CF.refresh(); else if (CF.repaintShell) CF.repaintShell(); return CF.toast("Pagamento confirmado. Seu plano Pro está ativo!", "ok", { ms: 7000 }); }
      if (i === 0) CF.toast(viaStripe ? "Pagamento recebido. Confirmando com a Stripe…" : "Pagamento recebido. Confirmando…", "ok", { ms: 5000 });
      await new Promise((r) => setTimeout(r, 2000));
    }
    CF.toast(viaStripe ? "A confirmação da Stripe está demorando. Atualize a página daqui a pouco." : "A confirmação está demorando. Atualize a página daqui a pouco.", "err", { ms: 9000 });
  }

  /* ------------------------------------------------------------ página em prévia (criada pela plataforma, migração 30) */
  // o dono entra com o acesso que recebeu; a página fica sem cadastro de clientes até ele ativar (começa o teste grátis)
  CF.isPreview = () => !!(CF.prospect && CF.prospect.status === "preview");
  CF.actions = CF.actions || {};
  CF.actions["activate-page"] = () => CF.confirm({ title: "Ativar sua página?",
    text: "Os clientes passam a poder pedir o cartão pela sua página e pelo QR code, e o seu teste grátis de 21 dias começa hoje. Nada é cobrado.",
    ok: "Ativar minha página", async onOk() {
      const { data, error } = await sb.rpc("owner_activate_business");
      if (error || !data || !data.ok) return CF.toast("Não foi possível ativar agora. Tente de novo.", "err");
      CF.prospect = Object.assign({}, CF.prospect, { status: "claimed" });
      await CF.refreshPlan(); CF.toast("Página ativada! Os clientes já podem pedir o cartão.", "ok", { ms: 7000 });
      if (CF.repaintShell) CF.repaintShell(); CF.refresh();
    } });

  /* ------------------------------------------------------------ superadmin + Forja (migração 20261024): RPCs admin_* e a função forja-proxy */
  // ext.js (carregado depois) usa isto quando não há servidor local. O token dos bots nunca passa por aqui: só vai (via RPC) e nunca volta.
  CF.ext = CF.ext || {};
  const rpcOrThrow = async (name, args) => { const { data, error } = await sb.rpc(name, args); if (error) throw new Error(/forbidden/.test(error.message) ? "Só o superadmin pode fazer isso." : /does not exist|schema cache/.test(error.message) ? "Esta função precisa da atualização do banco (Atualizar banco (Supabase).bat)." : error.message); return data; };
  CF.ext.remote = {
    businesses: () => rpcOrThrow("admin_businesses"),
    business: (id) => rpcOrThrow("admin_business", { p_business: id }),
    setNav: (id, items) => rpcOrThrow("admin_set_nav", { p_business: id, p_items: items.map((n) => ({ group_label: n.group_label, label: n.label, icon: n.icon, kind: n.kind, target: n.target, active: n.active !== false })) }),
    upsertForja: (id, name, base_url, token, tier) => rpcOrThrow("admin_upsert_forja", { p_business: id, p_name: name, p_base_url: base_url, p_token: token || null, p_tier: tier || "free" }),
    removeForja: (id) => rpcOrThrow("admin_remove_forja", { p_business: id }),
    forjaMetrics: async (id, range, kind) => { const { data, error } = await sb.functions.invoke("forja-proxy", { body: { action: kind === "health" ? "health" : "metrics", business: id && id !== "demo-biz" ? id : undefined, range: range || "7d" } });
      if (error) { let msg = error.message || "Não foi possível falar com o chatbot."; try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) {} return { ok: false, error: msg, instance: null }; } return data || { ok: false, error: "Sem resposta." }; },
  };

  /* ------------------------------------------------------------ carimbar pela câmera (#/scan): QR do cartão ou código curto → mesmas RPCs do app/scan.html */
  CF.stampScan = async (raw, qty = 1) => {
    const p = (CF.parseScan || ((s) => ({ token: String(s || "").trim() })))(raw); if (!p.code && !p.token) return { ok: false, error: "Nada lido. Aponte para o QR do cartão ou digite o código." };
    const { data, error } = p.isCode ? await sb.rpc("give_stamp_by_code", Object.assign({ p_code: p.code, p_qty: qty }, locArg())) : await sb.rpc("give_stamp_by_token", Object.assign({ p_token: p.token, p_qty: qty }, locArg()));
    if (error) { const m = error.message || "";
      const msg = /no active card/i.test(m) ? "Este negócio está sem cartão ativo. Ative um em Gerenciar cartões e tente de novo."
        : /cartão não encontrado|token inválido|not_found|inexistente|no rows/i.test(m) ? (p.isCode ? "Código não encontrado. Confira as 6 letras/números com o cliente." : "Este QR não é de um cartão deste negócio.")
        : /forbidden|not authenticated/i.test(m) ? "Entre no painel de novo para carimbar." : m;
      return { ok: false, error: msg, noCard: /no active card/i.test(m) }; }
    const r = data && data[0]; if (!r) return { ok: false, error: p.isCode ? "Código não encontrado." : "Cartão não encontrado." };
    // a RPC devolve só o nome: acha o cliente no estado pelo código/token para atualizar a lista e o passe da carteira
    const c = CF.state.customers.find((x) => (p.isCode ? String(x.code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase() === p.code : x.token === p.token));
    let cid = c ? c.id : null;
    if (c) { reloadCustomer(c.id).then(() => CF.repaintShell && CF.repaintShell()); walletSync(c.id); }
    else { const { data: row } = await sb.from("customers").select("id").eq("business_id", bizId).eq(p.isCode ? "code" : "token", p.isCode ? p.code : p.token).maybeSingle(); if (row) { cid = row.id; await reloadCustomer(row.id); walletSync(row.id); CF.repaintShell && CF.repaintShell(); } }
    return { ok: true, name: r.customer_name, added: r.added || 0, stamps: r.stamps, cardStamps: r.card_stamps, full: !!r.full, customerId: cid };
  };

  /* ------------------------------------------------------------ carteiras (Google/Apple): atualiza o passe salvo após cada carimbo */
  let walletOn = false;
  const walletSync = (customerId) => { if (!walletOn || !customerId) return; try { sb.functions.invoke("wallet-pass", { body: { action: "sync", customer: customerId } }).then(() => {}, () => {}); } catch (e) {} };
  const walletCheck = () => fetch(cfg.url.replace(/\/$/, "") + "/functions/v1/wallet-pass?status=1").then((r) => (r.ok ? r.json() : {})).then((j) => { walletOn = !!(j.google || j.apple); CF.wallet = { google: !!j.google, apple: !!j.apple }; }, () => {});

  /* ------------------------------------------------------------ menu do usuário: sair */
  CF.actions.logout = async () => { await sb.auth.signOut(); location.reload(); };

  /* ------------------------------------------------------------ boot */
  const origBoot = CF.boot;
  async function start() {
    document.body.innerHTML = window.CF_SPLASH ? window.CF_SPLASH() : `<div class="app" style="justify-content:center;align-items:center"><p class="muted">Carregando seus dados…</p></div>`;
    try {
      // ativação primeiro: assim o dono abre direto na página que recebeu (e não ganha um negócio vazio)
      if (claimTok) {
        const { data: cl, error: ce } = await sb.rpc("claim_business", { p_token: claimTok });
        if (ce && !/not authenticated|fetch|network/i.test(ce.message)) { CF.claimMsg = [claimErr(ce.message), "err"]; dropClaim(); }
        else if (cl && cl.ok) { CF.claimMsg = [`Página de ${cl.name} ativada. Ela agora é sua: os clientes já podem pedir o cartão.`, "ok"]; dropClaim(); }
      }
      if (staffTok) {
        const { data: sa, error: se } = await sb.rpc("staff_accept", { p_token: staffTok });
        if (se && /function|schema cache|not find/i.test(se.message)) { CF.claimMsg = ["Os convites da equipe precisam da atualização do banco (Atualizar banco (Supabase).bat).", "err"]; dropStaffTok(); }
        else if (se && !/not authenticated|fetch|network/i.test(se.message)) { CF.claimMsg = [CF.humanError(se.message), "err"]; dropStaffTok(); }
        else if (sa) { CF.claimMsg = sa.ok ? [`Você entrou na equipe de ${sa.business}. Bem-vindo(a), ${sa.name}!`, "ok"] : [sa.error === "used" ? "Este convite já foi usado por outra conta." : sa.error === "revoked" ? "Este convite foi cancelado." : "Convite inválido.", "err"]; dropStaffTok(); }
      }
      // dono do próprio negócio, ou funcionário de um negócio (aí NÃO se cria um negócio vazio para ele)
      let ws = null; { const { data: w, error: we } = await sb.rpc("my_workspace"); if (!we && w && w.role && w.role !== "none") ws = w; }
      if (ws && ws.role === "staff") { bizId = ws.business_id; CF.bizId = bizId; CF.state.role = "staff"; CF.state.staffMe = { id: ws.staff_id, name: ws.name || "", locationId: ws.location_id || null, location: ws.location || "" }; }
      else { const { data, error } = await sb.rpc("ensure_business", { p_name: CF.pendingBizName || null }); if (error) throw error; bizId = data; CF.bizId = bizId; CF.state.role = "owner"; }
      const role = CF.state.role, staffMe = CF.state.staffMe;
      await load();
      CF.state.role = role; if (role === "staff") { CF.state.staffMe = staffMe; if (staffMe.name) CF.state.user.name = staffMe.name; }
      origBoot();
      if (CF.claimMsg) { CF.toast(CF.claimMsg[0], CF.claimMsg[1], { ms: 9000 }); CF.claimMsg = null; }
      walletCheck(); if (CF.state.role !== "staff") { billingCheck(); stripeReturn(); }
      // tempo real (migração 20261021 põe as tabelas na publicação do Realtime; o RLS garante que só chega o que é do negócio):
      // carimbo dado em outro aparelho, cliente novo pela página e pedido de carimbo. Redesenha só as telas que mostram esses
      // dados, e nunca no meio de uma digitação (aí só o menu, com o contador de pedidos, é atualizado).
      const soft = () => { const h = (location.hash || "#/").slice(1).split("?")[0] || "/", a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "checkbox";
        if ((h === "/" || h === "/customers") && !typing && !document.querySelector("#overlay-root .overlay")) CF.refresh(); else if (CF.repaintShell) CF.repaintShell(); };
      const F = "business_id=eq." + bizId;
      sb.channel("cf-" + bizId)
        .on("postgres_changes", { event: "*", schema: "public", table: "stamp_events", filter: F }, (p) => { const ev = p.new || {}, id = ev.customer_id; if (!id) return; reloadCustomer(id).then(() => { soft();
          if (p.eventType === "INSERT" && ev.by_user !== CF.state.ownerId) { const c = CF.state.customers.find((x) => x.id === id), nm = (c && c.name) || "Cliente";
            if (ev.kind === "stamp") CF.notify("Novo carimbo", `${nm} ganhou ${ev.qty > 1 ? ev.qty + " carimbos" : "um carimbo"}.`);
            else if (ev.kind === "redeem") CF.notify("Recompensa resgatada", `${nm} resgatou a recompensa.`); } }); })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "customers", filter: F }, (p) => { const c = p.new || {}; if (!c.id || CF.state.customers.some((x) => x.id === c.id)) return;
          reloadCustomer(c.id).then(() => { soft(); const nm = c.name || "Cliente", msg = `${nm} pegou o cartão pela sua página.`;
            CF.toast("Cliente novo: " + msg, "ok", { action: "Ver", onAction: () => CF.go("/customers") }); CF.notify("Cliente novo", msg); }); })
        .on("postgres_changes", { event: "*", schema: "public", table: "stamp_requests", filter: F }, async (p) => { const r = p.new || {};
          if (r.customer_id && !CF.state.customers.some((x) => x.id === r.customer_id)) await reloadCustomer(r.customer_id);
          await loadRequests(); soft();
          if (p.eventType === "INSERT" && r.status === "pending") { const c = CF.state.customers.find((x) => x.id === r.customer_id), nm = (c && c.name) || "Cliente";
            const msg = r.kind === "welcome" ? `${nm} se cadastrou e espera o carimbo de boas-vindas.` : `${nm} pediu carimbo pelo comprovante no WhatsApp.`;
            CF.toast(msg, "ok", { action: "Ver pedidos", onAction: () => CF.go("/customers?f=requests") }); CF.notify("Pedido de carimbo", msg); } })
        .subscribe();
    } catch (e) { console.error(e); loginScreen("Erro ao carregar: " + (e.message || e)); }
  }
  CF.boot = async () => {
    const { data } = await sb.auth.getSession();
    if (data.session && recovering) { if (!recoveryShown) { recoveryShown = true; newPasswordScreen(); } return; }
    if (recoveryShown) return;
    if (data.session) start(); else loginScreen();
  };
})();
