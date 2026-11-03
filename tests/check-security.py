"""Confere as travas de segurança contra o Supabase LOCAL (npx supabase start) e o servidor de arquivos.

Uso (a partir da raiz, com o Supabase local ligado e `python tools/dev-server.py` na 8080):
    python tests/check-security.py
Cobre: plano travado · troca de dono · public_join sem devolver o cartão de quem já existe · só https nos links ·
       maps-lookup exigindo usuário logado · servidor de arquivos só em 127.0.0.1 e só app/ (sem sair por .. / %5c).
Sai com código 1 se algo falhar.
"""
import json, os, subprocess, sys, urllib.request, urllib.error, uuid, pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAILS = []
try: sys.stdout.reconfigure(encoding="utf-8")  # acentos e setas no console do Windows (cp1252)
except Exception: pass


def env():
    k = {x: os.environ.get(x) for x in ("API_URL", "ANON_KEY", "SERVICE_ROLE_KEY")}
    if all(k.values()): return k
    npx = shutil.which("npx") or "npx"
    out = subprocess.run([npx, "-y", "supabase", "status", "-o", "env"], cwd=ROOT, capture_output=True, text=True, shell=(os.name == "nt")).stdout
    for line in out.splitlines():
        if "=" in line:
            a, b = line.split("=", 1)
            if a in k: k[a] = b.strip().strip('"')
    if not all(k.values()): sys.exit("Supabase local desligado (npx supabase start).")
    return k


def call(method, url, body=None, headers=None):
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), method=method, headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=20) as r: raw = r.read().decode(); return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: return e.code, json.loads(raw)
        except Exception: return e.code, raw


def check(name, ok, extra=""):
    print(("  ok   " if ok else "  FALHA ") + name + (f"  → {extra}" if (extra and not ok) else ""))
    if not ok: FAILS.append(name)


def main():
    k = env(); api = k["API_URL"].rstrip("/"); anon = k["ANON_KEY"]
    H = lambda tok=None: {"apikey": anon, "Authorization": "Bearer " + (tok or anon)}
    # usuário dono de teste (cria se não existir)
    email, pw = f"seg-{uuid.uuid4().hex[:8]}@clientefiel.test", "teste12345"
    st, _ = call("POST", f"{api}/auth/v1/signup", {"email": email, "password": pw}, H())
    st, d = call("POST", f"{api}/auth/v1/token?grant_type=password", {"email": email, "password": pw}, H())
    if st != 200: sys.exit(f"login de teste falhou: {st} {d}")
    tok = d["access_token"]; OWN = H(tok)
    st, bid = call("POST", f"{api}/rest/v1/rpc/ensure_business", {"p_name": "Teste Segurança"}, OWN)
    check("ensure_business cria o negócio do dono", st == 200 and bid)
    st, rows = call("GET", f"{api}/rest/v1/businesses?id=eq.{bid}&select=plan,trial,owner_id,slug", None, OWN)
    biz = rows[0]; check("negócio nasce Free com teste", biz["plan"] == "free" and biz["trial"] is True)
    P = {**OWN, "Prefer": "return=representation"}

    print("Plano travado:")
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{bid}", {"plan": "multi"}, P)
    check("dono NÃO consegue virar 'multi' pelo navegador", st >= 400, f"{st} {d}")
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{bid}", {"trial": False}, P)
    check("dono NÃO consegue encerrar/alterar o teste", st >= 400, f"{st} {d}")
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{bid}", {"owner_id": str(uuid.uuid4())}, P)
    check("dono NÃO consegue trocar o dono do negócio", st >= 400, f"{st} {d}")
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{bid}", {"tagline": "ok"}, P)
    check("dono continua editando campos normais", st == 200 and d and d[0]["tagline"] == "ok", f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/businesses", {"owner_id": json.loads(__import__('base64').urlsafe_b64decode(tok.split('.')[1] + '==')).get("sub"), "name": "Outro", "slug": "outro-" + uuid.uuid4().hex[:6], "plan": "multi", "trial": False}, P)
    check("negócio criado direto pela API nasce Free/teste (plano ignorado)", st in (201, 200) and d and d[0]["plan"] == "free" and d[0]["trial"] is True, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/set_business_plan", {"p_business": bid, "p_plan": "pro"}, OWN)
    check("set_business_plan recusa o usuário comum", st >= 400, f"{st} {d}")
    print("Superadmin / Forja (migração 20261024):")
    st, d = call("GET", f"{api}/rest/v1/forja_secrets?select=*", None, OWN)
    check("forja_secrets é inacessível para o usuário comum", st >= 400, f"{st} {d}")
    st, d = call("GET", f"{api}/rest/v1/platform_admins?select=*", None, OWN)
    check("platform_admins é inacessível para o usuário comum", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/is_platform_admin", {}, OWN)
    check("dono comum não é superadmin", st == 200 and d is False, f"{st} {d}")
    for fn, args in (("admin_businesses", {}), ("admin_business", {"p_business": bid}), ("admin_set_nav", {"p_business": bid, "p_items": [{"label": "x", "kind": "url", "target": "https://x.com"}]}),
                     ("admin_upsert_forja", {"p_business": bid, "p_name": "b", "p_base_url": "https://b.workers.dev", "p_token": "t"}), ("admin_remove_forja", {"p_business": bid})):
        st, d = call("POST", f"{api}/rest/v1/rpc/{fn}", args, OWN); check(f"{fn} recusa quem não é superadmin", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/nav_items", {"business_id": bid, "label": "x", "kind": "url", "target": "https://x.com"}, P)
    check("dono NÃO grava itens no próprio menu (só o superadmin)", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/forja_instances", {"business_id": bid, "name": "b", "base_url": "https://b.workers.dev"}, P)
    check("dono NÃO vincula chatbot sozinho", st >= 400, f"{st} {d}")
    SRV = {"apikey": k["SERVICE_ROLE_KEY"], "Authorization": "Bearer " + k["SERVICE_ROLE_KEY"]}
    st, d = call("POST", f"{api}/rest/v1/nav_items", {"business_id": bid, "label": "Conversas", "kind": "forja", "target": "conversations"}, {**SRV, "Prefer": "return=representation"})
    st, rows = call("GET", f"{api}/rest/v1/nav_items?select=label&business_id=eq.{bid}", None, OWN)
    check("dono lê os itens atribuídos ao seu negócio", st == 200 and rows and rows[0]["label"] == "Conversas", f"{st} {rows}")
    st, d = call("POST", f"{api}/rest/v1/nav_items", {"business_id": bid, "label": "ruim", "kind": "url", "target": "http://inseguro.com"}, {**SRV, "Prefer": "return=representation"})
    check("item do tipo link só aceita https", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/forja_instances", {"business_id": bid, "name": "b", "base_url": "https://b.workers.dev"}, {**SRV, "Prefer": "return=representation"})
    st, d = call("POST", f"{api}/rest/v1/forja_secrets", {"instance_id": d[0]["id"], "control_token": "segredo"}, {**SRV, "Prefer": "return=representation"})
    for fn, args in (("admin_stats", {}), ("admin_payments", {}), ("admin_customers", {"p_business": bid}), ("admin_set_plan", {"p_business": bid, "p_plan": "pro"}),
                     ("admin_update_business", {"p_business": bid, "p_patch": {"name": "x"}}), ("admin_set_card", {"p_business": bid, "p_card": {"name": "x"}}), ("admin_set_items", {"p_business": bid, "p_items": []}),
                     ("admin_export_business", {"p_business": bid}), ("admin_import_model", {"p_business": bid, "p_model": {}}), ("admin_create_business", {"p_owner": str(uuid.uuid4()), "p_name": "x"}), ("admin_audit_list", {})):
        st, d = call("POST", f"{api}/rest/v1/rpc/{fn}", args, OWN); check(f"{fn} recusa quem não é superadmin", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    st, d = call("GET", f"{api}/rest/v1/admin_audit?select=*", None, OWN)
    check("admin_audit é inacessível para o usuário comum", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_stats", {}, SRV)
    check("service_role passa em is_platform_admin (API local do superadmin)", st == 200 and isinstance(d, dict) and "businesses" in d, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/my_forja", {}, OWN)
    check("dono vê o próprio chatbot sem o token", st == 200 and d and d.get("has_token") is True and "segredo" not in json.dumps(d), f"{st} {d}")

    st, d = call("POST", f"{api}/rest/v1/rpc/set_business_plan", {"p_business": bid, "p_plan": "pro", "p_trial": False}, SRV)
    st2, rows = call("GET", f"{api}/rest/v1/businesses?id=eq.{bid}&select=plan,trial", None, OWN)
    check("o servidor (service_role) consegue mudar o plano", st in (200, 204) and rows[0]["plan"] == "pro" and rows[0]["trial"] is False, f"{st} {d} {rows}")

    print("Página em preparação com conta própria (migração 30):")
    did = "0x0:0x" + uuid.uuid4().hex[:12]
    lead = {"name": "Pizzaria Teste Conta", "segmento": "Pizzaria", "grupo": "Alimentação", "data_id": did, "address": "Rua A, 1 - Itapema - SC", "card": {"stamps": 10, "reward_label": "Uma pizza grátis"},
            "items": [{"type": "hours", "title": "Horário", "items": [{"dia": "Segunda-feira", "horas": "18:00–23:00"}]}], "gmaps": {"schema": "seuclientefiel.ficha/1", "nome": "Pizzaria Teste Conta", "nota": 4.8}}
    st, pr = call("POST", f"{api}/rest/v1/rpc/admin_create_prospect", {"p_lead": lead}, SRV)
    pbid = (pr or {}).get("id")
    check("página criada com a ficha do Google guardada (settings.gmaps.main)", st == 200 and pbid and call("GET", f"{api}/rest/v1/businesses?id=eq.{pbid}&select=settings", None, SRV)[1][0]["settings"].get("gmaps", {}).get("main", {}).get("nota") == 4.8, f"{st} {pr}")
    tmail, tpw = f"pizzaria-teste-{uuid.uuid4().hex[:6]}@seuclientefiel.invalid", "Abcd-Efgh-2345"
    st, u = call("POST", f"{api}/auth/v1/admin/users", {"email": tmail, "password": tpw, "email_confirm": True}, SRV)
    check("conta com e-mail temporário (.invalid) é criada", st == 200 and (u or {}).get("id"), f"{st} {u}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_assign_owner", {"p_business": pbid, "p_user": u["id"]}, OWN)
    check("admin_assign_owner recusa quem não é superadmin", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    own_id = json.loads(__import__('base64').urlsafe_b64decode(tok.split('.')[1] + '==')).get("sub")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_assign_owner", {"p_business": pbid, "p_user": own_id}, SRV)
    check("admin_assign_owner recusa conta que já tem outro negócio", st >= 400 and "outro negócio" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_assign_owner", {"p_business": pbid, "p_user": u["id"]}, SRV)
    check("superadmin põe a página na conta do estabelecimento", st == 200 and (d or {}).get("ok"), f"{st} {d}")
    st, d = call("POST", f"{api}/auth/v1/token?grant_type=password", {"email": tmail, "password": tpw}, H()); POWN = H(d["access_token"]); PP = {**POWN, "Prefer": "return=representation"}
    st, b2 = call("POST", f"{api}/rest/v1/rpc/ensure_business", {"p_name": None}, POWN)
    check("o acesso temporário entra direto na página preparada", st == 200 and b2 == pbid, f"{st} {b2}")
    slug2 = call("GET", f"{api}/rest/v1/businesses?id=eq.{pbid}&select=slug", None, SRV)[1][0]["slug"]
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{pbid}", {"settings": {"welcome": {"mode": "auto", "qty": 1}}}, PP)
    check("dono salva as configurações e a página CONTINUA em prévia (settings.prospect preservado)", st == 200 and d and d[0]["settings"].get("prospect", {}).get("status") == "preview", f"{st} {d}")
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{pbid}", {"settings": {"prospect": {"status": "claimed"}}}, PP)
    check("dono NÃO tira a prévia mexendo em settings", d and d[0]["settings"]["prospect"]["status"] == "preview", f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_claim_status", {"p_slug": slug2}, H())
    check("página pública mostra a prévia (sem cadastro)", st == 200 and (d or {}).get("preview") is True, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_activate_prospect", {"p_business": pbid}, POWN)
    check("admin_activate_prospect recusa o dono", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/owner_activate_business", {}, POWN)
    st2, rows = call("GET", f"{api}/rest/v1/businesses?id=eq.{pbid}&select=settings,trial,plan", None, POWN)
    check("dono ativa a própria página: sai da prévia e começa o teste grátis", st == 200 and (d or {}).get("ok") and rows[0]["settings"]["prospect"]["status"] == "claimed" and rows[0]["trial"] is True and rows[0]["plan"] == "free", f"{st} {d} {rows}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_claim_status", {"p_slug": slug2}, H())
    check("depois de ativada a página aceita cadastro", st == 200 and (d or {}).get("preview") is False, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/owner_activate_business", {}, OWN)
    check("quem não tem página em prévia: ativar não faz nada", st == 200 and (d or {}).get("already") is True, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_create_prospect", {"p_lead": dict(lead, refresh=True, tagline="mudou")}, SRV)
    st2, rows = call("GET", f"{api}/rest/v1/businesses?id=eq.{pbid}&select=tagline", None, SRV)
    check("atualizar a página (refresh) NÃO mexe em página já ativada", st == 200 and (d or {}).get("existing") and not (d or {}).get("refreshed") and rows[0]["tagline"] != "mudou", f"{st} {d} {rows}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_assign_owner", {"p_business": pbid, "p_user": u["id"]}, SRV)
    check("página ativada não muda de dono por admin_assign_owner", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_update_business", {"p_business": pbid, "p_patch": {"logo_url": "javascript:alert(1)"}}, SRV)
    check("logo pelo painel recusa endereço que não é imagem (javascript:)", st >= 400 and "Imagem inválida" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_update_business", {"p_business": pbid, "p_patch": {"logo_url": "data:image/svg+xml;base64,PHN2Zz4="}}, SRV)
    check("logo pelo painel recusa SVG embutido", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_update_business", {"p_business": pbid, "p_patch": {"logo_url": "data:image/png;base64,iVBORw0KGgo="}}, SRV)
    check("logo pelo painel aceita PNG embutido", st == 200 and (d or {}).get("logo_url", "").startswith("data:image/png"), f"{st} {str(d)[:120]}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_update_business", {"p_business": pbid, "p_patch": {"logo_url": "data:image/png;base64,iVBORw0KGgo="}}, POWN)
    check("dono não usa admin_update_business", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_feature_usage", {}, OWN)
    check("lojista NÃO vê as funções em uso dos outros (admin_feature_usage)", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_feature_usage", {}, SRV)
    mine = next((x for x in (d or []) if x.get("id") == pbid), {})
    check("funções em uso: cartão (10 carimbos) e logo da página de teste aparecem certos", st == 200 and (mine.get("f") or {}).get("cartao") == 10 and (mine.get("f") or {}).get("logo") is True and (mine.get("f") or {}).get("qr") is False, f"{st} {str(mine)[:200]}")

    print("Sugestões da página (migração 20261102):")
    sugs = [{"kind": "note", "title": "Nota interna secreta", "evidence": "só o superadmin", "source": "jev", "confidence": 0.9, "dedupe": "note:teste"},
            {"kind": "reward", "title": "Prêmio: broto", "current": {"reward_label": "Uma pizza grátis"}, "proposal": {"reward_label": "Uma pizza broto", "stamps": 10}, "confidence": 0.7, "dedupe": "reward:teste"}]
    for fn, args in (("admin_suggestions", {"p_business": pbid}), ("admin_suggest", {"p_business": pbid, "p_items": sugs}), ("admin_suggestion_decide", {"p_id": str(uuid.uuid4()), "p_status": "approved"})):
        st, d = call("POST", f"{api}/rest/v1/rpc/{fn}", args, POWN); check(f"{fn} recusa o dono da página", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    st, d = call("GET", f"{api}/rest/v1/admin_suggestions?select=*", None, POWN)
    check("tabela admin_suggestions é inacessível para o lojista", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_suggest", {"p_business": pbid, "p_items": sugs}, SRV)
    st2, d2 = call("POST", f"{api}/rest/v1/rpc/admin_suggest", {"p_business": pbid, "p_items": sugs}, SRV)
    check("superadmin grava sugestões; rodar de novo não duplica", st == 200 and (d or {}).get("open") == 2 and st2 == 200 and (d2 or {}).get("open") == 2, f"{st} {d} {st2} {d2}")
    st, lst = call("POST", f"{api}/rest/v1/rpc/admin_suggestions", {"p_business": pbid}, SRV)
    rid = next((x["id"] for x in (lst or []) if x.get("kind") == "reward"), None)
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_suggestion_decide", {"p_id": rid, "p_status": "approved"}, SRV)
    call("POST", f"{api}/rest/v1/rpc/admin_suggest", {"p_business": pbid, "p_items": [dict(sugs[1], confidence=0.99)]}, SRV)
    st, lst = call("POST", f"{api}/rest/v1/rpc/admin_suggestions", {"p_business": pbid}, SRV)
    r2 = next((x for x in (lst or []) if x.get("id") == rid), {})
    check("sugestão já decidida não reabre numa nova rodada", r2.get("status") == "approved" and float(r2.get("confidence") or 0) == 0.7, f"{r2}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_suggestion_decide", {"p_id": rid, "p_status": "hack"}, SRV)
    check("situação inválida é recusada", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_business", {"p_business": pbid}, SRV)
    check("admin_business devolve itens da página, cartão completo e sugestões em aberto", st == 200 and isinstance((d or {}).get("items"), list) and len(d["items"]) >= 1
          and "reward_label" in ((d.get("cards") or [{}])[0]) and d.get("suggestions_open") == 1, f"{st} {str(d)[:200]}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_business", {"p_slug": slug2}, H())
    check("página pública não mostra nota interna", st == 200 and "Nota interna secreta" not in json.dumps(d, ensure_ascii=False), f"{st}")

    print("Desenho do cartão pelo superadmin (vitrine, migração 20261102):")
    dz = {"tpl": "full", "c1": "#201f1f", "c2": "#e40d23", "photo": "data:image/jpeg;base64,/9j/4AAQ", "t2": "TESTE"}
    cid = (call("GET", f"{api}/rest/v1/cards?business_id=eq.{pbid}&active=eq.true&select=id", None, SRV)[1] or [{}])[0].get("id")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_set_card", {"p_business": pbid, "p_card": {"id": cid, "stamps": 10, "reward_label": "Uma pizza broto", "design": dz, "theme": "pizzaria"}}, OWN)
    check("lojista não grava desenho pelo admin_set_card", st >= 400 and "forbidden" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_set_card", {"p_business": pbid, "p_card": {"id": cid, "stamps": 10, "reward_label": "Uma pizza broto", "design": dz, "theme": "pizzaria"}}, SRV)
    check("superadmin grava desenho e tema do cartão", st == 200 and (d or {}).get("design", {}).get("tpl") == "full" and d.get("theme") == "pizzaria" and d.get("model") == "premium", f"{st} {str(d)[:160]}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_set_card", {"p_business": pbid, "p_card": {"id": cid, "stamps": 10, "reward_label": "Outro prêmio"}}, SRV)
    check("salvar o cartão sem desenho mantém o desenho", st == 200 and (d or {}).get("design", {}).get("tpl") == "full" and d.get("reward_label") == "Outro prêmio", f"{st} {str(d)[:160]}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_business", {"p_slug": slug2}, H())
    check("página pública recebe o desenho do cartão", st == 200 and ((d or {}).get("card") or {}).get("design", {}).get("t2") == "TESTE", f"{st}")
    st, m = call("POST", f"{api}/rest/v1/rpc/admin_export_business", {"p_business": pbid}, SRV)
    check("modelo exportado leva desenho e tema (e não leva a marcação de prévia)", st == 200 and any((c.get("design") or {}).get("tpl") == "full" for c in (m or {}).get("cards", [])) and "prospect" not in ((m or {}).get("business") or {}).get("settings", {}), f"{st}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_import_model", {"p_business": pbid, "p_model": {"business": {"cover_url": "javascript:alert(1)"}}}, SRV)
    check("importar modelo recusa capa que não é imagem", st >= 400 and "Imagem inválida" in str(d), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/admin_import_model", {"p_business": pbid, "p_model": {"business": {"settings": {"pageBg": {"type": "gradient", "colors": ["#fef1ea", "#fbd8d5"], "angle": 170}}}, "cards": [dict(m["cards"][0], active=True)]}, "p_replace": False}, SRV)
    st2, d2 = call("POST", f"{api}/rest/v1/rpc/public_business", {"p_slug": slug2}, H())
    check("importar modelo aplica fundo da página e cartão com desenho", st == 200 and ((d2 or {}).get("page_bg") or {}).get("type") == "gradient", f"{st} {d} {str(d2)[:120]}")

    print("Limites contra abuso (migração 20261103):")
    call("DELETE", f"{api}/rest/v1/abuse_hits?id=gt.0", None, SRV)
    st, d = call("GET", f"{api}/rest/v1/abuse_hits?select=*", None, OWN)
    check("abuse_hits é inacessível para o usuário comum", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/abuse_ok", {"p_biz": pbid, "p_kind": "x", "p_max_biz": 1, "p_max_net": 1}, OWN)
    check("abuse_ok não é chamável pelo navegador", st >= 400, f"{st} {d}")
    res = [call("POST", f"{api}/rest/v1/rpc/public_join", {"p_slug": slug2, "p_name": "Teste Limite", "p_email": f"lim-{uuid.uuid4().hex[:8]}@exemplo.com"}, H()) for _ in range(32)]
    okn = sum(1 for s_, d_ in res if s_ == 200 and isinstance(d_, str)); blocked = [d_ for s_, d_ in res if s_ >= 400 and "muitos_cadastros" in str(d_)]
    st, hits = call("GET", f"{api}/rest/v1/abuse_hits?select=net&kind=eq.join", None, SRV)
    nets = [h.get("net") for h in (hits or []) if h.get("net")]
    check("32 cadastros seguidos da mesma rede: passam 30 e o resto leva 'muitos_cadastros'" if nets else "sem cabeçalho de IP neste ambiente: só vale o teto por negócio (200)",
          (okn == 30 and len(blocked) == 2) if nets else okn == 32, f"ok={okn} bloqueados={len(blocked)} {str(res[-1])[:120]}")
    check("nenhum IP é guardado: só o hash da rede por negócio (64 hex)", all(len(n) == 64 and all(c in "0123456789abcdef" for c in n) for n in nets), str(nets[:1]))
    call("DELETE", f"{api}/rest/v1/abuse_hits?id=gt.0", None, SRV)   # não deixa a contagem do teste travar as seções seguintes
    vis = "visitante-" + uuid.uuid4().hex[:10]
    st, d = call("POST", f"{api}/rest/v1/rpc/public_track", {"p_slug": slug2, "p_visitor": vis, "p_kind": "view", "p_src": "origem-inventada", "p_device": "geladeira", "p_lang": "pt-BR<script>"}, H())
    st2, vr = call("GET", f"{api}/rest/v1/visits?select=src,device,lang&visitor_id=eq.{vis}", None, SRV)
    check("visita: origem e aparelho fora da lista viram vazio; idioma só com letras", st in (200, 204) and vr and vr[0].get("src") is None and vr[0].get("device") is None and vr[0].get("lang") == "pt-BRscript", f"{st} {vr}")

    casos = {"https://hooks.zapier.com/hooks/catch/1/abc/": True, "https://hook.eu1.make.com:443/x": True, "https://hooks.zapier.com:8443/x": False,
             "https://127.0.0.1.nip.io/x": False, "https://meu.sslip.io/x": False, "https://10.0.0.5/x": False, "http://hooks.zapier.com/x": False,
             "https://servico.internal/x": False, "https://localhost.exemplo.com.br/x": False}
    certos = {u: call("POST", f"{api}/rest/v1/rpc/webhook_url_ok", {"p_url": u}, SRV)[1] for u in casos}
    check("endereço de webhook: só https, porta 443, sem IP, DNS curinga ou nome interno", certos == casos, str({u: v for u, v in certos.items() if v != casos[u]}))

    print("public_join:")
    slug = biz["slug"]; em = f"cli-{uuid.uuid4().hex[:6]}@exemplo.com"
    st, t1 = call("POST", f"{api}/rest/v1/rpc/public_join", {"p_slug": slug, "p_name": "Maria", "p_email": em, "p_consent": False}, H())
    check("cliente novo recebe o token", st == 200 and isinstance(t1, str) and len(t1) >= 16, f"{st} {t1}")
    st, t2 = call("POST", f"{api}/rest/v1/rpc/public_join", {"p_slug": slug, "p_name": "Intruso", "p_email": em.upper(), "p_consent": True}, H())
    check("mesmo e-mail NÃO devolve o cartão de quem já existe", st == 200 and t2 is None, f"{st} {t2}")
    st, rows = call("GET", f"{api}/rest/v1/customers?business_id=eq.{bid}&email=eq.{em}&select=name,marketing_consent", None, OWN)
    check("e nada foi alterado (nome e consentimento)", rows and rows[0]["name"] == "Maria" and rows[0]["marketing_consent"] is False, f"{rows}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_join", {"p_slug": slug, "p_name": "Maria", "p_email": "não-é-email"}, H())
    check("e-mail inválido é recusado", st >= 400, f"{st} {d}")

    print("Fluxo do cartão (código curto, boas-vindas, pedidos de carimbo):")
    def settings(**kw):
        st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{bid}", {"settings": kw}, P); return st
    def card_of(t): return call("POST", f"{api}/rest/v1/rpc/public_card", {"p_token": t}, H())[1]
    def join(name):
        return call("POST", f"{api}/rest/v1/rpc/public_join", {"p_slug": slug, "p_name": name, "p_email": f"{uuid.uuid4().hex[:8]}@exemplo.com"}, H())[1]
    c1 = card_of(t1)
    code1 = (c1 or {}).get("customer", {}).get("code", "")
    check("cliente tem código curto de 6 letras/números (sem 0, O, 1, I)", len(code1) == 6 and not set(code1) & set("01OI"), code1)
    check("cartão público traz pedidos abertos e origem dos carimbos", isinstance(c1.get("pending"), list) and "welcome" in (c1.get("business") or {}), str(c1)[:160])
    settings(welcome={"mode": "auto", "qty": 1})
    ta = join("Bia Auto"); ca = card_of(ta)
    check("boas-vindas automático: já entra com 1 carimbo", ca["stamps"] == 1 and ca["events"] and ca["events"][0]["source"] == "welcome", str(ca)[:200])
    settings(welcome={"mode": "approve", "qty": 2})
    tb = join("Caio Aprova"); cb = card_of(tb)
    check("boas-vindas com aprovação: 0 carimbos e 1 pedido aberto", cb["stamps"] == 0 and len(cb["pending"]) == 1 and cb["pending"][0]["kind"] == "welcome", str(cb)[:200])
    st, reqs = call("GET", f"{api}/rest/v1/stamp_requests?business_id=eq.{bid}&status=eq.pending&select=id,kind,qty,customer_id", None, OWN)
    rw = next((r for r in reqs or [] if r["customer_id"] == cb["customer"]["id"]), None)
    check("o dono vê o pedido no painel", st == 200 and rw and rw["qty"] == 2, f"{st} {reqs}")
    st, d = call("POST", f"{api}/rest/v1/rpc/decide_stamp_request", {"p_request": rw["id"], "p_approve": True}, H())
    check("visitante NÃO aprova pedido", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/decide_stamp_request", {"p_request": rw["id"], "p_approve": True}, OWN)
    cb = card_of(tb)
    check("dono aprova: cliente ganha os 2 carimbos e o pedido fecha", st == 200 and d.get("ok") and cb["stamps"] == 2 and not cb["pending"], f"{st} {d} {cb['stamps']} {cb['pending']}")
    st, d = call("POST", f"{api}/rest/v1/rpc/decide_stamp_request", {"p_request": rw["id"], "p_approve": True}, OWN)
    check("aprovar de novo não dá carimbo em dobro", st == 200 and d.get("ok") is False and card_of(tb)["stamps"] == 2, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_request_stamp", {"p_token": tb}, H())
    st2, d2 = call("POST", f"{api}/rest/v1/rpc/public_request_stamp", {"p_token": tb, "p_note": "segundo"}, H())
    st3, reqs = call("GET", f"{api}/rest/v1/stamp_requests?customer_id=eq.{cb['customer']['id']}&status=eq.pending&select=id,kind", None, OWN)
    check("cliente pede carimbo pelo comprovante (pedido repetido não duplica)", st == 200 and d.get("ok") and d.get("code") == cb["customer"]["code"] and st2 == 200 and len(reqs) == 1 and reqs[0]["kind"] == "receipt", f"{st} {d} {st2} {reqs}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_request_stamp", {"p_token": "x" * 32}, H())
    check("token inventado não cria pedido", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/decide_stamp_request", {"p_request": reqs[0]["id"], "p_approve": False}, OWN)
    check("dono recusa o pedido sem dar carimbo", st == 200 and d.get("ok") and card_of(tb)["stamps"] == 2, f"{st} {d}")
    settings(receipts={"on": False})
    st, d = call("POST", f"{api}/rest/v1/rpc/public_request_stamp", {"p_token": tb}, H())
    check("com o comprovante desligado, o pedido é recusado", st >= 400, f"{st} {d}")
    st, d = call("GET", f"{api}/rest/v1/stamp_requests?select=id", None, H())
    check("visitante NÃO lê os pedidos", st >= 400 or d == [], f"{st} {str(d)[:80]}")
    st, d = call("POST", f"{api}/rest/v1/stamp_requests", {"business_id": bid, "customer_id": cb["customer"]["id"], "kind": "receipt"}, OWN)
    check("ninguém grava pedido direto na tabela (nem o dono)", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/give_stamp_by_code", {"p_code": cb["customer"]["code"].lower(), "p_qty": 1}, OWN)
    check("atendente carimba pelo código curto (maiúsc./minúsc. tanto faz)", st == 200 and d and d[0]["added"] == 1 and card_of(tb)["stamps"] == 3, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/give_stamp_by_code", {"p_code": cb["customer"]["code"]}, H())
    check("visitante NÃO carimba pelo código", st >= 400, f"{st} {d}")
    email2, pw2 = f"seg2-{uuid.uuid4().hex[:8]}@clientefiel.test", "teste12345"
    call("POST", f"{api}/auth/v1/signup", {"email": email2, "password": pw2}, H())
    st, d2 = call("POST", f"{api}/auth/v1/token?grant_type=password", {"email": email2, "password": pw2}, H())
    OTHER = H(d2["access_token"]); call("POST", f"{api}/rest/v1/rpc/ensure_business", {"p_name": "Outra Loja"}, OTHER)
    st, d = call("POST", f"{api}/rest/v1/rpc/give_stamp_by_code", {"p_code": cb["customer"]["code"]}, OTHER)
    check("outro lojista NÃO acha o cliente pelo código", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/gen_short_code", {}, OWN)
    check("gerador de código não fica exposto", st >= 400, f"{st} {d}")
    st, rows = call("POST", f"{api}/rest/v1/customers", {"business_id": bid, "name": "Manual", "email": f"m-{uuid.uuid4().hex[:6]}@exemplo.com", "code": "AAAAAA"}, P)
    mc = rows[0] if st in (200, 201) and rows else {}
    check("cliente cadastrado pelo painel ganha código do banco (o navegador não escolhe)", mc.get("code") and mc["code"] != "AAAAAA" and len(mc["code"]) == 6, f"{st} {rows}")
    st, rows = call("PATCH", f"{api}/rest/v1/customers?id=eq.{mc.get('id')}", {"code": "BBBBBB", "name": "Manual 2"}, P)
    check("o código não muda depois (o resto continua editável)", st == 200 and rows and rows[0]["code"] == mc.get("code") and rows[0]["name"] == "Manual 2", f"{st} {rows}")
    settings(welcome={"mode": "off"}, receipts={"on": True})

    print("Conteúdo só no local (Wi-Fi da loja / localização):")
    st, rows = call("POST", f"{api}/rest/v1/page_items", {"business_id": bid, "type": "menu", "title": "Cardápio do salão", "items": [{"name": "Café", "price": "8"}], "onsite": True}, P)
    mid = rows[0]["id"] if st in (200, 201) and rows else None
    check("dono marca um cardápio como 'só no local'", bool(mid), f"{st} {rows}")
    st, pb = call("POST", f"{api}/rest/v1/rpc/public_business", {"p_slug": slug}, H())
    it = next((x for x in (pb or {}).get("items", []) if x.get("id") == mid), {})
    check("página pública recebe só o título (os itens do cardápio não vão)", it.get("locked") is True and "items" not in it and it.get("title") == "Cardápio do salão", str(it))
    st, d = call("POST", f"{api}/rest/v1/rpc/public_onsite", {"p_slug": slug}, H())
    check("sem Wi-Fi da loja nem localização: não libera", st == 200 and d.get("ok") is False, f"{st} {d}")
    LOJA = {"X-Forwarded-For": "198.51.100.23"}
    st, d = call("POST", f"{api}/rest/v1/rpc/register_network", {"p_business": bid, "p_label": "Wi-Fi do salão"}, {**OWN, **LOJA})
    check("dono cadastra a rede atual (Wi-Fi da loja)", st == 200 and d.get("ok"), f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/register_network", {"p_business": bid}, {**H(), **LOJA})
    check("visitante NÃO cadastra rede", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/register_network", {"p_business": bid}, {**OTHER, **LOJA})
    check("outro lojista NÃO cadastra rede no meu negócio", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_onsite", {"p_slug": slug}, {**H(), **LOJA})
    check("cliente no Wi-Fi da loja recebe o cardápio", st == 200 and d.get("ok") and d.get("via") == "wifi" and d["items"] and d["items"][0]["items"][0]["name"] == "Café", f"{st} {str(d)[:160]}")
    st, d = call("POST", f"{api}/rest/v1/rpc/public_onsite", {"p_slug": slug}, {**H(), "X-Forwarded-For": "198.51.100.99"})
    check("de outra rede: não libera", st == 200 and d.get("ok") is False, f"{st} {d}")
    call("POST", f"{api}/rest/v1/rpc/register_network", {"p_business": bid, "p_label": "IPv6"}, {**OWN, "X-Forwarded-For": "2001:db8:abcd:12::1"})
    st, d = call("POST", f"{api}/rest/v1/rpc/public_onsite", {"p_slug": slug}, {**H(), "X-Forwarded-For": "2001:db8:abcd:12::beef"})
    st2, d2 = call("POST", f"{api}/rest/v1/rpc/public_onsite", {"p_slug": slug}, {**H(), "X-Forwarded-For": "2001:db8:abcd:13::1"})
    check("IPv6: outro aparelho do mesmo Wi-Fi (mesmo /64) libera; outra rede não", d.get("ok") is True and d2.get("ok") is False, f"{d} {d2}")
    st, nets = call("GET", f"{api}/rest/v1/business_networks?business_id=eq.{bid}&select=label,net_hash", None, OWN)
    check("o banco guarda só um hash da rede (nada do IP)", st == 200 and len(nets) == 2 and all(len(n["net_hash"]) == 64 and "198.51" not in n["net_hash"] for n in nets), f"{st} {nets}")
    st, d = call("GET", f"{api}/rest/v1/business_networks?select=*", None, H())
    check("visitante NÃO lê as redes", st >= 400 or d == [], f"{st} {str(d)[:80]}")
    settings(presence={"lat": -27.5954, "lng": -48.5480, "radius": 150})
    st, d = call("POST", f"{api}/rest/v1/rpc/public_onsite", {"p_slug": slug, "p_lat": -27.5954 + 0.0009, "p_lng": -48.5480, "p_acc": 20}, {**H(), "X-Forwarded-For": "203.0.113.50"})
    check("localização a ~100 m da loja (raio 150 m): libera", d.get("ok") is True and d.get("via") == "geo", str(d)[:120])
    st, d = call("POST", f"{api}/rest/v1/rpc/public_onsite", {"p_slug": slug, "p_lat": -27.5954 + 0.01, "p_lng": -48.5480, "p_acc": 20}, {**H(), "X-Forwarded-For": "203.0.113.50"})
    check("localização a ~1 km: não libera", d.get("ok") is False, str(d))
    settings(welcome={"mode": "off"}, receipts={"on": True})

    print("Links https:")
    def item(url, typ="link"): return call("POST", f"{api}/rest/v1/page_items", {"business_id": bid, "type": typ, "title": "t", "url": url}, P)
    for bad in ("http://exemplo.com", "javascript:alert(1)", "data:text/html,<script>1</script>", "ftp://x.com/a", "https://x.com/a b"):
        st, d = item(bad); check(f"recusa {bad[:28]}", st >= 400, f"{st} {d}")
    for good, typ in (("https://exemplo.com/a?b=1", "link"), ("contato@exemplo.com", "contact"), ("+55 (48) 99999-0000", "contact")):
        st, d = item(good, typ); check(f"aceita {good[:28]}", st in (200, 201), f"{st} {d}")
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{bid}", {"logo_url": "javascript:alert(1)"}, P)
    check("logo só https ou imagem embutida", st >= 400, f"{st} {d}")
    st, d = call("PATCH", f"{api}/rest/v1/businesses?id=eq.{bid}", {"cover_url": "https://exemplo.com/capa.jpg"}, P)
    check("capa https é aceita", st == 200, f"{st} {d}")

    print("Formulário do site (leads):")
    lead = {"p_name": "Teste Site", "p_email": f"lead-{uuid.uuid4().hex[:6]}@exemplo.com", "p_consent": True, "p_source": {"page": "/contato/", "utm_source": "teste"}}
    st, d = call("POST", f"{api}/rest/v1/rpc/submit_lead", lead, H())
    check("visitante envia o formulário", st == 200 and d is True, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/submit_lead", {**lead, "p_consent": False}, H())
    check("sem consentimento é recusado", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/submit_lead", {**lead, "p_email": "x"}, H())
    check("e-mail inválido é recusado", st >= 400, f"{st} {d}")
    st, d = call("GET", f"{api}/rest/v1/leads?select=*", None, H())
    check("visitante NÃO lê os contatos", st >= 400 or d == [], f"{st} {str(d)[:80]}")
    st, d = call("GET", f"{api}/rest/v1/leads?select=*", None, OWN)
    check("lojista logado também NÃO lê os contatos do site", st >= 400 or d == [], f"{st} {str(d)[:80]}")
    st, d = call("POST", f"{api}/rest/v1/leads", {"name": "x", "email": "a@b.co", "consent": True}, H())
    check("ninguém grava direto na tabela", st >= 400, f"{st} {d}")
    st, d = call("POST", f"{api}/rest/v1/rpc/submit_lead", {**lead, "p_hp": "robo", "p_email": "robo@exemplo.com"}, H())
    st2, rows = call("GET", f"{api}/rest/v1/leads?email=eq.robo@exemplo.com&select=id", None, SRV)
    check("isca anti-robô: responde ok mas não grava", st == 200 and rows == [], f"{st} {rows}")

    print("maps-lookup:")
    fn = f"{api}/functions/v1/maps-lookup"
    st, d = call("POST", fn, {"action": "status"}, H())
    check("visitante (chave anon) é recusado", st in (401, 403), f"{st} {d}")
    st, d = call("POST", fn, {"action": "status"}, {"Content-Type": "application/json"})
    check("sem credencial é recusado", st in (401, 403), f"{st} {d}")
    st, d = call("POST", fn, {"action": "status"}, OWN)
    if st == 404 or (isinstance(d, dict) and "not found" in json.dumps(d).lower()):
        print("  (função não está sendo servida localmente — rode `npx supabase functions serve maps-lookup` para testar este item)")
    else:
        check("usuário logado passa pela checagem", st == 200, f"{st} {d}")

    print("Servidor de arquivos (porta 8080):")
    def get(path, host=None):
        r = urllib.request.Request("http://127.0.0.1:8080" + path, headers={"Host": host} if host else {})
        try:
            with urllib.request.urlopen(r, timeout=5) as x: return x.status, x.read(2000)
        except urllib.error.HTTPError as e: return e.code, b""
        except Exception as e: return 0, str(e).encode()
    s, _ = get("/app/")
    if s == 0: print("  (servidor não está rodando — `python tools/dev-server.py`)")
    else:
        check("app/ é servido", s == 200)
        for p in ("/.env.local", "/CLAUDE.md", "/supabase/seed.sql", "/tools/dev-server.py", "/app/../.env.local", "/app/%2e%2e/.env.local", "/app/assets/../../CLAUDE.md", "/app/assets/"):
            s, body = get(p); check(f"fora de app/ → 404: {p}", s == 404 and b"SERPAPI" not in body and b"anon" not in body[:0], str(s))
        s, b = get("/app/..%5c.env.local"); check("..%5c não vaza arquivo da raiz", b"SERPAPI" not in b and b"KEY" not in b)
        s, _ = get("/app/", host="evil.example.com"); check("Host estranho (DNS rebinding) → 403", s == 403, str(s))
    import socket
    ips = {i[4][0] for i in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)}
    for ip in ips:
        if ip.startswith("127."): continue
        s = socket.socket(); s.settimeout(1.5)
        try: s.connect((ip, 8080)); ok = False
        except Exception: ok = True
        finally: s.close()
        check(f"porta 8080 não responde pela rede ({ip})", ok)

    print()
    if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
    print("ok — travas de segurança conferidas")


main()
