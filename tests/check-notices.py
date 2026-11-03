"""Botão Fechar nos avisos da tela (assets/js/notice-close.js + CF.toast).

Uso:  python tests/check-notices.py   (a partir da raiz; precisa do servidor local na 8080)
Cobre: faixas de prévia do painel (fecham e continuam fechadas ao trocar de tela), mensagem rápida (toast) com X, aviso de campanha da página do
cliente (fecha, continua fechado neste aparelho e volta quando a mensagem muda) e "Falta só 1".
"""
import asyncio, sys
from playwright.async_api import async_playwright
FAILS = []
def check(name, ok, extra=""):
    print(("  ok    " if ok else "  FALHA ") + name + ("" if ok else f"  → {extra}"))
    if not ok: FAILS.append(name)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={"width": 1300, "height": 800}); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.set_default_timeout(6000)
        print("Painel:")
        await pg.goto("http://127.0.0.1:8080/app/index.html?preview=1#/customers"); await pg.wait_for_timeout(1800)
        n = await pg.locator(".dv2-demo-note .nz-x, .v2-preview-banner .nz-x").count()
        check("faixas de prévia ganham o botão Fechar", n >= 1, str(n))
        await pg.evaluate("document.querySelectorAll('.v2-preview-banner .nz-x,.dv2-demo-note .nz-x').forEach(b=>b.click())"); await pg.wait_for_timeout(250)
        check("fechar remove as faixas", await pg.locator(".v2-preview-banner, .dv2-demo-note").count() == 0)
        await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(1200); await pg.evaluate("location.hash='#/customers'"); await pg.wait_for_timeout(1200)
        check("continuam fechadas ao trocar de tela", await pg.locator(".v2-preview-banner, .dv2-demo-note").count() == 0)
        await pg.evaluate("CF.toast('Teste de mensagem','ok',{ms:20000})"); await pg.wait_for_timeout(300)
        check("mensagem rápida tem o X", await pg.locator(".toast .toast-x").count() == 1)
        await pg.locator(".toast .toast-x").dispatch_event("click"); await pg.wait_for_timeout(200)
        check("X fecha a mensagem na hora", await pg.locator(".toast").count() == 0)
        print("Página do cliente (aviso de campanha):")
        html = lambda t: f"<div class='pub'><div class='campaign' id='cp'>{t}</div><div class='near-banner' id='nb'>Falta só 1 carimbo</div></div>"
        await pg.evaluate("h=>document.body.insertAdjacentHTML('beforeend',h)", html("Hoje: 2 carimbos em dobro")); await pg.wait_for_timeout(300)
        check("aviso de campanha ganha o botão Fechar", await pg.locator("#cp .nz-x").count() == 1)
        await pg.locator("#cp .nz-x").dispatch_event("click"); await pg.wait_for_timeout(200)
        check("fechar remove o aviso", await pg.locator("#cp").count() == 0)
        await pg.evaluate("document.querySelector('.pub').remove()")
        await pg.evaluate("h=>document.body.insertAdjacentHTML('beforeend',h)", html("Hoje: 2 carimbos em dobro")); await pg.wait_for_timeout(300)
        check("a mesma mensagem não volta neste aparelho", await pg.locator("#cp").count() == 0)
        await pg.evaluate("document.querySelector('.pub').remove()")
        await pg.evaluate("h=>document.body.insertAdjacentHTML('beforeend',h)", html("Nova oferta: sobremesa grátis")); await pg.wait_for_timeout(300)
        check("mensagem nova aparece de novo", await pg.locator("#cp .nz-x").count() == 1)
        check("'Falta só 1' também fecha", await pg.locator("#nb .nz-x").count() == 1)
        check("sem erros de JavaScript", not errs, "; ".join(errs[:2]))
        await b.close()
    print()
    if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
    print("ok — avisos com botão Fechar (prévia, mensagens e campanha)")
asyncio.run(main())
