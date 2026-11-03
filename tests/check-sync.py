"""Confere a gravação no banco (Supabase FALSO, sem tocar na produção): carrega pesquisas, cria a 2ª, pausa e arquiva.
Uso: python tests/check-sync.py   — falha se algo não for gravado como esperado (pegou o bug das pesquisas que sumiam)."""
import asyncio, sys, pathlib, re
from playwright.async_api import async_playwright
app = str(pathlib.Path(__file__).resolve().parent.parent / "app")
stub = pathlib.Path(__file__).with_name("fake-supabase.html").read_text(encoding="utf-8")
stub = re.search(r"<script>([\s\S]*)</script>", stub).group(1)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1440, "height": 1000}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append("CON " + m.text[:140]) if m.type == "error" else None)
        await pg.route("**/supabase-js@2*/**", lambda r: r.fulfill(body=stub, content_type="text/javascript"))
        await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'https://fake.supabase.co',anonKey:'x'};window.CF_GOOGLE={placesKey:''};", content_type="text/javascript"))
        await pg.route("**/functions/v1/wallet-pass*", lambda r: r.fulfill(body='{"google":false,"apple":false}', content_type="application/json"))
        await pg.route("**/functions/v1/billing/*", lambda r: r.fulfill(body='{"enabled":false,"yearly":true}', content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}))
        await pg.goto(pathlib.Path(app + "/index.html").as_uri() + "#/surveys"); await pg.wait_for_timeout(2500)
        tela = await pg.evaluate("JSON.stringify(LOG)") + " | banco: " + await pg.evaluate("JSON.stringify(DBFAKE.surveys.map(s=>s.title))")
        print("carregou do banco:", await pg.evaluate("CF.state.surveys.map(s=>s.title)"), "| bizId:", await pg.evaluate("CF.bizId"), "| tela:", tela, "| erros:", errs[:3])
        # cria a 2ª pesquisa como a tela faz (id local) e espera a sincronização
        await pg.evaluate("CF.update(s=>s.surveys.push({id:CF.uid(),title:'Segunda',status:'active',questions:[],responses:[],created:new Date().toISOString()}))"); await pg.wait_for_timeout(1200)
        await pg.evaluate("CF.update(s=>{ s.surveys[0].status='paused' })"); await pg.wait_for_timeout(1200)
        await pg.evaluate("CF.update(s=>{ const x=s.surveys[1]; x.status='archived'; x.archivedAt=new Date().toISOString() })"); await pg.wait_for_timeout(1200)
        print("gravações:", await pg.evaluate("LOG"))
        print("no banco agora:", await pg.evaluate("DBFAKE.surveys.map(s=>s.title+':'+s.status)"))
        banco = await pg.evaluate("DBFAKE.surveys.map(s=>s.title+':'+s.status)")
        # fluxo do cartão: pedidos abertos e código curto carregam; regras (boas-vindas/comprovante) vão para settings
        req = await pg.evaluate("({n:(CF.state.requests||[]).length, kind:(CF.state.requests[0]||{}).kind, code:(CF.state.customers.find(c=>c.name==='Bia Pedido')||{}).code})")
        await pg.evaluate("CF.update(s=>{ s.welcome={mode:'approve',qty:2}; s.receipts={on:true,phone:'(48) 98888-7777'} })"); await pg.wait_for_timeout(1200)
        st = await pg.evaluate("DBFAKE.businesses[0].settings")
        await b.close()
        fluxo = req == {"n": 1, "kind": "welcome", "code": "K7P4QX"} and st.get("welcome") == {"mode": "approve", "qty": 2} and st.get("receipts", {}).get("phone") == "(48) 98888-7777"
        print("pedidos/código:", req, "| settings gravado:", {k: st.get(k) for k in ("welcome", "receipts")})
        if banco != ["Primeira:paused", "Segunda:archived"] or not fluxo or [e for e in errs if "favicon" not in e]: print("FALHOU", banco, req, errs[:3]); sys.exit(1)
        print("ok — pesquisas carregam do banco, são criadas, pausadas e arquivadas; pedidos de carimbo e regras do cartão sincronizam")
asyncio.run(main())
