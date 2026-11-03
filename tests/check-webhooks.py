"""Avisos para outros sistemas (webhooks) no Supabase LOCAL, com um receptor falso neste computador:
eventos reais (cliente novo, carimbo, recompensa, pedido de carimbo, contato do Wi-Fi, teste) saem do banco pelo pg_net,
chegam assinados (HMAC-SHA256), são marcados como entregues, reenviados depois de erro e só o dono vê/mexe.

Uso (a partir da raiz, com `npx supabase start` ligado):  python tests/check-webhooks.py
Sai com código 1 se algo falhar.
"""
import hashlib, hmac, json, os, pathlib, shutil, subprocess, sys, threading, time, urllib.request, urllib.error, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from _fnserve import project_id   # containers deste projeto: supabase_<serviço>_<project_id>

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAILS = []
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def check(name, ok, extra=""):
    print(("  ok   " if ok else "  FALHA ") + name + (f"  → {extra}" if (extra and not ok) else ""))
    if not ok: FAILS.append(name)


def supa_env():
    out = subprocess.run([shutil.which("npx") or "npx", "-y", "supabase", "status", "-o", "env"], cwd=ROOT, capture_output=True, text=True, shell=(os.name == "nt")).stdout
    k = {}
    for line in out.splitlines():
        if "=" in line: a, b = line.split("=", 1); k[a] = b.strip().strip('"')
    if not k.get("API_URL"): sys.exit("Supabase local desligado (npx supabase start).")
    return k


def call(method, url, body=None, headers=None):
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), method=method, headers={"Content-Type": "application/json", **(headers or {})})
    def parse(raw):
        try: return json.loads(raw)
        except Exception: return raw
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return r.status, parse(r.read())
    except urllib.error.HTTPError as e: return e.code, parse(e.read())


DB = None
def sql(q):
    r = subprocess.run(["docker", "exec", DB, "psql", "-U", "postgres", "-d", "postgres", "-Atc", q], capture_output=True, text=True, timeout=60)
    return r.stdout.strip()


# ---------------------------------------------------------------- receptor falso
GOT, MODE = [], {"status": 200}
class Hook(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        GOT.append({"path": self.path, "h": {k.lower(): v for k, v in self.headers.items()}, "raw": raw})
        st = MODE["status"]; self.send_response(st); self.send_header("Content-Type", "text/plain"); self.end_headers(); self.wfile.write(b"ok" if st < 300 else b"erro")


def wait_for(fn, secs=15):
    t = time.time()
    while time.time() - t < secs:
        v = fn()
        if v: return v
        time.sleep(0.4)
    return fn()


def main():
    global DB
    k = supa_env(); api = k["API_URL"].rstrip("/"); anon = k["ANON_KEY"]
    H = lambda tok=None: {"apikey": anon, "Authorization": "Bearer " + (tok or anon)}
    DB = "supabase_db_" + project_id()   # só o banco deste projeto (no computador há outros, ex.: EvenNet e Hori)
    if DB not in subprocess.run(["docker", "ps", "--format", "{{.Names}}"], capture_output=True, text=True).stdout.split(): sys.exit(f"Container {DB} desligado (npx supabase start).")
    ip = (sql("select 1") and subprocess.run(["docker", "exec", DB, "getent", "ahostsv4", "host.docker.internal"], capture_output=True, text=True).stdout.split() or [""])[0]
    if not DB or not ip: sys.exit("Docker/Supabase local indisponível.")
    srv = ThreadingHTTPServer(("127.0.0.1", 0), Hook); threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    sql(f"insert into public.webhook_dev_hosts(host) values ('{ip}') on conflict do nothing")   # só neste teste local
    try:
        email, pw = f"wh-{uuid.uuid4().hex[:8]}@clientefiel.test", "teste12345"
        call("POST", f"{api}/auth/v1/signup", {"email": email, "password": pw}, H())
        st, d = call("POST", f"{api}/auth/v1/token?grant_type=password", {"email": email, "password": pw}, H()); OWN = H(d["access_token"])
        st, bid = call("POST", f"{api}/rest/v1/rpc/ensure_business", {"p_name": "Padaria Webhook"}, OWN)
        st, biz = call("GET", f"{api}/rest/v1/businesses?id=eq.{bid}&select=slug", None, OWN); slug = biz[0]["slug"]
        P = {**OWN, "Prefer": "return=representation"}

        print("Endereço do webhook:")
        for bad in ("https://localhost/x", "http://exemplo.com.br/hook", "https://10.0.0.5/hook", "https://servidor.internal/x", "javascript:alert(1)"):
            st, d = call("POST", f"{api}/rest/v1/webhooks", {"business_id": bid, "url": bad}, P)
            check(f"recusa {bad}", st >= 400, f"{st} {d}")
        st, d = call("POST", f"{api}/rest/v1/webhooks", {"business_id": bid, "url": "https://hooks.exemplo.com.br/a?x=1"}, P)
        check("aceita https com domínio (ex.: Zapier, Make, n8n)", st in (200, 201), f"{st} {d}")
        if st in (200, 201): call("DELETE", f"{api}/rest/v1/webhooks?id=eq.{d[0]['id']}", None, OWN)

        st, d = call("POST", f"{api}/rest/v1/webhooks", {"business_id": bid, "url": f"http://{ip}:{port}/todos"}, P)
        hook = d[0] if st in (200, 201) else {}
        st2, d2 = call("POST", f"{api}/rest/v1/webhooks", {"business_id": bid, "url": f"http://{ip}:{port}/so-clientes", "events": ["customer.created", "evento.inventado"]}, P)
        hook2 = d2[0] if st2 in (200, 201) else {}
        check("dono cadastra webhooks (o segredo é gerado pelo banco)", bool(hook.get("secret")) and len(hook["secret"]) == 48, f"{st} {d}")
        check("evento desconhecido é descartado da lista", hook2.get("events") == ["customer.created"], str(hook2.get("events")))

        print("Eventos:")
        st, tok = call("POST", f"{api}/rest/v1/rpc/public_join", {"p_slug": slug, "p_name": "Rita Webhook", "p_email": f"{uuid.uuid4().hex[:6]}@exemplo.com", "p_phone": "48999990000"}, H())
        st, card = call("POST", f"{api}/rest/v1/rpc/public_card", {"p_token": tok}, H()); cid = card["customer"]["id"]
        call("POST", f"{api}/rest/v1/rpc/give_stamp", {"p_customer": cid, "p_qty": 1}, OWN)
        call("POST", f"{api}/rest/v1/rpc/give_stamp", {"p_customer": cid, "p_qty": 7}, OWN)
        call("POST", f"{api}/rest/v1/rpc/redeem_reward", {"p_customer": cid}, OWN)
        call("POST", f"{api}/rest/v1/rpc/public_request_stamp", {"p_token": tok}, H())
        st, reqs = call("GET", f"{api}/rest/v1/stamp_requests?customer_id=eq.{cid}&select=id", None, OWN)
        call("POST", f"{api}/rest/v1/rpc/decide_stamp_request", {"p_request": reqs[0]["id"], "p_approve": True}, OWN)
        st, wi = call("POST", f"{api}/rest/v1/page_items", {"business_id": bid, "type": "wifi", "title": "Loja", "body": "senha123", "label": "lead"}, P)
        call("POST", f"{api}/rest/v1/rpc/public_wifi_pass", {"p_slug": slug, "p_item": wi[0]["id"], "p_visitor": "visitante-teste-1", "p_name": "Caio Wifi", "p_phone": "48988887777", "p_consent": True}, H())
        call("POST", f"{api}/rest/v1/rpc/webhook_test", {"p_webhook": hook.get("id")}, OWN)
        want = ["customer.created", "stamp.added", "stamp.added", "reward.redeemed", "stamp_request.created", "stamp.added", "stamp_request.approved", "lead.wifi", "webhook.test"]
        todos = lambda: [g for g in GOT if g["path"] == "/todos"]
        wait_for(lambda: len(todos()) >= len(want), 20)
        evs = [json.loads(g["raw"])["event"] for g in todos()]
        check("chegam todos os eventos no receptor", sorted(evs) == sorted(want), str(evs))
        def sig_ok(g, secret):
            parts = dict(x.split("=", 1) for x in g["h"].get("x-scf-signature", "").split(","))
            mac = hmac.new(secret.encode(), (parts.get("t", "") + ".").encode() + g["raw"], hashlib.sha256).hexdigest()
            return hmac.compare_digest(mac, parts.get("v1", "")) and abs(time.time() - int(parts.get("t", "0"))) < 300
        check("todos assinados com HMAC-SHA256 do segredo (t + corpo)", todos() and all(sig_ok(g, hook["secret"]) for g in todos()))
        check("cabeçalhos X-SCF-Event e X-SCF-Delivery batem com o corpo", all(g["h"].get("x-scf-event") == json.loads(g["raw"])["event"] and g["h"].get("x-scf-delivery") == json.loads(g["raw"])["id"] for g in todos()))
        first = next((json.loads(g["raw"]) for g in todos() if json.loads(g["raw"])["event"] == "customer.created"), {})
        check("cliente novo traz nome, telefone e código do cartão", first.get("data", {}).get("customer", {}).get("code") == card["customer"]["code"] and first["business"]["slug"] == slug, str(first)[:200])
        red = next((json.loads(g["raw"]) for g in todos() if json.loads(g["raw"])["event"] == "reward.redeemed"), {})
        check("recompensa traz o prêmio do cartão", red.get("data", {}).get("card", {}).get("reward") and red["data"]["redeemed"] == 1, str(red)[:200])
        so = [json.loads(g["raw"])["event"] for g in GOT if g["path"] == "/so-clientes"]
        check("webhook com filtro recebe só 'cliente novo'", so == ["customer.created"], str(so))

        print("Entrega e reenvio:")
        sql("select public.webhook_process()")
        st, dl = call("GET", f"{api}/rest/v1/webhook_deliveries?webhook_id=eq.{hook.get('id')}&select=event,status,response_code,attempts", None, OWN)
        check("entregas marcadas como 'ok' (HTTP 200)", dl and all(x["status"] == "ok" and x["response_code"] == 200 for x in dl), str(dl)[:200])
        MODE["status"] = 500; n0 = len(todos())
        call("POST", f"{api}/rest/v1/rpc/webhook_test", {"p_webhook": hook.get("id")}, OWN)
        wait_for(lambda: len(todos()) > n0, 15); time.sleep(0.6); sql("select public.webhook_process()")
        st, dl = call("GET", f"{api}/rest/v1/webhook_deliveries?webhook_id=eq.{hook.get('id')}&event=eq.webhook.test&order=created_at.desc&limit=1&select=id,status,response_code,attempts", None, OWN)
        check("destino com erro 500: fica para reenviar", dl and dl[0]["status"] == "retry" and dl[0]["response_code"] == 500, str(dl))
        MODE["status"] = 200; did = dl[0]["id"] if dl else ""
        sql(f"update public.webhook_deliveries set sent_at = now() - interval '5 minutes' where id = '{did}'")
        sql("select public.webhook_process()"); wait_for(lambda: len(todos()) > n0 + 1, 15); time.sleep(0.6); sql("select public.webhook_process()")
        st, dl = call("GET", f"{api}/rest/v1/webhook_deliveries?id=eq.{did}&select=status,attempts,response_code", None, OWN)
        check("reenvio depois da espera: entregue na 2ª tentativa", dl and dl[0]["status"] == "ok" and dl[0]["attempts"] == 2, str(dl))
        st, w = call("GET", f"{api}/rest/v1/webhooks?id=eq.{hook.get('id')}&select=last_status,fails,active", None, OWN)
        check("webhook mostra o último status (200) e zera as falhas", w and w[0]["last_status"] == 200 and w[0]["fails"] == 0, str(w))

        print("Permissões:")
        e2 = f"wh2-{uuid.uuid4().hex[:8]}@clientefiel.test"; call("POST", f"{api}/auth/v1/signup", {"email": e2, "password": pw}, H())
        st, d = call("POST", f"{api}/auth/v1/token?grant_type=password", {"email": e2, "password": pw}, H()); OTHER = H(d["access_token"])
        call("POST", f"{api}/rest/v1/rpc/ensure_business", {"p_name": "Outra"}, OTHER)
        st, d = call("GET", f"{api}/rest/v1/webhooks?select=id,secret", None, OTHER)
        check("outro lojista NÃO vê meus webhooks (nem o segredo)", st == 200 and d == [], f"{st} {d}")
        st, d = call("GET", f"{api}/rest/v1/webhook_deliveries?select=id", None, OTHER)
        check("outro lojista NÃO vê minhas entregas", st == 200 and d == [], f"{st} {d}")
        st, d = call("POST", f"{api}/rest/v1/rpc/webhook_test", {"p_webhook": hook.get("id")}, OTHER)
        check("outro lojista NÃO dispara meu webhook", st >= 400, f"{st} {d}")
        st, d = call("GET", f"{api}/rest/v1/webhooks?select=id", None, H())
        check("visitante NÃO vê webhooks", st >= 400 or d == [], f"{st} {d}")
        st, d = call("PATCH", f"{api}/rest/v1/webhooks?id=eq.{hook.get('id')}", {"secret": "trocado-pelo-navegador"}, P)
        check("o segredo não muda pelo navegador (só pela função de troca)", st >= 400, f"{st} {d}")
        st, s2 = call("POST", f"{api}/rest/v1/rpc/webhook_rotate_secret", {"p_webhook": hook.get("id")}, OWN)
        check("dono troca o segredo pela função", st == 200 and isinstance(s2, str) and len(s2) == 48 and s2 != hook.get("secret"), f"{st} {s2}")
    finally:
        sql(f"delete from public.webhook_dev_hosts where host = '{ip}'")
        srv.shutdown()


main()
print()
if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
print("ok — webhooks conferidos (eventos, assinatura, reenvio e permissões)")
