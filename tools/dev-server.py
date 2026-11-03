"""Servidor local: site de marketing (http://localhost:8080/, gerado em dist/ por `node tools/build-site.mjs`),
painel (http://localhost:8080/app/, direto da pasta app/) e /api/maps (Google Maps via SerpAPI).

Uso (na raiz do projeto):  python tools/dev-server.py            (porta 8080)
                            python tools/dev-server.py 8090       (outra porta)
- As chaves da SerpAPI vêm de .env.local (nunca vão para o navegador).
- Envia "no-cache": o navegador sempre pega o CSS/JS mais novo.
- SEGURANÇA: escuta só em 127.0.0.1 (este computador, nada de rede/Wi-Fi), serve somente app/ (em /app/) e dist/ (o resto);
  o caminho REAL do arquivo (links simbólicos e ".." resolvidos) precisa ficar dentro de uma dessas pastas — e recusa
  Host que não seja localhost (proteção contra DNS rebinding).
- /api/maps?action=search&q=...&lat=..&lng=..   → lista de estabelecimentos
- /api/maps?action=ficha&place_id=...&data_id=..  → ficha completa (dados, horários, fotos, depoimentos)
- /api/maps?action=link&url=<link do Google Maps>  → ficha completa a partir do link colado
- /api/admin?action=…  (GET/POST) → superadmin local: negócios, ficha do Google, menu dos clientes, bots Forja, saldo SerpAPI.
  Só existe com CF_ADMIN_LOCAL=1 em .env.local (tem a service_role do Supabase). Detalhes: tools/admin_api.py e docs/FORJA.md
"""
import json, os, sys, pathlib, urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import maps_serp, admin_api

ROOT = maps_serp.ROOT
APP_DIR = os.path.realpath(ROOT / "app")
DIST_DIR = os.path.realpath(ROOT / "dist")
SERP = maps_serp.Serp(maps_serp.load_keys())
HOST = "127.0.0.1"


def inside(real, base):
    """True se o caminho real (já sem links simbólicos) está dentro de base."""
    try: return os.path.commonpath([os.path.normcase(real), os.path.normcase(base)]) == os.path.normcase(base)
    except ValueError: return False  # outro drive no Windows


def is_app(url_path): return url_path == "/app" or url_path.startswith("/app/")


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(ROOT), **k)

    def _host_ok(self):
        h = (self.headers.get("Host") or "").rsplit(":", 1)[0].strip("[]").lower()
        return h in ("localhost", "127.0.0.1", "::1")

    def translate_path(self, path):
        # /app/... vem da pasta app/ (ao vivo); o resto vem do site gerado em dist/
        self.directory = str(ROOT) if is_app(urllib.parse.urlparse(path).path) else DIST_DIR
        return super().translate_path(path)

    def send_head(self):
        # só entrega arquivo cujo caminho REAL fique dentro de app/ ou dist/ (bloqueia .., links simbólicos, %5c, drive etc.)
        if "\x00" in self.path: return self._deny()
        app = is_app(urllib.parse.urlparse(self.path).path)
        real = os.path.realpath(self.translate_path(self.path))
        if not inside(real, APP_DIR if app else DIST_DIR): return self._deny()
        if os.path.isdir(real) and not os.path.isfile(os.path.join(real, "index.html")): return self._deny()  # sem listar pastas
        return super().send_head()

    def _deny(self):
        page404 = os.path.join(DIST_DIR, "404.html")
        if not is_app(urllib.parse.urlparse(self.path).path) and os.path.isfile(page404):
            b = open(page404, "rb").read()
            self.send_response(404); self.send_header("Content-Type", "text/html; charset=utf-8"); self.send_header("Content-Length", str(len(b))); self.end_headers()
            if self.command != "HEAD": self.wfile.write(b)
            return None
        self.send_error(404, "Não encontrado"); return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def _json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code); self.send_header("Content-Type", "application/json; charset=utf-8"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        if not self._host_ok(): return self._json(403, {"error": "host não permitido"})
        u = urllib.parse.urlparse(self.path)
        if u.path in ("", "/") and not os.path.isfile(os.path.join(DIST_DIR, "index.html")):
            self.send_response(302); self.send_header("Location", "/app/"); self.end_headers(); return  # site ainda não gerado
        # só app/ e dist/ são servidas (checagem do caminho real em send_head); o resto é 404
        if u.path == "/api/admin": return self._admin(u, None)
        if u.path != "/api/maps": return super().do_GET()
        q = {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}
        try:
            a = q.get("action")
            if a == "search":
                if len(q.get("q", "").strip()) < 2: return self._json(400, {"error": "Digite o nome do estabelecimento."})
                return self._json(200, {"resultados": maps_serp.search(SERP, q["q"].strip(), q.get("lat"), q.get("lng"))})
            if a == "ficha":
                if not (q.get("place_id") or q.get("data_id")): return self._json(400, {"error": "Falta place_id ou data_id."})
                return self._json(200, {"ficha": maps_serp.ficha(SERP, q.get("place_id"), q.get("data_id"))})
            if a == "link":
                if not q.get("url"): return self._json(400, {"error": "Cole o link do Google Maps."})
                return self._json(200, {"ficha": maps_serp.from_link(SERP, q["url"])})
            if a == "status": return self._json(200, {"ok": True, "chaves": len(SERP.keys)})
            return self._json(400, {"error": "Ação inválida."})
        except Exception as e:
            return self._json(502, {"error": str(e)})

    def do_POST(self):
        if not self._host_ok(): return self._json(403, {"error": "host não permitido"})
        u = urllib.parse.urlparse(self.path)
        if u.path != "/api/admin": return self._json(404, {"error": "Não encontrado"})
        # anti-CSRF: um site aberto no mesmo navegador não pode mandar comandos ao superadmin local.
        # (1) só JSON de verdade: <form> de outro site não consegue enviar application/json sem a verificação prévia (CORS) do navegador;
        # (2) a origem, quando o navegador informa, tem que ser este mesmo servidor.
        if not (self.headers.get("Content-Type") or "").lower().startswith("application/json"): return self._json(415, {"error": "Use application/json."})
        origin = self.headers.get("Origin")
        if origin and urllib.parse.urlparse(origin).netloc.lower() != (self.headers.get("Host") or "").lower(): return self._json(403, {"error": "origem não permitida"})
        if (self.headers.get("Sec-Fetch-Site") or "same-origin") not in ("same-origin", "none"): return self._json(403, {"error": "origem não permitida"})
        n = int(self.headers.get("Content-Length") or 0)
        try: body = json.loads(self.rfile.read(n).decode("utf-8") or "{}") if n else {}
        except Exception: return self._json(400, {"error": "JSON inválido"})
        return self._admin(u, body)

    def _admin(self, u, body):
        # superadmin LOCAL: desligado por padrão (CF_ADMIN_LOCAL=1 liga). Já passou por _host_ok e o servidor só escuta em 127.0.0.1.
        if not admin_api.enabled(): return self._json(404, {"error": "Não encontrado"})
        q = {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}
        action = (body or {}).get("action") or q.get("action")
        code, obj = admin_api.handle(action, q, body)
        return self._json(code, obj)

    def log_message(self, fmt, *args):
        if args and ("/api/maps" in str(args[0]) or "/api/admin" in str(args[0])): super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"Site em http://localhost:{port}/  ·  Painel em http://localhost:{port}/app/ (só neste computador)  ·  Google Maps: {len(SERP.keys)} chaves SerpAPI carregadas"
          + (f"  ·  Superadmin local LIGADO: http://localhost:{port}/app/#/admin" if admin_api.enabled() else "  ·  Superadmin local desligado (CF_ADMIN_LOCAL=1 em .env.local liga)"))
    ThreadingHTTPServer((HOST, port), H).serve_forever()
