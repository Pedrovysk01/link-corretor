"""API local do superadmin (só neste computador) — usada por tools/dev-server.py em /api/admin.

Por que local: o painel admin pode rodar aqui dentro com acesso total (service_role do Supabase, chaves da SerpAPI,
Bearer dos bots Forja) sem expor nada disso online. Para a produção, só a Edge Function forja-proxy (métricas agregadas)
e as RPCs admin_* (com RLS/is_platform_admin) existem — ver docs/FORJA.md.

Liga/desliga em .env.local (NUNCA versionar):
    CF_ADMIN_LOCAL=1                         # sem isso, /api/admin responde 404
    CF_ADMIN_SUPABASE_URL=http://127.0.0.1:54321   # opcional: sem ele, pega do `npx supabase status` (Supabase local)
    CF_ADMIN_SERVICE_KEY=...                 # opcional: idem (service_role). Para apontar na PRODUÇÃO, preencha os dois à mão.
    SERPAPI_KEYS=...                         # já existe: usado para mostrar o saldo de cada chave

Ações (GET /api/admin?action=…  ·  POST /api/admin com JSON {action, …}):
    businesses                → lista (RPC admin_businesses)
    business&id=<uuid>        → detalhe (RPC admin_business)
    set-nav  {id, items}      → grava o menu do cliente (RPC admin_set_nav)
    forja-upsert {id, name, base_url, token?, tier?}  → vincula o bot (RPC admin_upsert_forja)
    forja-remove {id}         → desvincula (RPC admin_remove_forja)
    forja-metrics&id=<uuid>&range=7d|30d|all → consulta o bot DIRETO daqui (lê forja_secrets com a service_role)
    stats · payments · events · customers · audit · export · set-plan · update-business · set-card · delete-card · set-items · import
                              → RPCs admin_* da migração 26 (a service_role passa em is_platform_admin)
    create-business {email,name,plan?,trial?,model?} ou {rows:[…],model?} → convite do dono (GoTrue) + admin_create_business
    serp-status               → saldo de cada chave da SerpAPI (mascarada)
    status                    → {ok, supabase, chaves}
"""
import json, os, pathlib, re, shutil, subprocess, threading, time, urllib.error, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
_lock = threading.Lock()
_cfg = None


def env_file():
    out = {}
    for f in (ROOT / ".env.local", ROOT / ".env"):
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1); out.setdefault(k.strip(), v.strip().strip('"'))
    for k in ("CF_ADMIN_LOCAL", "CF_ADMIN_SUPABASE_URL", "CF_ADMIN_SERVICE_KEY", "SERPAPI_KEYS"):
        if os.environ.get(k): out[k] = os.environ[k]
    return out


def enabled(): return env_file().get("CF_ADMIN_LOCAL") == "1"


def config():
    """URL + service_role: do .env.local ou, se faltarem, do Supabase local (npx supabase status). Guardado após a 1ª vez."""
    global _cfg
    with _lock:
        if _cfg: return _cfg
        e = env_file(); url, key = e.get("CF_ADMIN_SUPABASE_URL"), e.get("CF_ADMIN_SERVICE_KEY")
        if not (url and key):
            npx = shutil.which("npx") or "npx"
            try:
                out = subprocess.run([npx, "-y", "supabase", "status", "-o", "env"], cwd=ROOT, capture_output=True, text=True, shell=(os.name == "nt"), timeout=60).stdout
            except Exception: out = ""
            for line in out.splitlines():
                if "=" in line:
                    a, b = line.split("=", 1); b = b.strip().strip('"')
                    if a == "API_URL" and not url: url = b
                    if a == "SERVICE_ROLE_KEY" and not key: key = b
        if not (url and key): raise RuntimeError("Supabase não encontrado: ligue o local (npx supabase start) ou preencha CF_ADMIN_SUPABASE_URL e CF_ADMIN_SERVICE_KEY em .env.local.")
        _cfg = {"url": url.rstrip("/"), "key": key}
        return _cfg


def _req(url, method="GET", body=None, headers=None, timeout=20):
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), method=method, headers={"Content-Type": "application/json", "Accept": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode(); return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, {"message": raw[:300]}


def rpc(name, args=None):
    c = config(); h = {"apikey": c["key"], "Authorization": "Bearer " + c["key"]}
    code, d = _req(f"{c['url']}/rest/v1/rpc/{name}", "POST", args or {}, h)
    if code >= 400: raise RuntimeError((d or {}).get("message") or (d or {}).get("hint") or f"HTTP {code}")
    return d


def rest(path, method="GET", body=None):
    c = config(); h = {"apikey": c["key"], "Authorization": "Bearer " + c["key"], "Prefer": "return=representation"}
    code, d = _req(f"{c['url']}/rest/v1/{path}", method, body, h)
    if code >= 400: raise RuntimeError((d or {}).get("message") or f"HTTP {code}")
    return d


# as RPCs admin_* exigem is_platform_admin(), que olha auth.uid(). Com a service_role não há usuário, então a API local
# consulta as tabelas direto (mesmo formato das RPCs) — é o atalho "rodar localmente" do superadmin.
def businesses():
    rows = rest("businesses?select=id,name,slug,plan,trial,created_at,logo_url,owner_id,settings&order=created_at.desc")
    inst = {f["business_id"]: f for f in rest("forja_instances?select=id,business_id,name,base_url,tier,status,last_seen_at,last_error")}
    navs = {}
    for n in rest("nav_items?select=business_id&active=eq.true"): navs[n["business_id"]] = navs.get(n["business_id"], 0) + 1
    out = []
    for b in rows:
        bid = b["id"]; g = ((b.get("settings") or {}).get("gmaps") or {}); m = g.get("main") or {}
        cnt = lambda path: len(rest(path) or [])
        out.append({
            "id": bid, "name": b["name"], "slug": b["slug"], "plan": b["plan"], "trial": b["trial"], "created_at": b["created_at"], "logo_url": b.get("logo_url"),
            "owner_email": None,  # auth.users não é exposto pela REST; o detalhe mostra pelo painel online
            "customers": cnt(f"customers?select=id&business_id=eq.{bid}"),
            "stamps_30d": sum((e["qty"] if e["kind"] == "stamp" else -e["qty"] if e["kind"] == "undo" else 0) for e in rest(f"stamp_events?select=kind,qty&business_id=eq.{bid}&created_at=gt.{_days_ago(30)}") or []),
            "redeemed_30d": cnt(f"stamp_events?select=id&business_id=eq.{bid}&kind=eq.redeem&created_at=gt.{_days_ago(30)}"),
            "visitors_30d": len({v["visitor_id"] for v in rest(f"visits?select=visitor_id&business_id=eq.{bid}&created_at=gt.{_days_ago(30)}") or []}),
            "gmaps": {"nome": m.get("nome"), "nota": m.get("nota"), "total_avaliacoes": m.get("total_avaliacoes"), "place_id": m.get("place_id"), "categoria": m.get("categoria"), "filiais": len([k for k in g if k.startswith("loc:")])} if g else None,
            "forja": inst.get(bid), "nav_count": navs.get(bid, 0),
        })
    return out


def business(bid):
    if not UUID.match(bid or ""): raise RuntimeError("id inválido")
    b = (rest(f"businesses?select=*&id=eq.{bid}") or [None])[0]
    if not b: raise RuntimeError("negócio inexistente")
    f = (rest(f"forja_instances?select=*&business_id=eq.{bid}") or [None])[0]
    if f: f["has_token"] = bool(rest(f"forja_secrets?select=instance_id&instance_id=eq.{f['id']}"))
    return {
        "id": bid, "name": b["name"], "slug": b["slug"], "plan": b["plan"], "trial": b["trial"], "created_at": b["created_at"], "logo_url": b.get("logo_url"),
        "tagline": b.get("tagline"), "address": b.get("address"), "tz": b.get("tz"), "currency": b.get("currency"), "owner_email": None,
        "type": b.get("type"), "page_color": b.get("page_color"),
        "gmaps": (b.get("settings") or {}).get("gmaps"), "settings": {k: v for k, v in (b.get("settings") or {}).items() if k != "gmaps"},
        "items": rest(f"page_items?select=id,type,title,body,label,url,items,icon_only,onsite&business_id=eq.{bid}&order=position"),
        "suggestions_open": len(rest(f"admin_suggestions?select=id&business_id=eq.{bid}&status=eq.open") or []),
        "customers": len(rest(f"customers?select=id&business_id=eq.{bid}") or []),
        "stamps_total": sum((e["qty"] if e["kind"] == "stamp" else -e["qty"] if e["kind"] == "undo" else 0) for e in rest(f"stamp_events?select=kind,qty&business_id=eq.{bid}") or []),
        "redeemed_total": len(rest(f"stamp_events?select=id&business_id=eq.{bid}&kind=eq.redeem") or []),
        "visitors_30d": len({v["visitor_id"] for v in rest(f"visits?select=visitor_id&business_id=eq.{bid}&created_at=gt.{_days_ago(30)}") or []}),
        "leads": len(rest(f"visitor_leads?select=id&business_id=eq.{bid}") or []),
        "cards": rest(f"cards?select=id,name,stamps,active,header,reward_text,reward_label&business_id=eq.{bid}&order=created_at"),
        "staff": len(rest(f"staff?select=id&business_id=eq.{bid}&status=eq.active") or []),
        "webhooks": len(rest(f"webhooks?select=id&business_id=eq.{bid}&active=eq.true") or []),
        "forja": f, "nav": rest(f"nav_items?select=*&business_id=eq.{bid}&order=position,created_at"),
    }


def set_nav(bid, items):
    if not UUID.match(bid or ""): raise RuntimeError("id inválido")
    if not isinstance(items, list) or len(items) > 12: raise RuntimeError("até 12 itens")
    rest(f"nav_items?business_id=eq.{bid}", "DELETE")
    rows = [{"business_id": bid, "group_label": (it.get("group_label") or "Atendimento").strip()[:40], "label": (it.get("label") or "").strip()[:40], "icon": it.get("icon") or "zap",
             "kind": it.get("kind"), "target": (it.get("target") or "").strip(), "position": i, "active": bool(it.get("active", True))} for i, it in enumerate(items)]
    return rest("nav_items", "POST", rows) if rows else []


def forja_upsert(bid, name, base_url, token=None, tier="free"):
    if not UUID.match(bid or ""): raise RuntimeError("id inválido")
    base_url = (base_url or "").strip().rstrip("/")
    if not re.match(r"^https://[a-z0-9.-]+(:\d+)?(/[^?#\s]*)?$", base_url, re.I): raise RuntimeError("URL do bot precisa ser https://… sem ?query")
    cur = (rest(f"forja_instances?select=id&business_id=eq.{bid}") or [None])[0]
    row = {"business_id": bid, "name": (name or "").strip()[:60] or "Chatbot", "base_url": base_url, "tier": tier if tier in ("free", "pro") else "free", "status": "pending", "last_error": None, "updated_at": _now()}
    f = rest(f"forja_instances?id=eq.{cur['id']}", "PATCH", row)[0] if cur else rest("forja_instances", "POST", row)[0]
    if (token or "").strip():
        if rest(f"forja_secrets?select=instance_id&instance_id=eq.{f['id']}"): rest(f"forja_secrets?instance_id=eq.{f['id']}", "PATCH", {"control_token": token.strip(), "updated_at": _now()})
        else: rest("forja_secrets", "POST", {"instance_id": f["id"], "control_token": token.strip()})
    f["has_token"] = bool(rest(f"forja_secrets?select=instance_id&instance_id=eq.{f['id']}"))
    return f


def forja_remove(bid):
    if not UUID.match(bid or ""): raise RuntimeError("id inválido")
    rest(f"forja_instances?business_id=eq.{bid}", "DELETE"); rest(f"nav_items?business_id=eq.{bid}&kind=eq.forja", "DELETE"); return {"ok": True}


def forja_metrics(bid, rng="7d", action="metrics"):
    """Fala com o Worker do Forja direto daqui (Bearer do control plane) e grava o resultado na instância."""
    if not UUID.match(bid or ""): raise RuntimeError("id inválido")
    f = (rest(f"forja_instances?select=*&business_id=eq.{bid}") or [None])[0]
    if not f: raise RuntimeError("este negócio não tem chatbot vinculado")
    s = (rest(f"forja_secrets?select=control_token&instance_id=eq.{f['id']}") or [None])[0]
    pub = {k: f.get(k) for k in ("id", "name", "base_url", "tier", "status", "last_seen_at")}
    if not s: return {"ok": False, "instance": pub, "error": "sem token (CONTROL_PLANE_TOKEN) cadastrado"}
    rng = rng if rng in ("7d", "30d", "all") else "7d"; action = "health" if action == "health" else "metrics"
    url = f"{f['base_url']}/api/{action}" + (f"?range={rng}" if action == "metrics" else "")
    try:
        code, data = _req(url, headers={"Authorization": "Bearer " + s["control_token"], "User-Agent": "SeuClienteFiel/admin-local"}, timeout=10)
        err = None if code < 400 else ("o bot recusou o token" if code == 401 else f"o bot respondeu HTTP {code}")
    except Exception as e: code, data, err = 0, None, f"não foi possível falar com o bot: {e}"
    status = "ok" if not err else "error"
    patch = {"status": status, "last_error": err, "updated_at": _now()}
    if status == "ok":
        patch["last_seen_at"] = _now()
        if action == "metrics" and isinstance(data, dict): patch["last_metrics"] = data
    try: rest(f"forja_instances?id=eq.{f['id']}", "PATCH", patch)
    except Exception: pass
    return {"ok": status == "ok", "instance": {**pub, "status": status, "last_seen_at": patch.get("last_seen_at") or pub["last_seen_at"]}, "data": data, "error": err}


def serp_status():
    """Saldo de cada chave da SerpAPI (GET /account.json). A chave aparece mascarada."""
    keys = [k.strip() for k in env_file().get("SERPAPI_KEYS", "").split(",") if k.strip()]
    out = []
    for k in keys:
        try:
            code, d = _req("https://serpapi.com/account.json?" + urllib.parse.urlencode({"api_key": k}), timeout=15)
            d = d or {}
            out.append({"chave": k[:4] + "…" + k[-4:], "ok": code == 200 and not d.get("error"), "plano": d.get("plan_name"), "limite_mes": d.get("searches_per_month"),
                        "usadas_mes": d.get("this_month_usage"), "restantes": d.get("plan_searches_left"), "extra": d.get("extra_credits"), "erro": d.get("error") if code != 200 or d.get("error") else None})
        except Exception as e: out.append({"chave": k[:4] + "…" + k[-4:], "ok": False, "erro": str(e)})
    return {"chaves": out, "total_restantes": sum((c.get("restantes") or 0) for c in out)}


def status():
    try: c = config(); sb = c["url"]
    except Exception as e: sb = None
    return {"ok": True, "supabase": sb, "chaves": len([k for k in env_file().get("SERPAPI_KEYS", "").split(",") if k.strip()])}


RPC_MAP = {  # ação do painel → RPC (args vindos do corpo/query). O painel da plataforma (app/admin/) usa estes nomes.
    "stats": ("admin_stats", lambda q, b: {}), "payments": ("admin_payments", lambda q, b: {}), "audit": ("admin_audit_list", lambda q, b: {"p_limit": 300}),
    "events": ("admin_billing_events", lambda q, b: {"p_business": q.get("id")}), "customers": ("admin_customers", lambda q, b: {"p_business": q.get("id")}),
    "export": ("admin_export_business", lambda q, b: {"p_business": q.get("id")}),
    "set-plan": ("admin_set_plan", lambda q, b: {"p_business": b.get("id"), "p_plan": b.get("plan"), "p_trial": bool(b.get("trial"))}),
    "update-business": ("admin_update_business", lambda q, b: {"p_business": b.get("id"), "p_patch": b.get("patch") or {}}),
    "set-card": ("admin_set_card", lambda q, b: {"p_business": b.get("id"), "p_card": b.get("card") or {}}),
    "delete-card": ("admin_delete_card", lambda q, b: {"p_business": b.get("id"), "p_card": b.get("card")}),
    "set-items": ("admin_set_items", lambda q, b: {"p_business": b.get("id"), "p_items": [{k: v for k, v in it.items() if k != "id"} for it in (b.get("items") or [])]}),
    "import": ("admin_import_model", lambda q, b: {"p_business": b.get("id"), "p_model": b.get("model"), "p_replace": bool(b.get("replace"))}),
    "owner": ("admin_owner", lambda q, b: {"p_business": q.get("id")}),
    "prospects": ("admin_prospects", lambda q, b: {}),
    "claim-link": ("admin_claim_link", lambda q, b: {"p_business": b.get("id"), "p_days": b.get("days") or 60}),
    "create-prospect": ("admin_create_prospect", lambda q, b: {"p_lead": b.get("lead")}),
    "activate-prospect": ("admin_activate_prospect", lambda q, b: {"p_business": b.get("id")}),
    "features": ("admin_feature_usage", lambda q, b: {}),
    "pay-config": ("admin_billing_config", lambda q, b: {}),
    "pay-config-set": ("admin_set_billing_config", lambda q, b: {"p": b.get("config") or {}}),
    "pay-links": ("admin_payment_links", lambda q, b: {"p_business": q.get("id") or None, "p_status": q.get("status") or None, "p_limit": 300}),
    "suggestions": ("admin_suggestions", lambda q, b: {"p_business": q.get("id")}),
    "suggestion-decide": ("admin_suggestion_decide", lambda q, b: {"p_id": b.get("id"), "p_status": b.get("status")}),
}
WRAP = {"suggestions": "items", "suggestion-decide": "item","stats": None, "payments": "items", "audit": "items", "events": "items", "customers": "items", "export": "model", "set-plan": None, "update-business": "item", "set-card": "item", "delete-card": None, "set-items": "items", "import": None,
        "owner": None, "prospects": "items", "claim-link": None, "create-prospect": None, "pay-config": None, "pay-config-set": None, "pay-links": "items", "activate-prospect": None, "features": "items"}


# ---------------------------------------------------------------- cobrança: a função billing faz a parte dos provedores (as chaves ficam nos segredos dela)
PAY_FN = {"pay-status": "status", "pay-link": "link", "pay-cancel-link": "cancel-link", "pay-mark-paid": "mark-paid", "pay-cancel-sub": "cancel-sub"}
def pay_fn(action, body):
    c = config(); h = {"apikey": c["key"], "Authorization": "Bearer " + c["key"]}   # a service_role passa em is_platform_admin
    code, d = _req(f"{c['url']}/functions/v1/billing/admin/{PAY_FN[action]}", "POST", {k: v for k, v in (body or {}).items() if k != "action"}, h, timeout=40)
    if code == 404 or d is None: raise RuntimeError("A função billing não respondeu (publique com: npx supabase functions deploy billing).")
    if code >= 300: raise RuntimeError(str((d or {}).get("error") or code))
    return d


# ---------------------------------------------------------------- acesso dos usuários (mesmas regras da função admin-api)
def access(action, body):
    c = config(); h = {"apikey": c["key"], "Authorization": "Bearer " + c["key"]}
    uid = str(body.get("user_id") or "")
    if not UUID.match(uid): raise RuntimeError("Usuário inválido.")
    code, u = _req(f"{c['url']}/auth/v1/admin/users/{uid}", headers=h)
    if code >= 300 or not (u or {}).get("email"): raise RuntimeError("Usuário não encontrado.")
    email = u["email"]
    if rest(f"platform_admins?select=user_id&user_id=eq.{uid}"): raise RuntimeError("Não dá para mexer no acesso de um superadmin por aqui.")
    pc = rest("platform_config?select=value&key=eq.prospect_owner")
    if pc and str(pc[0].get("value")) == uid: raise RuntimeError("Esta é a conta técnica que guarda as páginas em preparação; ela não tem acesso.")
    bid = body.get("business_id") if UUID.match(str(body.get("business_id") or "")) else None
    log = lambda det: rest("admin_audit", "POST", {"user_id": None, "action": action.replace("-", "_"), "business_id": bid, "details": {"email": email, "via": "local", **det}})
    if action == "set-password":
        pw = str(body.get("password") or "")
        if len(pw) < 8: raise RuntimeError("A senha precisa ter pelo menos 8 caracteres.")
        code, d = _req(f"{c['url']}/auth/v1/admin/users/{uid}", "PUT", {"password": pw, "email_confirm": True}, h)
        if code >= 300: raise RuntimeError("Não foi possível trocar a senha: " + str((d or {}).get("msg") or (d or {}).get("message") or code))
        log({}); return {"ok": True, "email": email}
    if action == "set-email":
        novo = str(body.get("email") or "").strip().lower()
        if not re.match(r"^[^\s@<>\"']+@[^\s@<>\"']+\.[^\s@<>\"']+$", novo): raise RuntimeError("E-mail inválido.")
        if novo == email.lower(): raise RuntimeError("É o mesmo e-mail de agora.")
        code, d = _req(f"{c['url']}/auth/v1/admin/users/{uid}", "PUT", {"email": novo, "email_confirm": True}, h)
        if code >= 300:
            m = str((d or {}).get("msg") or (d or {}).get("message") or code)
            raise RuntimeError("Este e-mail já é de outra conta." if re.search(r"already|registered|exists|unique", m, re.I) else "Não foi possível trocar o e-mail: " + m)
        log({"from": email, "to": novo}); return {"ok": True, "email": novo, "previous": email}
    if action == "send-recovery":
        code, d = _req(f"{c['url']}/auth/v1/recover", "POST", {"email": email}, h)
        if code >= 300: raise RuntimeError("Não foi possível enviar o e-mail (confira o SMTP em Auth › SMTP): " + str((d or {}).get("msg") or code))
        log({"sent": True}); return {"ok": True, "email": email, "sent": True}
    code, d = _req(f"{c['url']}/auth/v1/admin/generate_link", "POST", {"type": "recovery" if action == "recovery-link" else "magiclink", "email": email}, h)
    if code >= 300 or not (d or {}).get("action_link"): raise RuntimeError("Não foi possível gerar o link: " + str((d or {}).get("msg") or (d or {}).get("message") or code))
    log({}); return {"ok": True, "email": email, "link": d["action_link"]}


# ---------------------------------------------------------------- base do Prospector (data/prospeccao.json, gerada por tools/prospeccao.py)
_leads = None
def leads(q):
    global _leads
    f = ROOT / "data" / "prospeccao.json"
    if not f.exists(): raise RuntimeError("Base não encontrada: rode python tools/prospeccao.py")
    if _leads is None or _leads[0] != f.stat().st_mtime: _leads = (f.stat().st_mtime, json.load(open(f, encoding="utf-8")))
    rows = _leads[1]
    try: prepared = {(p.get("prospect") or {}).get("data_id") for p in (rpc("admin_prospects") or [])} - {None}
    except Exception: prepared = set()
    cid, grp, seg, txt = (q.get("cidade") or "").strip(), (q.get("grupo") or "").strip(), (q.get("segmento") or "").strip(), (q.get("q") or "").strip().lower()
    good = lambda r: (r.get("reviews") or 0) >= 20 and (r.get("rating") or 0) >= 4.3
    out = [r for r in rows if (not cid or cid in r.get("cidades", [])) and (not grp or r.get("grupo") == grp) and (not seg or r.get("segmento") == seg)
           and (not txt or txt in (r.get("nome") or "").lower()) and (q.get("sem_site") != "1" or not r.get("site")) and (q.get("bons") != "1" or good(r))
           and (q.get("sem_rede") != "1" or not (r.get("rede") and r.get("rede_confianca") != "baixa"))]
    out.sort(key=lambda r: (-good(r), -(r.get("reviews") or 0)))
    lim = max(1, min(int(q.get("limite") or 200), 500))
    keep = ("id", "nome", "cidade", "segmento", "grupo", "rating", "reviews", "whatsapp", "site", "rede", "rede_unidades", "rede_confianca", "data_id", "place_id", "prioridade")
    return {"total": len(out), "items": [dict({k: r.get(k) for k in keep}, preparado=r.get("data_id") in prepared) for r in out[:lim]],
            "cidades": sorted({c for r in rows for c in r.get("cidades", [])}), "grupos": sorted({r.get("grupo") for r in rows if r.get("grupo")})}


def prepare_leads(body):
    import preparar_prospects as P
    ids = set(body.get("ids") or [])
    if not ids or len(ids) > 100: raise RuntimeError("Escolha de 1 a 100 estabelecimentos.")
    leads({})  # carrega a base
    sel = [r for r in _leads[1] if r.get("id") in ids]
    app = (body.get("app_url") or P.APP).rstrip("/") + "/"
    out = []
    for r in sel:
        try:
            res = rpc("admin_create_prospect", {"p_lead": P.payload(r)})
            pag = f"{app}c/?s={res['slug']}"; at = f"{app}?ativar={res['token']}" if res.get("token") else ""
            out.append({"nome": r["nome"], "ok": True, "id": res.get("id"), "slug": res.get("slug"), "existing": bool(res.get("existing")), "pagina": pag, "ativar": at,
                        "whatsapp": r.get("whatsapp"), "mensagem": P.mensagem(r["nome"], pag, at) if at else ""})
        except Exception as e: out.append({"nome": r.get("nome"), "ok": False, "error": str(e)})
    return {"ok": all(x["ok"] for x in out), "results": out}


def invite_owner(email, name):
    """Conta do dono pelo GoTrue (service_role): convite por e-mail; se já existe, devolve o id (e um link de acesso)."""
    c = config(); h = {"apikey": c["key"], "Authorization": "Bearer " + c["key"]}
    code, d = _req(f"{c['url']}/auth/v1/invite", "POST", {"email": email, "data": {"business_name": name}}, h)
    if code < 300 and (d or {}).get("id"): return {"id": d["id"], "invited": True, "link": None}
    code2, d2 = _req(f"{c['url']}/auth/v1/admin/generate_link", "POST", {"type": "magiclink", "email": email}, h)
    if code2 < 300 and (d2 or {}).get("user", {}).get("id"): return {"id": d2["user"]["id"], "invited": False, "link": (d2 or {}).get("action_link")}
    raise RuntimeError("Não foi possível criar/encontrar a conta do dono: " + str((d or {}).get("msg") or (d or {}).get("message") or (d2 or {}).get("message") or code))


def create_business(rows, model=None):
    out = []
    for r in rows[:50]:
        email = str(r.get("email") or "").strip().lower(); name = str(r.get("name") or "").strip()
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email): out.append({"email": email, "ok": False, "error": "E-mail inválido."}); continue
        if len(name) < 2: out.append({"email": email, "ok": False, "error": "Informe o nome do negócio."}); continue
        try:
            o = invite_owner(email, name)
            res = rpc("admin_create_business", {"p_owner": o["id"], "p_name": name, "p_plan": r.get("plan") if r.get("plan") in ("free", "pro", "business", "multi") else "free", "p_trial": True if r.get("trial") is None else bool(r.get("trial")), "p_model": model})
            out.append({"email": email, "ok": True, "business_id": res.get("id"), "slug": res.get("slug"), "user_id": o["id"], "invited": o["invited"], "link": o["link"]})
        except Exception as e: out.append({"email": email, "ok": False, "error": str(e)})
    return {"ok": all(x["ok"] for x in out), "results": out}


def handle(action, q, body=None):
    """Despacho usado pelo dev-server. Devolve (código, objeto)."""
    body = body or {}
    try:
        if action == "status": return 200, status()
        if action == "businesses": return 200, {"items": businesses()}
        if action == "business": return 200, {"item": business(q.get("id"))}
        if action == "forja-metrics": return 200, forja_metrics(q.get("id"), q.get("range", "7d"), q.get("kind", "metrics"))
        if action == "serp-status": return 200, serp_status()
        if action == "set-nav": return 200, {"items": set_nav(body.get("id"), body.get("items"))}
        if action == "forja-upsert": return 200, {"item": forja_upsert(body.get("id"), body.get("name"), body.get("base_url"), body.get("token"), body.get("tier", "free"))}
        if action == "forja-remove": return 200, forja_remove(body.get("id"))
        if action in RPC_MAP:
            name, args = RPC_MAP[action]; d = rpc(name, args(q, body)); w = WRAP.get(action)
            return 200, ({w: d} if w else (d if isinstance(d, dict) else {"ok": True}))
        if action == "create-business": return 200, create_business(body.get("rows") or [body], body.get("model"))
        if action in ("set-password", "recovery-link", "send-recovery", "magic-link", "set-email"): return 200, access(action, body)
        if action == "leads": return 200, leads(q)
        if action == "prepare-leads": return 200, prepare_leads(body)
        if action in PAY_FN: return 200, pay_fn(action, body)
        return 400, {"error": "Ação inválida."}
    except RuntimeError as e: return 400, {"error": str(e)}
    except Exception as e: return 502, {"error": str(e)}


def _now(): return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
def _days_ago(n): return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - n * 86400))
