"""Confere que nada passa da borda da tela no celular (390 px e 360 px), em todas as rotas do painel.

Uso:  python tests/check-mobile.py            (a partir da raiz do projeto)
Sai com código 1 e lista cada elemento que vaza para fora da tela — rodar SEMPRE depois de mexer em layout.
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

APP = pathlib.Path(__file__).resolve().parent.parent / "app"
ROUTES = ["/", "/customers", "/page", "/page/add", "/page/catalog", "/page/share", "/app", "/cards", "/campaigns", "/reviews",
          "/birthdays", "/birthdays/edit", "/surveys", "/staff", "/locations", "/billing", "/settings", "/integrations", "/admin", "/admin/forja", "/admin/keys", "/ext/demo-conv"]
SEL = "button, a.btn, .btn, input, select, textarea, .card, .chip, .pill, .seg, .list-row, .row > *, table"
JS = """() => { const W = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll('#view ' + %r.split(', ').join(', #view '))) {
    if (el.closest('.table-wrap, .hc-track, .device-png, .chips.scroll, .sortable .icon-strip, .car-track, .sty-track')) continue; // áreas com rolagem própria
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.right > W + 1 || r.left < -1) out.push({ tag: el.tagName.toLowerCase(), cls: (el.className.baseVal ?? el.className).toString().slice(0, 40), txt: (el.innerText || el.value || '').trim().slice(0, 30), left: Math.round(r.left), right: Math.round(r.right), W });
  }
  const sw = document.documentElement.scrollWidth; if (sw > W + 1) out.push({ tag: 'page', cls: 'scrollWidth', txt: '', left: 0, right: sw, W });
  return out.slice(0, 12); }""" % SEL

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in (390, 360):
            pg = await b.new_page(viewport={"width": w, "height": 844}, is_mobile=True, has_touch=True)
            await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'',anonKey:''};window.CF_GOOGLE={placesKey:''};", content_type="text/javascript"))
            await pg.goto((APP / "index.html").as_uri()); await pg.evaluate("localStorage.clear(); localStorage.setItem('clientefiel.demoadmin','1')"); await pg.reload(); await pg.wait_for_timeout(800)
            await pg.evaluate("CF.update(s=>{ s.customers.unshift({id:'cq',name:'Caio Pedido com nome comprido',email:'caio.pedido.comprido@exemplo.com.br',phone:'48999990000',token:'b'.repeat(32),code:'K7P4QX',stamps:0,total:0,last:null,created:new Date().toISOString()}); s.requests=[{id:'r1',customerId:'cq',kind:'receipt',qty:1,created:new Date().toISOString()},{id:'r2',customerId:'cq',kind:'welcome',qty:2,created:new Date().toISOString()}]; s.pageItems.push({id:'m1',type:'menu',title:'Café',items:[{name:'A',price:'1'}]},{id:'c1',type:'catalog',title:'Loja',items:[{name:'X',price:''}]}) })")
            for r in ROUTES:
                await pg.evaluate(f"location.hash='#{r}'"); await pg.wait_for_timeout(500)
                for x in await pg.evaluate(JS): bad.append((w, r, x))
            await pg.close()
        await b.close()
    if bad:
        print("ELEMENTOS ALÉM DA BORDA NO CELULAR:")
        for w, r, x in bad: print(f"  {w}px {r:16} <{x['tag']}.{x['cls']:30}> '{x['txt']}' left={x['left']} right={x['right']} (tela {x['W']})")
        sys.exit(1)
    print("ok — nada passa da borda em 390 px e 360 px")
asyncio.run(main())
