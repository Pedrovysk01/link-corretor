"""Tabelas (assets/js/table-kit.js), Playwright, modo demonstração:
painel da plataforma — ordenar A→Z / Z→A (texto e número), arrastar coluna, ajustar largura, tudo lembrado ao recarregar,
clique na linha abre o negócio (e a ficha do cliente), arrastar não ordena, celular sem estouro;
painel do lojista — clique no cliente abre os detalhes, colunas com alça de largura.

Uso (a partir da raiz):  python tests/check-tables.py      Sai com código 1 se algo falhar.
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ADMIN, APP = ROOT / "app" / "admin" / "index.html", ROOT / "app" / "index.html"
FAILS = []
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def check(name, ok, extra=""):
    print(("  ok    " if ok else "  FALHA ") + name + (f"   → {extra}" if (extra and not ok) else ""))
    if not ok: FAILS.append(name)


HEADS = "[...document.querySelectorAll('#bz-list thead th')].map(t=>t.textContent.trim())"
COL = "(n => [...document.querySelectorAll('#bz-list tbody tr')].map(r => r.cells[[...document.querySelectorAll('#bz-list thead th')].findIndex(t=>t.textContent.trim()===n)].textContent.trim()))"


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={"width": 1440, "height": 900}); errs = []
        await ctx.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'',anonKey:''};", content_type="text/javascript"))
        await ctx.route("**/cdn.jsdelivr.net/**", lambda r: r.abort())
        pg = await ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(ADMIN.as_uri() + "#/businesses"); await pg.wait_for_timeout(1000)

        print("Ordenar:")
        await pg.click("#bz-list thead th:has-text('Negócio')"); await pg.wait_for_timeout(200)
        nomes = await pg.evaluate(COL + "('Negócio')")
        check("clique no título ordena de A a Z", nomes == sorted(nomes, key=lambda s: s.lower()), str(nomes[:4]))
        await pg.click("#bz-list thead th:has-text('Negócio')"); await pg.wait_for_timeout(200)
        nomes2 = await pg.evaluate(COL + "('Negócio')")
        check("de novo: de Z a A (com a setinha no título)", nomes2 == sorted(nomes, key=lambda s: s.lower(), reverse=True) and await pg.evaluate("document.querySelector('#bz-list thead th[aria-sort=descending]') !== null"), str(nomes2[:4]))
        await pg.click("#bz-list thead th:has-text('Clientes')"); await pg.wait_for_timeout(200)
        cl = [int(x.replace(".", "") or 0) for x in await pg.evaluate(COL + "('Clientes')")]
        check("coluna de números ordena pelo valor (12 antes de 36 antes de 210)", cl == sorted(cl), str(cl))

        print("Mover coluna (arrastar o título):")
        h0 = await pg.evaluate(HEADS)
        src = await pg.locator("#bz-list thead th", has_text="Plano").bounding_box(); dst = await pg.locator("#bz-list thead th", has_text="Carimbos 30 d").bounding_box()
        await pg.mouse.move(src["x"] + 20, src["y"] + src["height"] / 2); await pg.mouse.down()
        await pg.mouse.move(src["x"] + 60, src["y"] + src["height"] / 2, steps=4); await pg.mouse.move(dst["x"] + dst["width"] - 8, dst["y"] + dst["height"] / 2, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
        h1 = await pg.evaluate(HEADS)
        check("Plano foi para depois de Carimbos 30 d", h1.index("Plano") == h1.index("Carimbos 30 d") + 1 and h0 != h1, f"{h0} → {h1}")
        cells = await pg.evaluate("(()=>{const i=[...document.querySelectorAll('#bz-list thead th')].findIndex(t=>t.textContent.trim()==='Plano'); return [...document.querySelectorAll('#bz-list tbody tr')].every(r=>/free|pro/i.test(r.cells[i].textContent))})()")
        check("as células foram junto com o título", cells)
        check("arrastar não ordenou a coluna", await pg.evaluate("!document.querySelector('#bz-list thead th[data-tk-dir]') || document.querySelector('#bz-list thead th[data-tk-dir]').textContent.trim() !== 'Plano'"))

        print("Largura (puxar a borda):")
        th = pg.locator("#bz-list thead th", has_text="Negócio"); w0 = (await th.bounding_box())["width"]
        rz = await th.locator(".tk-rz").bounding_box()
        await pg.mouse.move(rz["x"] + 4, rz["y"] + 10); await pg.mouse.down(); await pg.mouse.move(rz["x"] + 124, rz["y"] + 10, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(200)
        w1 = (await th.bounding_box())["width"]
        check("coluna ficou ~120 px mais larga", 100 < w1 - w0 < 140, f"{w0} → {w1}")
        await pg.mouse.move(rz["x"] + 124, rz["y"] + 10); await pg.mouse.down(); await pg.mouse.move(rz["x"] - 40, rz["y"] + 10, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(200)
        w2 = (await th.bounding_box())["width"]
        check("e também estreita (menor que o original)", w2 < w0, f"{w0} → {w2}")

        print("Lembrar ao recarregar:")
        await pg.reload(); await pg.wait_for_timeout(1200)
        h2 = await pg.evaluate(HEADS); w3 = (await pg.locator("#bz-list thead th", has_text="Negócio").bounding_box())["width"]
        check("ordem das colunas, largura e ordenação continuam iguais", h2 == h1 and abs(w3 - w2) < 3 and await pg.evaluate("!!document.querySelector('#bz-list thead th[data-tk-dir=asc]')"), f"{h2} {w2}→{w3}")

        print("Clique na linha:")
        await pg.locator("#bz-list tbody tr").first.locator("td").nth(2).click(); await pg.wait_for_timeout(700)
        check("clicar no estabelecimento abre o negócio direto", await pg.evaluate("/^#\\/businesses\\/b\\d/.test(location.hash) && !!document.querySelector('.tabs [data-tab]')"), await pg.evaluate("location.hash"))
        await pg.evaluate("location.hash='#/businesses/b1?tab=cust'"); await pg.wait_for_timeout(700)
        await pg.locator("#cu-list tbody tr").first.locator("td").nth(3).click(); await pg.wait_for_timeout(400)
        check("clicar no cliente abre a ficha do cliente", await pg.evaluate("!!document.querySelector('.modal') && document.querySelector('.modal').textContent.includes('Código do cartão')"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        await pg.evaluate("location.hash='#/payments'"); await pg.wait_for_timeout(900)
        await pg.locator("#pay-list tbody tr").first.locator("td").nth(4).click(); await pg.wait_for_timeout(700)
        check("clicar numa assinatura abre o negócio", await pg.evaluate("/^#\\/businesses\\//.test(location.hash)"), await pg.evaluate("location.hash"))
        await pg.evaluate("location.hash='#/payments'"); await pg.wait_for_timeout(900)
        await pg.locator("#pay-list tbody tr").first.locator("a.btn").click(); await pg.wait_for_timeout(500)
        check("botão “Abrir” da linha continua funcionando", await pg.evaluate("/^#\\/businesses\\//.test(location.hash)"))

        print("Celular:")
        await pg.set_viewport_size({"width": 390, "height": 800}); await pg.evaluate("location.hash='#/businesses'"); await pg.wait_for_timeout(800)
        check("390 px: a tabela rola dentro do quadro, a página não estoura", await pg.evaluate("document.documentElement.scrollWidth <= innerWidth"))
        check("painel da plataforma sem erros de JavaScript", not errs, "; ".join(errs[:3]))

        print("Painel do lojista (clientes):")
        pg2 = await ctx.new_page(); errs2 = []; pg2.on("pageerror", lambda e: errs2.append(str(e)))
        await pg2.goto(APP.as_uri() + "#/customers"); await pg2.wait_for_timeout(1500)
        n0 = await pg2.evaluate("document.querySelectorAll('table.t tbody tr').length")
        has = await pg2.evaluate("document.querySelectorAll('table.t thead th .tk-rz').length >= 4")
        check("colunas da lista de clientes têm a alça de largura", has)
        await pg2.locator("table.t tbody tr").first.locator("td").nth(4).click(); await pg2.wait_for_timeout(500)
        check("clicar no cliente abre os detalhes direto", await pg2.evaluate("document.querySelectorAll('table.t tbody tr').length") == n0 + 1 and await pg2.evaluate("document.querySelector('table.t tbody').textContent.includes('Código do cartão')"))
        check("painel do lojista sem erros de JavaScript", not errs2, "; ".join(errs2[:3]))
        await b.close()
    print()
    if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
    print("ok — tabelas: ordenar, mover, ajustar, lembrar e abrir pela linha")


asyncio.run(main())
