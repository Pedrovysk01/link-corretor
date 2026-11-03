"""Testa o site de marketing gerado em dist/ (node tools/build-site.mjs): SEO técnico, páginas sem erro, celular sem rolagem
lateral, demonstração do cartão, calculadora, preço mensal/anual, UTMs repassadas ao painel, aviso de cookies (LGPD +
Consent Mode) e formulário de contato até a página /obrigado/.

Uso (a partir da raiz):  python tests/check-site.py
Sai com código 1 se algo falhar.
"""
import asyncio, functools, pathlib, re, subprocess, sys, threading, shutil, os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
FAILS = []


def check(name, ok, extra=""):
    print(("  ok    " if ok else "  FALHA ") + name + (f"   → {extra}" if (extra and not ok) else ""))
    if not ok: FAILS.append(name)


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

    def send_head(self):  # imita a Vercel: /pasta/ → index.html, 404.html para o resto
        p = self.translate_path(self.path)
        if not os.path.exists(p) and not self.path.startswith("/app/"):
            self.path = "/404.html"
        return super().send_head()


async def main():
    # vercel.json inválido = a Vercel recusa o deploy inteiro (já aconteceu: "\." dentro de string JSON)
    try:
        import json; vj = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8")); vok = vj.get("buildCommand") == "node tools/build-site.mjs" and vj.get("outputDirectory") == "dist"
    except Exception as e: vok, vj = False, str(e)
    check("vercel.json é JSON válido (build do site → dist/)", vok, str(vj)[:160])
    node = shutil.which("node") or "node"
    r = subprocess.run([node, "tools/build-site.mjs", "--check"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    check("build + validação de SEO (títulos, descrições, h1, canonical, JSON-LD, links)", r.returncode == 0, (r.stdout + r.stderr)[-600:])
    if r.returncode != 0: return
    srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(DIST)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    sm = (DIST / "sitemap.xml").read_text(encoding="utf-8")
    urls = [re.sub(r"^https?://[^/]+", "", u) for u in re.findall(r"<loc>([^<]+)</loc>", sm)]
    robots = (DIST / "robots.txt").read_text(encoding="utf-8")
    check("robots.txt libera o site, bloqueia /app/ e aponta o sitemap", "Disallow: /app/" in robots and "Sitemap:" in robots and "GPTBot" in robots)
    check("sitemap com todas as páginas públicas", len(urls) >= 30, str(len(urls)))
    check("llms.txt e llms-full.txt para assistentes de IA", (DIST / "llms.txt").stat().st_size > 1000 and (DIST / "llms-full.txt").stat().st_size > 20000)
    check("favicon.ico e manifesto", (DIST / "favicon.ico").exists() and (DIST / "site.webmanifest").exists())

    async with async_playwright() as p:
        b = await p.chromium.launch()
        print("Páginas (sem erro de JavaScript, 1 H1, celular sem rolagem lateral):")
        bad = []
        for w in (1440, 390):
            pg = await b.new_page(viewport={"width": w, "height": 900}); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("response", lambda r: errs.append(f"{r.status} {r.url}") if r.status >= 400 and "favicon" not in r.url else None)
            for u in urls + ["/obrigado/"]:
                await pg.goto(base + u); await pg.wait_for_timeout(120)
                m = await pg.evaluate("({h1: document.querySelectorAll('h1').length, sw: document.documentElement.scrollWidth, vw: innerWidth})")
                if m["h1"] != 1: bad.append(f"{u}: {m['h1']} h1")
                if m["sw"] > m["vw"] + 1: bad.append(f"{u} @{w}px: rolagem lateral ({m['sw']}px)")
            if errs: bad += errs[:5]
            await pg.close()
        check(f"{len(urls) + 1} páginas em 1440 e 390 px", not bad, "; ".join(bad[:6]))

        print("Página inicial:")
        pg = await b.new_page(viewport={"width": 390, "height": 844}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(base + "/?utm_source=google&utm_campaign=teste&gclid=abc123"); await pg.wait_for_timeout(400)
        hrefs = await pg.evaluate("[...document.querySelectorAll('a[data-cta]')].map(a=>a.getAttribute('href'))")
        app = [h for h in hrefs if h.startswith("/app/")]
        check("chamadas levam ao painel com as UTMs e o gclid da campanha", app and all("utm_source=google" in h and "gclid=abc123" in h for h in app), str(app[:2]))
        lj = await pg.evaluate("[...document.querySelectorAll('script[type=\"application/ld+json\"]')].map(s=>s.textContent).join(' ')")
        check("dados estruturados: SoftwareApplication, FAQPage, Organization e WebSite", all(t in lj for t in ("SoftwareApplication", "FAQPage", "Organization", "WebSite")))
        # Detecta conteúdo cortado mesmo quando overflow-x:hidden esconde a rolagem.
        for width in (360, 390, 810, 1440):
            await pg.set_viewport_size({"width": width, "height": 844})
            clipped = await pg.evaluate("[...document.querySelectorAll('main h1, main h2, main p, main a.btn, main input')].filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1}).map(e=>e.textContent.slice(0,45))")
            check(f"home: textos e controles inteiros em {width}px", not clipped, str(clipped))
        await pg.set_viewport_size({"width": 390, "height": 844})
        # home (visual v2): demonstração do cartão, calculadora e cobrança mensal/anual (o detalhe fica em tests/check-home-v2.py)
        check("demonstração começa com 3 / 8", await pg.inner_text("[data-v2-count]") == "3 / 8", await pg.inner_text("[data-v2-count]"))
        for i in range(5): await pg.click("[data-v2-visit]")
        check("oitava visita libera a recompensa", "Recompensa liberada" in await pg.inner_text("[data-v2-feedback]"), await pg.inner_text("[data-v2-feedback]"))
        check("calculadora mostra um total em reais", (await pg.inner_text("#v2-total")).startswith("R$"), await pg.inner_text("#v2-total"))
        await pg.click("[data-v2-billing='annual']")
        check("preço anual aparece (R$ 59/mês)", "59" in await pg.inner_text("[data-v2-price]"), await pg.inner_text("[data-v2-price]"))
        await pg.evaluate("window.scrollTo(0, 1500)"); await pg.wait_for_timeout(500)
        check("chamada 'Criar meu cartão' fixa aparece ao rolar no celular", await pg.evaluate("(e=>!!e && !e.hidden)(document.querySelector('[data-v2-sticky]'))"))
        check("sem aviso de cookies quando nenhuma ferramenta está ligada", await pg.evaluate("document.getElementById('cf-consent').hidden"))
        await pg.fill("#v2-clients", "200"); await pg.dispatch_event("#v2-clients", "input"); await pg.wait_for_timeout(200)
        ev = await pg.evaluate("dataLayer.filter(e=>e && e.event).map(e=>e.event)")
        check("eventos para anúncios no dataLayer (demo, calculadora, rolagem)", all(x in ev for x in ("demo_start", "calc_use", "scroll_depth")), str(ev))
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await pg.close()

        print("Cookies (LGPD) com ferramentas ligadas:")
        ctx = await b.new_context(viewport={"width": 1280, "height": 900}); pg = await ctx.new_page(); hits = []
        await pg.route("**/assets/js/tracking-config.js*", lambda r: r.fulfill(body="window.CF_TRACK={ga4:'G-TESTE123',googleAds:'AW-1',metaPixel:'123'};", content_type="text/javascript"))
        await pg.route(re.compile(r"googletagmanager|facebook\.net|google-analytics"), lambda r: (hits.append(r.request.url), r.fulfill(body="", content_type="text/javascript"))[1])
        await pg.goto(base + "/"); await pg.wait_for_timeout(500)
        check("aviso de cookies aparece", not await pg.evaluate("document.getElementById('cf-consent').hidden"))
        check("nada de Google/Meta antes do consentimento", not hits, str(hits))
        cm = await pg.evaluate("JSON.stringify(dataLayer.find(a=>a && a[0]==='consent' && a[1]==='default'))")
        check("Consent Mode v2 começa negado", '"ad_storage":"denied"' in cm and '"analytics_storage":"denied"' in cm, cm)
        await pg.click("[data-c='no']"); await pg.wait_for_timeout(300)
        check("'Só o necessário' não carrega nada", not hits, str(hits))
        await pg.reload(); await pg.wait_for_timeout(300)
        check("escolha é lembrada (aviso não volta)", await pg.evaluate("document.getElementById('cf-consent').hidden"))
        await pg.click("[data-consent-open]"); await pg.wait_for_timeout(200); await pg.check("#cf-c-an"); await pg.click("[data-c='save']"); await pg.wait_for_timeout(500)
        check("aceitar só estatísticas carrega o Google, não o Meta", any("googletagmanager" in h for h in hits) and not any("facebook" in h for h in hits), str(hits))
        await ctx.close()

        print("Formulário de contato:")
        pg = await b.new_page(); errs = []; sent = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        async def fn(route):
            sent.append(route.request.post_data); await route.fulfill(status=200, body='{"ok":true}', content_type="application/json")
        await pg.route("**/functions/v1/forms-intake", fn)
        await pg.goto(base + "/contato/?utm_source=meta"); await pg.wait_for_timeout(300)
        await pg.fill("#f-name", "Maria Teste"); await pg.fill("#f-email", "maria@exemplo.com"); await pg.fill("#f-msg", "Quero saber mais.")
        await pg.wait_for_timeout(1600); await pg.click("button[type=submit]"); await pg.wait_for_timeout(300)
        check("sem consentimento não envia", not sent and "consentimento" in (await pg.inner_text(".form-msg")))
        await pg.check("input[name=consent]"); await pg.click("button[type=submit]")
        await pg.wait_for_url("**/obrigado/", timeout=8000)
        check("com consentimento envia pela função forms-intake e vai para /obrigado/", "/obrigado/" in pg.url and sent and '"utm_source":"meta"' in sent[0] and '"source":"site"' in sent[0], str(sent)[:200])
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await pg.close()
        # função ainda não publicada (404): cai direto no banco (submit_lead) e funciona igual
        pg = await b.new_page(); errs = []; rpc_sent = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.route("**/functions/v1/forms-intake", lambda r: r.fulfill(status=404, body='{"message":"not found"}', content_type="application/json"))
        async def rpc(route):
            rpc_sent.append(route.request.post_data); await route.fulfill(status=200, body="true", content_type="application/json")
        await pg.route("**/rest/v1/rpc/submit_lead", rpc)
        await pg.goto(base + "/contato/"); await pg.wait_for_timeout(300)
        await pg.fill("#f-name", "João Reserva"); await pg.fill("#f-email", "joao@exemplo.com"); await pg.check("input[name=consent]")
        await pg.wait_for_timeout(1600); await pg.click("button[type=submit]"); await pg.wait_for_url("**/obrigado/", timeout=8000)
        check("sem a função publicada, o contato vai direto ao banco (reserva)", rpc_sent and '"p_consent":true' in rpc_sent[0], str(rpc_sent)[:160])
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await b.close()
    srv.shutdown()


asyncio.run(main())
print()
if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
print("ok — site de marketing conferido")
