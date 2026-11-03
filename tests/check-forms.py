"""Formulários (site de vendas e Framer) → função forms-intake no Supabase LOCAL: guarda o contato (tabela leads), confere a
assinatura do Framer, repassa assinado para o seu sistema (receptor falso aqui) e barra robô/consentimento/e-mail inválido.

Uso (a partir da raiz, com `npx supabase start` ligado):  python tests/check-forms.py
Sobe `npx supabase functions serve` com variáveis de teste e derruba no fim. Sai com código 1 se algo falhar.
"""
import hashlib, hmac, json, shutil, sys, threading, time, urllib.request, urllib.error, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from _fnserve import supa_env, host_ip, start_serve, kill_tree, stop_serves

FAILS = []
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def check(name, ok, extra=""):
    print(("  ok   " if ok else "  FALHA ") + name + (f"  → {extra}" if (extra and not ok) else ""))
    if not ok: FAILS.append(name)


def post(url, raw: bytes, headers=None):
    req = urllib.request.Request(url, data=raw, method="POST", headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return r.status, json.loads(r.read() or b"{}"), dict(r.headers)
    except urllib.error.HTTPError as e:
        b = e.read()
        try: return e.code, json.loads(b), dict(e.headers)
        except Exception: return e.code, b, dict(e.headers)


GOT = []
class Rx(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get("Content-Length") or 0)); GOT.append({"h": {k.lower(): v for k, v in self.headers.items()}, "raw": raw})
        self.send_response(200); self.end_headers()


def main():
    k = supa_env(); api = k["API_URL"].rstrip("/"); svc = k["SERVICE_ROLE_KEY"]; SRV = {"apikey": svc, "Authorization": "Bearer " + svc}
    rx = ThreadingHTTPServer(("127.0.0.1", 0), Rx); threading.Thread(target=rx.serve_forever, daemon=True).start()
    ip = host_ip(); FR, LS = "segredo-framer-teste", "segredo-leads-teste"
    fn = f"{api}/functions/v1/forms-intake"
    print("Subindo a função com variáveis de teste…")
    proc, log, tmp = start_serve({"FRAMER_WEBHOOK_SECRET": FR, "LEADS_WEBHOOK_URL": f"http://{ip}:{rx.server_address[1]}/leads", "LEADS_WEBHOOK_SECRET": LS}, fn)
    def lead(email):
        req = urllib.request.Request(f"{api}/rest/v1/leads?email=eq.{email}&select=name,phone,business,message,source", headers=SRV)
        with urllib.request.urlopen(req, timeout=20) as r: return json.loads(r.read())
    try:
        print("Site:")
        em = f"site-{uuid.uuid4().hex[:6]}@exemplo.com"
        st, d, h = post(fn, json.dumps({"source": "site", "name": "Maria Site", "email": em, "phone": "48999990000", "message": "Quero saber mais", "consent": True, "website": "", "utm_source": "google", "page": "/contato/"}).encode(), {"Origin": "https://seu-cliente-fiel.vercel.app"})
        rows = lead(em)
        check("contato do site é guardado (com a origem e a UTM)", st == 200 and d.get("ok") and rows and rows[0]["source"].get("origin") == "site" and rows[0]["source"].get("utm_source") == "google", f"{st} {d} {rows}")
        check("libera o site em outro domínio (CORS)", {x.lower(): y for x, y in h.items()}.get("access-control-allow-origin") == "*", str(h)[:160])
        time.sleep(1.2)
        g = next((x for x in GOT if json.loads(x["raw"]).get("lead", {}).get("email") == em), None)
        ok_sig = False
        if g:
            parts = dict(p.split("=", 1) for p in g["h"].get("x-scf-signature", "").split(","))
            ok_sig = hmac.compare_digest(hmac.new(LS.encode(), (parts.get("t", "") + ".").encode() + g["raw"], hashlib.sha256).hexdigest(), parts.get("v1", ""))
        check("repassa para o seu sistema, assinado (X-SCF-Signature)", bool(g) and ok_sig and json.loads(g["raw"])["event"] == "lead.site", str(GOT[-1:])[:200])

        print("Framer:")
        em2 = f"framer-{uuid.uuid4().hex[:6]}@exemplo.com"
        raw = json.dumps({"Nome": "Ana Framer", "E-mail": em2, "WhatsApp": "(48) 98888-7777", "Negócio": "Padaria da Ana", "Segmento": "Padaria", "Mensagem": "Oi!", "Consentimento": "on"}, ensure_ascii=False).encode()
        sub = str(uuid.uuid4())
        sig = "sha256=" + hmac.new(FR.encode(), raw + sub.encode(), hashlib.sha256).hexdigest()
        st, d, _ = post(fn, raw, {"Framer-Signature": "sha256=" + "0" * 64, "Framer-Webhook-Submission-Id": sub})
        check("assinatura do Framer errada: recusa (401)", st == 401, f"{st} {d}")
        st, d, _ = post(fn, raw, {"Framer-Signature": sig, "Framer-Webhook-Submission-Id": sub})
        rows = lead(em2)
        check("formulário do Framer (campos em português) é guardado", st == 200 and rows and rows[0]["name"] == "Ana Framer" and rows[0]["business"] == "Padaria da Ana" and rows[0]["source"].get("origin") == "framer", f"{st} {d} {rows}")

        print("Proteções:")
        st, d, _ = post(fn, json.dumps({"name": "Sem Consentimento", "email": f"nc-{uuid.uuid4().hex[:5]}@exemplo.com"}).encode())
        check("sem consentimento: recusa", st == 400 and "consentimento" in str(d).lower(), f"{st} {d}")
        st, d, _ = post(fn, json.dumps({"name": "Mail Ruim", "email": "nao-e-email", "consent": True}).encode())
        check("e-mail inválido: recusa", st == 400, f"{st} {d}")
        em3 = f"robo-{uuid.uuid4().hex[:6]}@exemplo.com"; n0 = len(GOT)
        st, d, _ = post(fn, json.dumps({"name": "Robô", "email": em3, "consent": True, "website": "http://spam"}).encode())
        time.sleep(1)
        check("isca anti-robô: responde ok, não guarda e não repassa", st == 200 and lead(em3) == [] and len(GOT) == n0, f"{st} {lead(em3)} {len(GOT) - n0}")
        st, d, _ = post(fn, b"isto nao e json")
        check("corpo inválido: recusa (400)", st == 400, f"{st} {d}")
    finally:
        if FAILS: print("\n--- log da função ---\n" + "\n".join(l for l in log[-20:] if l.strip()))
        kill_tree(proc); stop_serves(); rx.shutdown(); shutil.rmtree(tmp, ignore_errors=True)


main()
print()
if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
print("ok — formulários conferidos (site, Framer, repasse assinado e proteções)")
