"""Confere contraste de texto (WCAG) no modo claro e no escuro, em todas as rotas do painel.

Uso:  python tests/check-contrast.py            (a partir da raiz do projeto)
Para cada texto visível, calcula a cor do texto contra o fundo sólido mais próximo (ignora fotos/degradês e prévias do cliente).
Cobre a página toda (menu lateral e topo incluídos), fundos translúcidos/degradês e os 4 visuais (claro, escuro, claro+v2, escuro+v2).
Falha se houver texto com contraste < 3:1 (< 4,5:1 em botões, itens do menu e no resumo do topo) — rodar SEMPRE depois de mexer em cores/tema.
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

APP = pathlib.Path(__file__).resolve().parent.parent / "app"
ROUTES = ["/", "/customers", "/page", "/page/add", "/page/catalog", "/page/share", "/app", "/cards", "/campaigns", "/reviews",
          "/birthdays", "/birthdays/edit", "/surveys", "/staff", "/locations", "/billing", "/settings", "/integrations", "/admin", "/admin/forja", "/admin/keys", "/ext/demo-conv"]
JS = r"""() => {
  const SKIP = '.device-png,.pc,.wk,.pm-tp,.hc-track,.adj-stage,.adj-dev,.banner,.ban-grid,.theme-row,.bg-grid,.idea-stage,.app-shot-stage,.cf-wm,.gdot,.qp-flag,.pv-live,[disabled],.sr-only,.wz-back,.hero-phone,.ql-crown';
  const rgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,/]\s*|\s+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, bot) => { const a = top.a + bot.a * (1 - top.a); return a ? { r: (top.r * top.a + bot.r * bot.a * (1 - top.a)) / a, g: (top.g * top.a + bot.g * bot.a * (1 - top.a)) / a, b: (top.b * top.a + bot.b * bot.a * (1 - top.a)) / a, a } : { r: 0, g: 0, b: 0, a: 0 }; };
  // fundos possíveis de um elemento: empilha as camadas (sólidas, translúcidas e cada cor de um degradê) até achar uma opaca; foto → ignora
  const bgsOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e), img = cs.backgroundImage, c = rgb(cs.backgroundColor);
      if (img && img.includes('url(')) return null;
      const stops = img && img.includes('gradient') ? [...img.matchAll(/rgba?\([^)]+\)|#[0-9a-f]{6}\b/gi)].map((m) => m[0].startsWith('#') ? { r: parseInt(m[0].slice(1, 3), 16), g: parseInt(m[0].slice(3, 5), 16), b: parseInt(m[0].slice(5, 7), 16), a: 1 } : rgb(m[0])).filter(Boolean) : null;
      if (stops && stops.length) { layers.push({ stops }); if (stops.every((x) => x.a > 0.97)) break; }
      if (c && c.a > 0) { layers.push({ c }); if (c.a > 0.97) break; }
    }
    let variants = [{ r: 255, g: 255, b: 255, a: 1 }];
    const rootBg = rgb(getComputedStyle(document.documentElement).backgroundColor), bodyBg = rgb(getComputedStyle(document.body).backgroundColor);
    if (!layers.some((l) => (l.c && l.c.a > 0.97) || (l.stops && l.stops.every((x) => x.a > 0.97)))) variants = [over(bodyBg && bodyBg.a ? bodyBg : { r: 255, g: 255, b: 255, a: 0 }, rootBg && rootBg.a ? over(rootBg, { r: 255, g: 255, b: 255, a: 1 }) : { r: 255, g: 255, b: 255, a: 1 })];
    for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; variants = l.stops ? variants.flatMap((v) => l.stops.map((st) => over(st, v))) : variants.map((v) => over(l.c, v)); }
    return variants;
  };
  const out = [], seen = new Set(); const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) { const t = n.nodeValue.trim(); if (t.length < 2) continue; const el = n.parentElement; if (!el || el.closest(SKIP)) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity < 0.5) continue;
    let fg = rgb(cs.color); const bgs = bgsOf(el); if (!fg || !bgs) continue;
    let worst = 99, wbg = null; for (const bg of bgs) { const f = fg.a < 1 ? over(fg, bg) : fg, L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); if (ratio < worst) { worst = ratio; wbg = bg; } }
    const px = parseFloat(cs.fontSize) || 16, large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    const need = window.__AA ? (large ? 3 : 4.5) : (el.closest('.btn,.nav-item,.chip-btn,.top-stats,.hero-btns') ? 4.5 : 3);   // v2: AA completo; original: botões, menu e topo 4,5:1
    if (worst < need) { const k = t.slice(0, 30); if (seen.has(k)) continue; seen.add(k); out.push({ t: k, ratio: +worst.toFixed(2), fg: cs.color, bg: `rgb(${Math.round(wbg.r)},${Math.round(wbg.g)},${Math.round(wbg.b)})`, cls: String(el.className.baseVal ?? el.className).slice(0, 30) }); } }
  return out.slice(0, 15); }"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for mode in ("light", "dark", "light+v2", "dark+v2", "v2-light", "v2-dark"):   # "+v2" = tema roxo Aura; "v2-*" = o visual novo amarelo (v2.html), com AA completo (4,5:1; 3:1 em texto grande)
            pg = await b.new_page(viewport={"width": 1440, "height": 1000})
            await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'',anonKey:''};window.CF_GOOGLE={placesKey:''};", content_type="text/javascript"))
            new = mode.startswith("v2-")
            await pg.goto(("http://127.0.0.1:8080/app/v2.html?preview=1" if new else (APP / "index.html").as_uri())); await pg.evaluate("localStorage.clear(); localStorage.setItem('clientefiel.demoadmin','1')" + ("; localStorage.setItem('clientefiel.mode','dark')" if mode.endswith("dark") or mode.startswith("dark") else "") + ("; localStorage.setItem('clientefiel.theme','v2')" if mode.endswith("v2") else "")); await pg.reload(); await pg.wait_for_timeout(900)
            await pg.evaluate("CF.update(s=>{ s.pageItems.push({id:'m1',type:'menu',title:'Café',items:[{name:'A',price:'1'}]},{id:'n1',type:'news',title:'Novidade',body:'x',iconOnly:true}); s.customers.unshift({id:'cq',name:'Caio Pedido',email:'',phone:'48999990000',token:'b'.repeat(32),code:'K7P4QX',stamps:0,total:0,last:null,created:new Date().toISOString()}); s.requests=[{id:'r1',customerId:'cq',kind:'receipt',qty:1,created:new Date().toISOString()},{id:'r2',customerId:'cq',kind:'welcome',qty:1,created:new Date().toISOString()}]; s.welcome={mode:'approve',qty:1} })")
            for r in ROUTES:
                await pg.evaluate(f"location.hash='#{r}'"); await pg.wait_for_timeout(450)
                await pg.evaluate("window.__AA=%s; window.CF_AUTOINK && CF_AUTOINK.now()" % ("true" if new else "false"))   # mede o texto já com a tinta automática aplicada
                for x in await pg.evaluate(JS): bad.append((mode, r, x))
            await pg.close()
        await b.close()
    if bad:
        print("TEXTO COM CONTRASTE BAIXO (< 3:1):")
        for m, r, x in bad: print(f"  {m:5} {r:16} {x['ratio']:5}  '{x['t']}'  texto {x['fg']} sobre {x['bg']}  .{x['cls']}")
        sys.exit(1)
    print("ok — contraste de texto ≥ 3:1 (claro, escuro e Visual v2), incluindo menu lateral e barra do topo")
asyncio.run(main())
