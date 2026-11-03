// Formulários de contato (site de vendas e Framer) → contatos do Seu Cliente Fiel (tabela leads, pela função submit_lead)
// → repasse opcional para o seu sistema (n8n, Make, Zapier, CRM…).
//
//   Site:   POST JSON { source:"site", name, email, phone?, business?, segment?, message?, consent:true, website:"" (isca), utm_*, page, ref }
//   Framer: Formulário → Send to → Webhook → https://<projeto>.supabase.co/functions/v1/forms-intake
//           (JSON com os nomes dos campos: nome, email, whatsapp, negocio, segmento, mensagem, consentimento…)
//           Com FRAMER_WEBHOOK_SECRET, a assinatura do Framer é conferida:
//           Framer-Signature = "sha256=" + HMAC_SHA256(segredo, corpo + Framer-Webhook-Submission-Id)
//
// Repasse (opcional): LEADS_WEBHOOK_URL recebe { id, event:"lead.site", created_at, source, lead } com o mesmo formato de
// assinatura dos webhooks do painel: X-SCF-Signature: t=<unix>,v1=<hex de hmac_sha256(LEADS_WEBHOOK_SECRET, "<t>.<corpo>")>.
// verify_jwt = false (config.toml): o Framer e o site chamam sem login. Proteções: isca anti-robô, consentimento obrigatório,
// e-mail válido e os limites da submit_lead (mesmo e-mail a cada 10 min; 300 contatos por hora).

const env = (k: string) => (Deno.env.get(k) || "").trim();
const SB_URL = env("SUPABASE_URL").replace(/\/$/, "");
const ANON = env("SUPABASE_ANON_KEY");
const FRAMER_SECRET = env("FRAMER_WEBHOOK_SECRET");
const LEADS_URL = env("LEADS_WEBHOOK_URL");
const LEADS_SECRET = env("LEADS_WEBHOOK_SECRET");

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (code: number, obj: unknown) => new Response(JSON.stringify(obj), { status: code, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmacHex(secret: string, ...parts: (string | Uint8Array)[]) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const all = parts.map((p) => (typeof p === "string" ? enc.encode(p) : p)), len = all.reduce((a, p) => a + p.length, 0), buf = new Uint8Array(len);
  let o = 0; for (const p of all) { buf.set(p, o); o += p.length; }
  return hex(await crypto.subtle.sign("HMAC", key, buf));
}
const same = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

// nomes de campo aceitos (sem acento, minúsculas, só letras/números) — o Framer usa os nomes que você deu aos campos
const norm = (k: string) => k.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const FIELDS: Record<string, string[]> = {
  name: ["name", "nome", "seunome", "nomecompleto", "fullname"],
  email: ["email", "seuemail", "emailaddress"],
  phone: ["phone", "telefone", "whatsapp", "celular", "fone", "tel", "seuwhatsapp"],
  business: ["business", "negocio", "empresa", "estabelecimento", "nomedonegocio", "company", "loja"],
  segment: ["segment", "segmento", "ramo", "tipodenegocio", "setor"],
  message: ["message", "mensagem", "msg", "comentario", "comentarios", "observacoes", "duvida"],
  consent: ["consent", "consentimento", "lgpd", "aceito", "concordo", "privacidade", "autorizo", "termos"],
  hp: ["website", "hp", "honeypot"],
};
function pick(o: Record<string, unknown>, field: string): string {
  const want = FIELDS[field];
  for (const k of Object.keys(o)) if (want.includes(norm(k))) { const v = o[k]; if (v != null && String(v).trim() !== "") return String(v).trim(); }
  return "";
}
const truthy = (v: string) => /^(true|on|1|sim|yes|aceito|concordo|checked|marcado)$/i.test(v.trim());
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"];

async function forward(lead: Record<string, unknown>, source: Record<string, unknown>) {
  if (!/^https?:\/\//i.test(LEADS_URL)) return;
  const body = JSON.stringify({ id: crypto.randomUUID(), event: "lead.site", created_at: new Date().toISOString(), source, lead });
  const t = String(Math.floor(Date.now() / 1000));
  const headers: Record<string, string> = { "Content-Type": "application/json", "User-Agent": "SeuClienteFiel-Webhooks/1", "X-SCF-Event": "lead.site" };
  if (LEADS_SECRET) headers["X-SCF-Signature"] = `t=${t},v1=${await hmacHex(LEADS_SECRET, `${t}.${body}`)}`;
  try { await fetch(LEADS_URL, { method: "POST", headers, body, signal: AbortSignal.timeout(6000) }); }
  catch (e) { console.error("forms-intake: repasse falhou", String(e)); }   // o contato já está guardado; o repasse é melhor-esforço
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Use POST." });
  const raw = new Uint8Array(await req.arrayBuffer());
  if (raw.length > 20_000) return json(413, { error: "Formulário grande demais." });
  const sig = req.headers.get("framer-signature") || "", sub = req.headers.get("framer-webhook-submission-id") || "";
  const fromFramer = !!(sig || sub);
  if (FRAMER_SECRET && fromFramer) {
    const want = "sha256=" + (await hmacHex(FRAMER_SECRET, raw, sub));
    if (!sub || !same(want, sig)) return json(401, { error: "Assinatura do Framer inválida." });
  }
  let body: Record<string, unknown> = {};
  const ctype = req.headers.get("content-type") || "";
  try {
    const text = new TextDecoder().decode(raw);
    body = /x-www-form-urlencoded/.test(ctype) ? Object.fromEntries(new URLSearchParams(text)) : JSON.parse(text || "{}");
  } catch { return json(400, { error: "Corpo inválido (use JSON)." }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json(400, { error: "Corpo inválido." });

  const lead = { name: pick(body, "name").slice(0, 120), email: pick(body, "email").toLowerCase().slice(0, 160), phone: pick(body, "phone").slice(0, 30),
    business: pick(body, "business").slice(0, 120), segment: pick(body, "segment").slice(0, 80), message: pick(body, "message").slice(0, 2000) };
  const consentRaw = pick(body, "consent"), consent = body.consent === true || truthy(consentRaw), hp = pick(body, "hp");
  const source: Record<string, unknown> = { origin: fromFramer ? "framer" : String(body.source || "site").slice(0, 20), page: String(body.page || "").slice(0, 200), ref: String(body.ref || "").slice(0, 200) };
  if (fromFramer && sub) source.submission_id = sub.slice(0, 80);
  for (const k of UTM) if (body[k]) source[k] = String(body[k]).slice(0, 200);
  if (hp) return json(200, { ok: true });                                   // isca preenchida: finge que deu certo
  if (lead.name.length < 2) return json(400, { error: "Informe seu nome." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return json(400, { error: "E-mail inválido." });
  if (!consent) return json(400, { error: "Marque o consentimento (LGPD) para enviarmos sua mensagem." });

  const r = await fetch(`${SB_URL}/rest/v1/rpc/submit_lead`, { method: "POST", headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ p_name: lead.name, p_email: lead.email, p_phone: lead.phone || null, p_business: lead.business || null, p_segment: lead.segment || null,
      p_message: lead.message || null, p_consent: true, p_hp: "", p_source: source }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); return json(r.status === 404 ? 503 : 400, { error: (e && (e.message || e.error)) || "Não foi possível registrar agora." }); }
  await forward(lead, source);
  return json(200, { ok: true });
});
