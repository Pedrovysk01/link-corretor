// Painel da plataforma (app/admin/) — o que precisa da service_role: criar a CONTA do dono (convite por e-mail) e o negócio.
//   POST { action: "create-business", email, name, plan?, trial?, model? }
//   POST { action: "bulk-create", rows: [{ email, name, plan?, trial? }], model? }        (até 50 por chamada)
//   → { ok, results: [{ email, ok, business_id, slug, user_id, invited, link?, error? }] }
//   POST { action: "set-password", user_id, password, business_id? }      → troca a senha (mín. 8)
//   POST { action: "recovery-link" | "magic-link", user_id, business_id? } → link de redefinição / de acesso (para mandar por WhatsApp)
//   POST { action: "send-recovery", user_id, business_id? }               → e-mail de redefinição (precisa do SMTP do Supabase)
//   POST { action: "set-email", user_id, email, business_id? }            → troca o e-mail de login (ex.: o temporário pelo real), já confirmado
//   Não mexe no acesso de outro superadmin nem da conta técnica de prospecção. Tudo vai para admin_audit.
// SEGURANÇA: só usuário logado que está em platform_admins. O convite sai pelo e-mail do Supabase (Auth › SMTP); se o dono já
// tem conta, só o negócio é criado e devolvemos um link de acesso (magic link) para você mandar por outro canal.
// Publicar: npx supabase functions deploy admin-api   ·   Detalhes: docs/ADMIN.md

const env = (k: string) => (Deno.env.get(k) || "").trim();
const SB_URL = env("SUPABASE_URL").replace(/\/$/, "");
const SERVICE = env("SUPABASE_SERVICE_ROLE_KEY");
const ANON = env("SUPABASE_ANON_KEY");
const APP = (env("PUBLIC_APP_URL") || "").replace(/#.*$/, "");
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (code: number, obj: unknown) => new Response(JSON.stringify(obj), { status: code, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

const call = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${SB_URL}${path}`, { ...init, headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  const t = await r.text(); let d: any = null; try { d = t ? JSON.parse(t) : null; } catch { d = { message: t }; }
  return { ok: r.ok, status: r.status, data: d };
};
const rpc = async (name: string, args: Record<string, unknown>) => { const r = await call(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) }); if (!r.ok) throw new Error(r.data?.message || `HTTP ${r.status}`); return r.data; };

// conta do dono: convida por e-mail; se já existe, devolve o id e um link de acesso (sem mandar e-mail)
async function ownerFor(email: string, name: string) {
  const inv = await call("/auth/v1/invite", { method: "POST", body: JSON.stringify({ email, data: { business_name: name, name: "" }, ...(APP ? { redirect_to: APP } : {}) }) });
  if (inv.ok && inv.data?.id) return { id: inv.data.id as string, invited: true, link: null as string | null };
  const msg = String(inv.data?.msg || inv.data?.message || inv.data?.error_description || "");
  if (!/already|registered|exists/i.test(msg) && inv.status !== 422) throw new Error("Convite falhou: " + (msg || `HTTP ${inv.status}`));
  const ml = await call("/auth/v1/admin/generate_link", { method: "POST", body: JSON.stringify({ type: "magiclink", email, ...(APP ? { redirect_to: APP } : {}) }) });
  if (!ml.ok || !ml.data?.user?.id) throw new Error("Dono já cadastrado, mas não foi possível gerar o link de acesso: " + (ml.data?.message || ml.data?.msg || `HTTP ${ml.status}`));
  return { id: ml.data.user.id as string, invited: false, link: (ml.data.action_link as string) || null };
}

async function createOne(row: any, model: unknown) {
  const email = String(row?.email || "").trim().toLowerCase(), name = String(row?.name || "").trim();
  if (!EMAIL.test(email)) return { email, ok: false, error: "E-mail inválido." };
  if (name.length < 2) return { email, ok: false, error: "Informe o nome do negócio." };
  const plan = ["free", "pro", "business", "multi"].includes(row?.plan) ? row.plan : "free";
  const trial = row?.trial == null ? true : !!row.trial;
  try {
    const o = await ownerFor(email, name);
    const r = await rpc("admin_create_business", { p_owner: o.id, p_name: name, p_plan: plan, p_trial: trial, p_model: model || null });
    return { email, ok: true, business_id: r.id, slug: r.slug, user_id: o.id, invited: o.invited, link: o.link };
  } catch (e) { return { email, ok: false, error: (e as Error).message || String(e) }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Use POST." });
  if (!SERVICE || !SB_URL) return json(500, { error: "Função sem SUPABASE_SERVICE_ROLE_KEY." });
  const auth = req.headers.get("Authorization") || "";
  const ur = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: auth } });
  if (!ur.ok) return json(401, { error: "Entre no painel da plataforma." });
  const user = await ur.json(); const uid: string = user?.id || "";
  if (!uid) return json(401, { error: "Entre no painel da plataforma." });
  const adm = await call(`/rest/v1/platform_admins?select=user_id&user_id=eq.${uid}`);
  if (!adm.ok || !Array.isArray(adm.data) || !adm.data.length) return json(403, { error: "Só o superadmin da plataforma pode criar estabelecimentos." });

  let body: any = {}; try { body = await req.json(); } catch { body = {}; }

  // ---------- acesso dos usuários (suporte): trocar senha, link de redefinição, e-mail de redefinição, link de acesso
  if (["set-password", "recovery-link", "send-recovery", "magic-link", "set-email"].includes(body.action)) {
    const target = String(body.user_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(target)) return json(400, { error: "Usuário inválido." });
    const u = await call(`/auth/v1/admin/users/${target}`);
    if (!u.ok || !u.data?.email) return json(404, { error: "Usuário não encontrado." });
    const email: string = u.data.email;
    const isAdm = await call(`/rest/v1/platform_admins?select=user_id&user_id=eq.${target}`);
    if (target !== uid && Array.isArray(isAdm.data) && isAdm.data.length) return json(403, { error: "Não dá para mexer no acesso de outro superadmin." });
    const pc = await call(`/rest/v1/platform_config?select=value&key=eq.prospect_owner`);
    if (Array.isArray(pc.data) && pc.data[0] && String(pc.data[0].value) === target) return json(403, { error: "Esta é a conta técnica que guarda as páginas em preparação; ela não tem acesso." });
    const log = (details: Record<string, unknown>) => call(`/rest/v1/admin_audit`, { method: "POST", body: JSON.stringify({ user_id: uid, action: body.action.replace("-", "_"), business_id: /^[0-9a-f-]{36}$/i.test(body.business_id || "") ? body.business_id : null, details: { email, ...details } }) });
    if (body.action === "set-password") {
      const pw = String(body.password || "");
      if (pw.length < 8) return json(400, { error: "A senha precisa ter pelo menos 8 caracteres." });
      const r = await call(`/auth/v1/admin/users/${target}`, { method: "PUT", body: JSON.stringify({ password: pw, email_confirm: true }) });
      if (!r.ok) return json(400, { error: "Não foi possível trocar a senha: " + (r.data?.msg || r.data?.message || `HTTP ${r.status}`) });
      await log({}); return json(200, { ok: true, email });
    }
    if (body.action === "set-email") {
      const novo = String(body.email || "").trim().toLowerCase();
      if (!EMAIL.test(novo) || novo.length > 254) return json(400, { error: "E-mail inválido." });
      if (novo === email.toLowerCase()) return json(400, { error: "É o mesmo e-mail de agora." });
      const r = await call(`/auth/v1/admin/users/${target}`, { method: "PUT", body: JSON.stringify({ email: novo, email_confirm: true }) });
      if (!r.ok) {
        const m = String(r.data?.msg || r.data?.message || r.data?.error_description || "");
        return json(400, { error: /already|registered|exists|unique/i.test(m) ? "Este e-mail já é de outra conta." : "Não foi possível trocar o e-mail: " + (m || `HTTP ${r.status}`) });
      }
      await log({ from: email, to: novo }); return json(200, { ok: true, email: novo, previous: email });
    }
    if (body.action === "send-recovery") {
      const r = await call(`/auth/v1/recover`, { method: "POST", body: JSON.stringify({ email, ...(APP ? { redirect_to: APP } : {}) }) });
      if (!r.ok) return json(400, { error: "Não foi possível enviar o e-mail (confira o SMTP em Auth › SMTP): " + (r.data?.msg || r.data?.message || `HTTP ${r.status}`) });
      await log({ sent: true }); return json(200, { ok: true, email, sent: true });
    }
    const type = body.action === "recovery-link" ? "recovery" : "magiclink";
    const r = await call(`/auth/v1/admin/generate_link`, { method: "POST", body: JSON.stringify({ type, email, ...(APP ? { redirect_to: APP } : {}) }) });
    if (!r.ok || !r.data?.action_link) return json(400, { error: "Não foi possível gerar o link: " + (r.data?.msg || r.data?.message || `HTTP ${r.status}`) });
    await log({ type }); return json(200, { ok: true, email, link: r.data.action_link });
  }

  if (body.action === "create-business") { const r = await createOne(body, body.model); return json(r.ok ? 200 : 400, { ok: r.ok, results: [r] }); }
  if (body.action === "bulk-create") {
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 50) : [];
    if (!rows.length) return json(400, { error: "Nenhuma linha." });
    const results = []; for (const row of rows) results.push(await createOne(row, body.model));
    return json(200, { ok: results.every((r) => r.ok), results });
  }
  return json(400, { error: "Ação inválida." });
});
