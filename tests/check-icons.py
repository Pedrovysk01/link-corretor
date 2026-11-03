"""Confere que todo ícone fica centralizado dentro da sua caixa redonda, em todas as rotas do painel.

Uso:  python tests/check-icons.py            (a partir da raiz do projeto)
Sai com código 1 e lista cada caixa fora do centro (> 1px) — rodar SEMPRE depois de mexer em CSS/ícones.
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

APP = pathlib.Path(__file__).resolve().parent.parent / "app"
ROUTES = ["/", "/customers", "/page", "/page/add", "/page/catalog", "/page/share", "/app", "/cards", "/campaigns", "/reviews",
          "/birthdays", "/birthdays/edit", "/surveys", "/staff", "/locations", "/billing", "/settings", "/integrations", "/admin", "/admin/forja", "/admin/keys", "/ext/demo-conv"]
# caixas que devem ter o desenho (svg/img) exatamente no centro
BOXES = ".ico-tile, .bullets .ico, .avatar, .step .ring, .stepper .s .ring, .pm-ico, .cat-ph, .bg-thumb, .quick-link .ico-tile, .icon-btn, .chip.swatch.custom"
JS = """(sel) => [...document.querySelectorAll(sel)].map(t => {
  const s = t.querySelector('svg, img, b, span'); if (!s) return null;
  const r = t.getBoundingClientRect(), q = s.getBoundingClientRect(); if (!r.width || !q.width) return null;
  const dx = (q.left + q.width / 2) - (r.left + r.width / 2), dy = (q.top + q.height / 2) - (r.top + r.height / 2);
  return { cls: t.className.toString().slice(0, 40), dx: +dx.toFixed(1), dy: +dy.toFixed(1), pad: getComputedStyle(t).padding };
}).filter(x => x && (Math.abs(x.dx) > 1 || Math.abs(x.dy) > 1))"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1440, "height": 1000})
        await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'',anonKey:''};window.CF_GOOGLE={placesKey:''};", content_type="text/javascript"))
        await pg.goto((APP / "index.html").as_uri()); await pg.evaluate("localStorage.clear(); localStorage.setItem('clientefiel.demoadmin','1')"); await pg.reload(); await pg.wait_for_timeout(800)
        # dados para as telas terem conteúdo (prêmio pendente, linha de ícones, etc.)
        await pg.evaluate("CF.update(s=>{ s.customers.unshift({id:'cq',name:'Caio Pedido com nome comprido',email:'caio.pedido.comprido@exemplo.com.br',phone:'48999990000',token:'b'.repeat(32),code:'K7P4QX',stamps:0,total:0,last:null,created:new Date().toISOString()}); s.requests=[{id:'r1',customerId:'cq',kind:'receipt',qty:1,created:new Date().toISOString()},{id:'r2',customerId:'cq',kind:'welcome',qty:2,created:new Date().toISOString()}]; s.customers.unshift({id:'cx',name:'Ana',email:'',phone:'',stamps:CF.card().stamps,total:8,last:new Date().toISOString(),created:new Date().toISOString()}); Object.keys(s.onboarding).forEach(k=>s.onboarding[k]=true) })")
        for r in ROUTES:
            await pg.evaluate(f"location.hash='#{r}'"); await pg.wait_for_timeout(600)
            for x in await pg.evaluate(JS, BOXES): bad.append((r, x))
        await b.close()
    if bad:
        print("ÍCONES FORA DO CENTRO:")
        for r, x in bad: print(f"  {r:16} .{x['cls']:40} dx={x['dx']:5} dy={x['dy']:5} padding={x['pad']}")
        sys.exit(1)
    print(f"ok — ícones centralizados em {len(ROUTES)} rotas")
asyncio.run(main())
