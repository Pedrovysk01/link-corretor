"""Logins para a equipe (tela Funcionários) — Supabase FALSO (tests/fake-supabase.html), sem tocar na produção.

Uso:  python tests/check-staff.py   (a partir da raiz)
Cobre: o dono cria o convite (linha em staff com invite_token de 24 hex, status pending) e ganha o link ?equipe=<código>;
revogar grava status revoked; o link abre a tela de entrada já em "Criar conta" com o nome do negócio (staff_invite_info);
com a conta logada o painel chama staff_accept e my_workspace; o funcionário vê só Painel, Clientes e Carimbar, é barrado
em #/settings, não vê "Exportar lista" e nada do dono vai para o banco (só clientes).
"""
import asyncio, pathlib, re, sys
from playwright.async_api import async_playwright

APP = pathlib.Path(__file__).resolve().parent.parent / "app"
stub = pathlib.Path(__file__).with_name("fake-supabase.html").read_text(encoding="utf-8")
stub = re.search(r"<script>([\s\S]*)</script>", stub).group(1)
CFG = "window.CF_SUPABASE={url:'https://fake.supabase.co',anonKey:'x'};window.CF_GOOGLE={placesKey:''};"
FAILS = []


def check(name, ok, extra=""):
    print(("  ok    " if ok else "  FALHA ") + name + ("" if ok else f"  → {extra}"))
    if not ok: FAILS.append(name)


async def page(b, init="", no_session=False):
    pg = await b.new_page(viewport={"width": 1440, "height": 1000}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    body = stub.replace('getSession: async () => ({ data: { session: { user: { id: "u1" } } } })', 'getSession: async () => ({ data: { session: null } })') if no_session else stub
    await pg.route("**/supabase-js@2*/**", lambda r: r.fulfill(body=body, content_type="text/javascript"))
    await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body=CFG, content_type="text/javascript"))
    await pg.route("**/functions/v1/**", lambda r: r.fulfill(body="{}", content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}))
    if init: await pg.add_init_script(init)
    return pg, errs


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        print("Dono convida:")
        pg, errs = await page(b)
        await pg.goto((APP / "index.html").as_uri() + "#/staff"); await pg.wait_for_timeout(2200)
        await pg.fill("#st-n", "Ana Balcão"); await pg.fill("#st-e", "Ana@Exemplo.com"); await pg.click("#st-add"); await pg.wait_for_timeout(1500)
        row = await pg.evaluate("DBFAKE.staff[0] || null")
        check("convite grava staff com status pending e código de 24 hex", bool(row) and row.get("status") == "pending" and re.fullmatch(r"[0-9a-f]{24}", row.get("invite_token") or "") is not None and row.get("email") == "ana@exemplo.com", str(row)[:160])
        tok = (row or {}).get("invite_token") or ""
        await pg.wait_for_timeout(600); txt = await pg.inner_text("#view")
        check("lista mostra 'Convite pendente' com Copiar link, WhatsApp e E-mail", "convite pendente" in txt.lower() and "Copiar link" in txt and "WhatsApp" in txt and "E-mail" in txt, txt[:200])
        wa = await pg.get_attribute("#view a[href^='https://wa.me/']", "href")
        check("mensagem do WhatsApp leva o link ?equipe=<código>", f"?equipe={tok}" in (wa or "").replace("%3F", "?").replace("%3D", "="), (wa or "")[:160])
        await pg.click("#view [data-rm]"); await pg.wait_for_timeout(1500)
        check("revogar grava status revoked", await pg.evaluate("DBFAKE.staff[0].status") == "revoked")
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await pg.close()

        print("Funcionário abre o link:")
        pg, errs = await page(b, init="window.RPC_RESULTS={staff_invite_info:{data:{ok:true,name:'Ana Balcão',business:'Café Teste',email:'ana@exemplo.com'},error:null}};", no_session=True)
        await pg.goto((APP / "index.html").as_uri() + "?equipe=" + ("ab" * 12)); await pg.wait_for_timeout(1800)
        box = await pg.inner_text("#lg-claim")
        check("tela de entrada mostra o convite para a equipe do negócio", "Café Teste" in box and "Ana" in box, box[:160])
        check("abre em 'Criar conta', sem pedir nome de negócio, com o e-mail preenchido", await pg.evaluate("document.getElementById('lg-ok').textContent==='Criar conta' && document.getElementById('lg-nf').classList.contains('hide') && document.getElementById('lg-e').value==='ana@exemplo.com'"))
        check("código guardado até o login terminar (cf.staffinvite) e tirado da barra", await pg.evaluate("localStorage.getItem('cf.staffinvite')") == "ab" * 12 and "equipe=" not in pg.url)
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await pg.close()

        print("Funcionário logado:")
        init = ("localStorage.setItem('cf.staffinvite','" + "ab" * 12 + "');"
                "window.RPC_RESULTS={staff_accept:{data:{ok:true,business_id:'b1',business:'Café Teste',name:'Ana Balcão'},error:null},"
                "my_workspace:{data:{role:'staff',business_id:'b1',staff_id:'s1',name:'Ana Balcão',location_id:null},error:null},is_platform_admin:{data:false,error:null},my_forja:{data:null,error:null}};")
        pg, errs = await page(b, init=init)
        await pg.goto((APP / "index.html").as_uri() + "#/"); await pg.wait_for_timeout(2500)
        log = await pg.evaluate("LOG.filter(l=>l[0]==='rpc').map(l=>l[1])")
        check("chama staff_accept com o código e depois my_workspace; NÃO cria negócio (ensure_business)", "staff_accept" in log and "my_workspace" in log and "ensure_business" not in log, str(log))
        check("convite apagado depois de aceito", await pg.evaluate("localStorage.getItem('cf.staffinvite')") is None)
        nav = await pg.evaluate("[...document.querySelectorAll('.sidebar .nav-item')].map(a=>a.querySelector('span').textContent.trim())")
        check("menu só com Painel, Clientes e Carimbar", nav == ["Painel", "Clientes", "Carimbar"], str(nav))
        check("caixa da equipe no lugar do plano; nome do funcionário no topo", await pg.evaluate("!!document.querySelector('.plan-box.staff-box') && document.querySelector('#u-name').textContent.includes('Ana')"))
        um = await pg.evaluate("document.querySelector('#user-menu').innerText")
        check("menu do usuário sem Funcionários/Faturamento/Configuração inicial", "Faturamento" not in um and "Funcionários" not in um and "Configuração inicial" not in um, um[:200])
        await pg.evaluate("location.hash='#/settings'"); await pg.wait_for_timeout(600)
        check("tela do dono (#/settings) é barrada: volta ao início", await pg.evaluate("(location.hash||'#/')==='#/'"), await pg.evaluate("location.hash"))
        await pg.evaluate("location.hash='#/customers'"); await pg.wait_for_timeout(900)
        check("em Clientes: 'Dar carimbo' aparece e 'Exportar lista' não", await pg.evaluate("!!document.querySelector('#view [data-act=\"give-stamp\"]') && getComputedStyle(document.querySelector('[data-cv2-export]')).display==='none'"))
        n0 = await pg.evaluate("LOG.length")
        await pg.evaluate("CF.update(s=>{ s.biz.tagline='Mudou'; s.cards[0] && (s.cards[0].name='X'); })"); await pg.wait_for_timeout(1500)
        writes = await pg.evaluate(f"LOG.slice({n0}).filter(l=>['insert','update','delete'].includes(l[0])).map(l=>l[1])")
        check("mudanças do dono (negócio, cartão) NÃO vão para o banco no modo funcionário", not writes, str(writes))
        check("sem erros de JavaScript", not errs, "; ".join(errs[:3]))
        await pg.close()
        await b.close()
    print()
    if FAILS: print("FALHOU:", *FAILS, sep="\n  - "); sys.exit(1)
    print("ok — convites da equipe, aceite pelo link e painel do funcionário (só Painel, Clientes e Carimbar)")

asyncio.run(main())
