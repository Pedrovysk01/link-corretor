"""Superadmin da plataforma + itens de menu atribuídos (Playwright, modo demonstração/localStorage).
Cobre: grupo "Plataforma" e "Atendimento" no menu, #/admin lista negócios, #/admin/:id edita e salva o menu do cliente (aparece no
menu lateral na hora), vínculo do chatbot Forja, #/ext/:id abre a tela do item, quem não é superadmin é barrado em #/admin.

Uso (a partir da raiz):  python tests/check-admin.py
Sai com código 1 se algo falhar.
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

APP = pathlib.Path(__file__).resolve().parent.parent / "app"
CFG = "window.CF_SUPABASE={url:'',anonKey:''};window.CF_GOOGLE={placesKey:''};"
FAILS = []
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def check(name, ok, extra=""):
    print(("  ok    " if ok else "  FALHA ") + name + (f"   → {extra}" if (extra and not ok) else ""))
    if not ok: FAILS.append(name)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1440, "height": 900}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body=CFG, content_type="text/javascript"))
        await pg.goto((APP / "index.html").as_uri()); await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(800)

        print("Lojista (padrão): sem Atendimento nem Plataforma:")
        groups = await pg.evaluate("[...document.querySelectorAll('.nav-group')].map(g=>g.dataset.group)")
        check("menu do lojista não tem 'Atendimento' nem 'Plataforma'", "Atendimento" not in groups and "Plataforma" not in groups, str(groups))
        check("menu do usuário sem 'Superadmin'", not await pg.evaluate("document.querySelector('#user-menu').innerText.includes('Superadmin')"))
        for h in ("#/admin", "#/admin/forja", "#/admin/keys", "#/ext/demo-conv"):
            await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(500)
            check(f"lojista barrado em {h}", await pg.evaluate("(location.hash||'#/')==='#/'"), await pg.evaluate("location.hash"))
        await pg.evaluate("localStorage.setItem('clientefiel.demoadmin','1')"); await pg.reload(); await pg.wait_for_timeout(800)

        print("Menu lateral:")
        groups = await pg.evaluate("[...document.querySelectorAll('.nav-group')].map(g=>g.dataset.group)")
        check("grupos 'Atendimento' e 'Plataforma' aparecem para o superadmin", "Atendimento" in groups and "Plataforma" in groups, str(groups))
        check("item do cliente aponta para #/ext/<id>", await pg.evaluate("!!document.querySelector('a.nav-item[href^=\"#/ext/\"]')"))
        check("menu do usuário tem 'Superadmin da plataforma'", await pg.evaluate("document.querySelector('#user-menu').innerText.includes('Superadmin')"))

        print("Tela do item (#/ext/:id):")
        await pg.evaluate("location.hash='#/ext/demo-conv'"); await pg.wait_for_timeout(500)
        check("abre com o nome do item e botão para o painel do chatbot", await pg.evaluate("document.querySelector('h1').innerText.includes('Conversas') && !!document.querySelector('a[href*=\"/admin/conversations\"]')"))
        await pg.click("#fx-poll"); await pg.wait_for_timeout(400)
        check("'Atualizar' traz métricas de exemplo", await pg.evaluate("document.querySelector('#fx-box .stat-inline').innerText.toLowerCase().includes('conversas')"), await pg.evaluate("document.querySelector('#fx-box').innerText.slice(0,200)"))

        print("Superadmin (#/admin):")
        await pg.evaluate("location.hash='#/admin'"); await pg.wait_for_timeout(600)
        check("lista o negócio com plano, Google e chatbot", await pg.evaluate("!!document.querySelector('#adm-list table') && document.querySelector('#adm-list').innerText.includes('★')"), await pg.evaluate("document.querySelector('#adm-list').innerText.slice(0,200)"))
        await pg.click("#adm-list a.btn"); await pg.wait_for_timeout(600)
        check("detalhe mostra ficha do Google, chatbot e editor de menu", await pg.evaluate("!!document.querySelector('#nv-rows') && !!document.querySelector('#fj-form') && document.body.innerText.toLowerCase().includes('ficha do google')"))
        n0 = await pg.evaluate("document.querySelectorAll('#nv-rows .adm-nav-row').length")
        await pg.click("#nv-add"); await pg.wait_for_timeout(200)
        await pg.evaluate("(()=>{const r=[...document.querySelectorAll('#nv-rows .adm-nav-row')].pop(); const l=r.querySelector('[data-k=label]'); l.value='Leads do bot'; l.dispatchEvent(new Event('input',{bubbles:true}));})()")
        await pg.click("#nv-save"); await pg.wait_for_timeout(500)
        check("adiciona item e salva o menu", await pg.evaluate("document.querySelectorAll('#nv-rows .adm-nav-row').length") == n0 + 1 and await pg.evaluate("CF.state.ext.nav.some(n=>n.label==='Leads do bot')"))
        check("item novo já aparece no menu lateral", await pg.evaluate("[...document.querySelectorAll('a.nav-item')].some(a=>a.innerText.includes('Leads do bot'))"))
        await pg.evaluate("document.querySelector('#nv-rows .adm-nav-row:last-child [data-del]').click()"); await pg.click("#nv-save"); await pg.wait_for_timeout(400)
        check("remove o item e salva", await pg.evaluate("!CF.state.ext.nav.some(n=>n.label==='Leads do bot')"))
        await pg.click(".adm-form summary"); await pg.wait_for_timeout(150)   # o formulário fica dentro de um <details> fechado
        await pg.fill("#fj-name", "Bot teste"); await pg.fill("#fj-url", "https://bot-teste.workers.dev"); await pg.fill("#fj-token", "tok"); await pg.evaluate("document.querySelector('#fj-form').requestSubmit()"); await pg.wait_for_timeout(500)
        check("vincula o chatbot (nome/URL) e o token não aparece na tela", await pg.evaluate("CF.state.ext.forja.name==='Bot teste' && !document.body.innerText.includes('tok\\n')"))
        await pg.evaluate("location.hash='#/admin/keys'"); await pg.wait_for_timeout(500)
        check("chaves: lista de exemplo", await pg.evaluate("document.querySelector('#k-list').innerText.toLowerCase().includes('restantes')"))

        print("Trava:")
        await pg.evaluate("localStorage.removeItem('clientefiel.demoadmin'); CF.state.ext.isAdmin=false; CF.save(); location.hash='#/admin'"); await pg.wait_for_timeout(600)
        check("quem não é superadmin é mandado para o início", await pg.evaluate("(location.hash||'#/')==='#/'"), await pg.evaluate("location.hash"))
        await pg.reload(); await pg.wait_for_timeout(700)
        check("sem 'Plataforma' no menu quando não é superadmin", not await pg.evaluate("[...document.querySelectorAll('.nav-group')].some(g=>g.dataset.group==='Plataforma')"))
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await b.close()
    print()
    if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
    print("ok — superadmin e itens de menu conferidos")


asyncio.run(main())
