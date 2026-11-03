"""Cartões de filiais (#/locations) — demonstração (sem servidor) e Supabase FALSO.

Uso:  python tests/check-locations.py   (a partir da raiz)
Cobre: adicionar filial pela janela; seletor "Carimbando em" em Clientes e em Carimbar, guardado neste aparelho; carimbo
registra a filial no histórico; números por filial e comparativo; página da filial (equipe, usar neste aparelho, desativar);
com o banco falso: a filial é gravada em locations e o carimbo manda p_location na RPC give_stamp.
"""
import asyncio, pathlib, re, sys
from playwright.async_api import async_playwright

APP = pathlib.Path(__file__).resolve().parent.parent / "app"
stub = pathlib.Path(__file__).with_name("fake-supabase.html").read_text(encoding="utf-8")
stub = re.search(r"<script>([\s\S]*)</script>", stub).group(1)
FAILS = []


def check(name, ok, extra=""):
    print(("  ok    " if ok else "  FALHA ") + name + ("" if ok else f"  → {extra}"))
    if not ok: FAILS.append(name)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        print("Demonstração:")
        pg = await b.new_page(viewport={"width": 1440, "height": 1000}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE=null;", content_type="text/javascript"))
        await pg.goto((APP / "index.html").as_uri() + "#/locations"); await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(1500)
        check("sem filiais: convite para adicionar a primeira e a matriz listada", "primeira filial" in await pg.inner_text("#view") and await pg.locator("#view .loc-row").count() == 1)
        await pg.click("#view [data-act=loc-add]"); await pg.wait_for_timeout(400)
        await pg.fill("#lc-n", "Shopping"); await pg.fill("#lc-a", "Av. Central, 1000 · piso 2"); await pg.click("#lc-ok"); await pg.wait_for_timeout(600)
        loc = await pg.evaluate("CF.state.locations[0]")
        check("filial criada no estado (nome, endereço, ativa)", bool(loc) and loc["name"] == "Shopping" and "Central" in loc["address"] and loc["active"] is True, str(loc))
        check("lista mostra matriz + Shopping e o seletor 'Carimbando em'", await pg.locator("#view .loc-row").count() == 2 and await pg.locator("#view [data-change='set-loc']").count() == 1)
        await pg.evaluate("location.hash='#/customers'"); await pg.wait_for_timeout(900)
        check("Clientes: seletor da filial ao lado de Dar carimbo", await pg.locator(".cv2-heading-actions [data-change='set-loc']").count() == 1)
        await pg.select_option(".cv2-heading-actions [data-change='set-loc']", loc["id"]); await pg.wait_for_timeout(300)
        check("escolha guardada neste aparelho (clientefiel.loc)", await pg.evaluate("localStorage.getItem('clientefiel.loc')") == loc["id"])
        cid = await pg.evaluate("CF.state.customers[0].id")
        await pg.evaluate(f"CF.giveStamp('{cid}', 1)"); await pg.wait_for_timeout(300)
        h = await pg.evaluate(f"(CF.state.customers.find(c=>c.id==='{cid}').history||[])[0]")
        check("carimbo guarda a filial no histórico", bool(h) and h.get("loc") == loc["id"], str(h))
        await pg.evaluate("location.hash='#/locations'"); await pg.wait_for_timeout(800)
        t = await pg.inner_text("#view")
        check("comparativo: Shopping com 1 carimbo e 1 cliente", re.search(r"Shopping\s+1\s+1\s+1\s+0", t) is not None, t[t.find("Comparativo"):][:200])
        await pg.evaluate(f"location.hash='#/locations/{loc['id']}'"); await pg.wait_for_timeout(800)
        t = await pg.inner_text("#view")
        kp = await pg.evaluate("[...document.querySelectorAll('#view .kpi b')].map(b=>b.dataset.dv2Number||b.textContent.trim())")
        check("página da filial: números (1 cliente, 1 carimbo) e 'Este aparelho carimba aqui'", "este aparelho carimba aqui" in t.lower() and kp[:2] == ["1", "1"], str(kp) + " " + t[:120])
        await pg.evaluate("location.hash='#/staff'"); await pg.wait_for_timeout(600)
        await pg.fill("#st-n", "Bia"); await pg.fill("#st-e", "bia@x.test"); await pg.select_option("#st-l", loc["id"]); await pg.click("#st-add"); await pg.wait_for_timeout(500)
        await pg.evaluate(f"location.hash='#/locations/{loc['id']}'"); await pg.wait_for_timeout(800)
        check("funcionária convidada para a filial aparece na equipe dela", "Bia" in await pg.inner_text("#view"))
        await pg.click("#view [data-lc=toggle]"); await pg.wait_for_timeout(500)
        check("desativar: filial sai da lista de ativas e some do seletor", await pg.evaluate("CF.state.locations[0].active===false && !CF.locations().length"))
        await pg.evaluate("location.hash='#/scan'"); await pg.wait_for_timeout(700)
        check("Carimbar sem filial ativa: sem seletor (nada a escolher)", await pg.locator("#view [data-change='set-loc']").count() == 0)
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await pg.close()

        print("Com o banco (falso):")
        pg = await b.new_page(viewport={"width": 1440, "height": 1000}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.route("**/supabase-js@2*/**", lambda r: r.fulfill(body=stub, content_type="text/javascript"))
        await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'https://fake.supabase.co',anonKey:'x'};window.CF_GOOGLE={placesKey:''};", content_type="text/javascript"))
        await pg.route("**/functions/v1/**", lambda r: r.fulfill(body="{}", content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}))
        await pg.goto((APP / "index.html").as_uri() + "#/locations"); await pg.wait_for_timeout(2200)
        await pg.click("#view [data-act=loc-add]"); await pg.wait_for_timeout(400)
        await pg.fill("#lc-n", "Praia"); await pg.click("#lc-ok"); await pg.wait_for_timeout(1500)
        row = await pg.evaluate("DBFAKE.locations[0] || null")
        check("filial gravada em locations (business_id, name, active)", bool(row) and row.get("name") == "Praia" and row.get("business_id") == "b1" and row.get("active") is True, str(row))
        lid = (row or {}).get("id")
        await pg.evaluate(f"CF.setLocation('{lid}')"); await pg.evaluate("location.hash='#/customers'"); await pg.wait_for_timeout(900)
        cid = await pg.evaluate("CF.state.customers[0].id")
        await pg.evaluate(f"CF.giveStamp('{cid}', 1)"); await pg.wait_for_timeout(800)
        rpc = await pg.evaluate("LOG.filter(l=>l[0]==='rpc' && l[1]==='give_stamp').pop()")
        check("carimbo manda p_location da filial escolhida na RPC give_stamp", bool(rpc) and rpc[2].get("p_location") == lid, str(rpc))
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await pg.close()
        await b.close()
    print()
    if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
    print("ok — filiais: cadastro, seletor por aparelho, carimbo com filial, números por filial e gravação no banco")

asyncio.run(main())
