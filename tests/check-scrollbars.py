"""Nenhuma barra de rolagem visível dentro de caixas, listas, tabelas e celulares (só a da própria página), nas duas versões e nos dois modos.

Uso:  python tests/check-scrollbars.py     (a partir da raiz, com o servidor local em http://127.0.0.1:8080 — Iniciar painel.bat)
O Chromium do Playwright esconde as barras por padrão; aqui elas são ligadas (--hide-scrollbars desligado) para medir como no Windows.
A regra que esconde fica no fim de app/assets/css/app.css (e em app/admin/admin.css): a rolagem continua por roda, toque e teclado.
"""
import asyncio, sys
from playwright.async_api import async_playwright

ROUTES = ["/", "/customers", "/page", "/page/add", "/page/catalog", "/app", "/cards", "/cards/c1", "/campaigns", "/reviews", "/birthdays", "/birthdays/edit", "/surveys", "/staff",
          "/locations", "/billing", "/settings", "/integrations", "/admin", "/admin/forja", "/admin/keys", "/ext/demo-conv", "/scan"]
URLS = {"original": "http://127.0.0.1:8080/app/index.html", "v2": "http://127.0.0.1:8080/app/v2.html?preview=1&admin=1"}
JS = """() => { const out = [];
  for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (!/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const v = e.offsetWidth - e.clientWidth - (parseFloat(cs.borderLeftWidth) || 0) - (parseFloat(cs.borderRightWidth) || 0), h = e.offsetHeight - e.clientHeight - (parseFloat(cs.borderTopWidth) || 0) - (parseFloat(cs.borderBottomWidth) || 0);
    if (v > 2 || h > 2) out.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).trim().split(/\\s+/).slice(0, 2).join('.')); }
  return out; }"""


async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(ignore_default_args=["--hide-scrollbars"])
        for which, url in URLS.items():
            for mode in ("claro", "escuro"):
                for w in (1440, 390):
                    pg = await b.new_page(viewport={"width": w, "height": 900})
                    await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE=null;", content_type="text/javascript"))
                    await pg.goto(url); await pg.evaluate("localStorage.clear(); localStorage.setItem('clientefiel.demoadmin','1')" + ("; localStorage.setItem('clientefiel.mode','dark')" if mode == "escuro" else "")); await pg.reload(); await pg.wait_for_timeout(1000)
                    for r in ROUTES:
                        await pg.evaluate(f"location.hash='#{r}'"); await pg.wait_for_timeout(450)
                        for x in await pg.evaluate(JS): bad.append((which, mode, w, r, x))
                    await pg.close()
        await b.close()
    if bad:
        print("BARRAS DE ROLAGEM VISÍVEIS:")
        for x in bad[:40]: print("  ", *x)
        sys.exit(1)
    print("ok — nenhuma barra de rolagem visível dentro das telas (original e v2, claro e escuro, 1440 e 390 px)")

asyncio.run(main())
