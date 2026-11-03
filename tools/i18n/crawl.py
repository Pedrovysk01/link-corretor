"""Abre o painel num idioma, visita todas as rotas (e alguns modais) e lista textos que continuam em português.
Uso: python crawl.py <app> <lang> [--save]   → com --save grava leftovers_<lang>.json (com dígitos trocados por {*})."""
import asyncio, pathlib, sys, json, re, os
from playwright.async_api import async_playwright
app, lang = sys.argv[1], sys.argv[2]; save = "--save" in sys.argv
here = os.path.dirname(os.path.abspath(__file__))
ROUTES = ["/", "/customers", "/page", "/page/add", "/page/catalog", "/page/share", "/app", "/cards", "/cards/new", "/campaigns", "/campaigns/new", "/reviews",
          "/birthdays", "/birthdays/edit", "/surveys", "/staff", "/locations", "/billing", "/settings", "/integrations"]
MODALS = [("/customers", "[data-open='cq']"), ("/page", "[data-act='cover-modal']"), ("/", "[data-act='user-menu']"), ("/customers", "[data-act='add-customer']"), ("/page/catalog", "[data-add='menu']"), ("/page/catalog", "[data-add='catalog']")]
JS = r"""() => { const SKIP = "script,style,textarea,code,pre,svg,[contenteditable],[data-no-i18n],.device-png,.pc,.wk,.pm-tp,.cf-wm";
  const PT = /[ãõçâêôàáéíóú]|\b(de|do|da|dos|das|você|seu|sua|seus|suas|para|com|não|cliente|clientes|carimbo|carimbos|cartão|página|uma|ao|na|no|os|as|até|mais|ou|em|este|esta|sem)\b/i;
  const out = new Set(); const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) { const p = n.parentElement; if (!p || p.closest(SKIP)) continue; if (!p.offsetParent && getComputedStyle(p).position !== 'fixed') continue;
    const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t.length > 1 && PT.test(t)) out.add(t); }
  document.querySelectorAll('[placeholder],[title],[aria-label]').forEach((el) => { if (el.closest(SKIP)) return; ['placeholder','title','aria-label'].forEach((a) => { const v = (el.getAttribute(a) || '').trim(); if (v && PT.test(v)) out.add(v); }); });
  return [...out]; }"""
async def main():
    found = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1440, "height": 1000})
        await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'',anonKey:''};window.CF_GOOGLE={placesKey:''};", content_type="text/javascript"))
        await pg.goto(pathlib.Path(app + "/index.html").as_uri()); await pg.evaluate(f"localStorage.clear(); localStorage.setItem('clientefiel.lang','{lang}')"); await pg.reload(); await pg.wait_for_timeout(1200)
        await pg.evaluate("CF.update(s=>{ s.customers.unshift({id:'cq',name:'Caio Pedido',email:'',phone:'48999990000',token:'b'.repeat(32),code:'K7P4QX',stamps:0,total:0,last:null,created:new Date().toISOString(),history:[{kind:'stamp',qty:1,at:new Date().toISOString(),by:'Automático',source:'welcome'}]}); s.requests=[{id:'r1',customerId:'cq',kind:'receipt',qty:1,created:new Date(Date.now()-5*60e3).toISOString()},{id:'r2',customerId:'cq',kind:'welcome',qty:2,created:new Date().toISOString()}]; s.welcome={mode:'approve',qty:1}; s.pageItems.push({id:'m1',type:'menu',title:'Café',items:[{name:'A',price:'1'}]},{id:'c1',type:'catalog',title:'Loja',items:[{name:'X',price:''}]}) })")
        for r in ROUTES:
            await pg.evaluate(f"location.hash='#{r}'"); await pg.wait_for_timeout(600)
            for t in await pg.evaluate(JS): found.setdefault(t, r)
        for r, sel in MODALS:
            await pg.evaluate(f"location.hash='#{r}'"); await pg.wait_for_timeout(500)
            try: await pg.evaluate(f"document.querySelector(\"{sel}\").click()"); await pg.wait_for_timeout(500)
            except Exception: continue
            for t in await pg.evaluate(JS): found.setdefault(t, r + " (modal)")
            await pg.keyboard.press("Escape"); await pg.evaluate("document.body.click()")
        await b.close()
    print(f"{lang}: {len(found)} textos ainda em PT")
    for t, r in list(found.items())[:60]: print(f"  {r:22} {t[:110]}")
    if save:
        keys = sorted({re.sub(r"\d+([.,]\d+)*", "{*}", t) for t in found})
        json.dump(keys, open(os.path.join(here, f"leftovers_{lang}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
asyncio.run(main())
