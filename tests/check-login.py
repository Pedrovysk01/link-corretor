"""Tela de entrada do painel com um Supabase FALSO (só auth): "Criar meu cartão" do site abre em Criar conta (?criar=1),
termos e condições do teste no cadastro, aviso verde de conta criada, "Esqueci minha senha" e a tela de senha nova.
Uso: python tests/check-login.py   (opcional: pasta para salvar capturas como 1º argumento)"""
import asyncio, sys, pathlib, os
from playwright.async_api import async_playwright
app = pathlib.Path(__file__).resolve().parent.parent / "app"
ENTRY = os.environ.get("CF_LOGIN_ENTRY", "index.html")
out = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
STUB = """
window.CALLS = [];
const SESSION = window.__FAKE_SESSION ? { user: { id: 'u1', email: 'a@b.c' } } : null;
window.supabase = { createClient: () => ({
  auth: {
    getSession: async () => ({ data: { session: SESSION } }),
    onAuthStateChange: (cb) => { window.__AUTHCB = cb; return { data: { subscription: { unsubscribe() {} } } }; },
    signUp: async (a) => { CALLS.push(['signUp', a.email]); return { data: { session: null }, error: null }; },
    signInWithPassword: async (a) => { CALLS.push(['signIn', a.email]); return { data: {}, error: { message: 'Invalid login credentials' } }; },
    resetPasswordForEmail: async (e, o) => { CALLS.push(['reset', e, o && o.redirectTo]); return { error: null }; },
    updateUser: async (a) => { CALLS.push(['updateUser', a.password.length]); return { error: null }; },
  },
  rpc: async () => ({ data: null, error: null }),
  from: () => { const q = { select: () => q, eq: () => q, order: () => q, limit: async () => ({ data: [], error: null }), then: (r) => r({ data: [], error: null }) }; return q; },
  channel: () => ({ on() { return this; }, subscribe() { return this; } }),
}) };
"""
results = []
def check(name, cond, extra=""):
    results.append(cond); print(("  ok    " if cond else "  FALHA ") + name + ("" if cond else "   -> " + str(extra)))

async def page(b, query="", hashpart="", session=False, w=420):
    pg = await b.new_page(viewport={"width": w, "height": 860}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.add_init_script(f"window.__FAKE_SESSION = {'true' if session else 'false'};")
    await pg.route("**/supabase-js@2*/**", lambda r: r.fulfill(body=STUB, content_type="text/javascript"))
    await pg.route("**/supabase-config.js*", lambda r: r.fulfill(body="window.CF_SUPABASE={url:'https://fake.supabase.co',anonKey:'x'};window.CF_GOOGLE={placesKey:''};", content_type="text/javascript"))
    await pg.goto((app / ENTRY).as_uri() + query + hashpart); await pg.wait_for_timeout(1200)
    return pg, errs

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # A — veio de "Criar meu cartão grátis"
        pg, errs = await page(b, "?criar=1")
        check("?criar=1 abre em 'Criar conta'", (await pg.inner_text("#lg-ok")).strip() == "Criar conta", await pg.inner_text("#lg-ok"))
        check("termos e condições do teste aparecem no cadastro", await pg.is_visible("#lg-terms") and "sem cartão de crédito" in await pg.inner_text("#lg-terms"))
        check("links para Termos e Privacidade", await pg.locator("#lg-terms a[href='/termos/']").count() == 1 and await pg.locator("#lg-terms a[href='/privacidade/']").count() == 1)
        check("'Esqueci minha senha' some no cadastro", not await pg.is_visible("#lg-fg"))
        check("?criar=1 sai da barra de endereço", "criar=1" not in pg.url, pg.url)
        out and await pg.screenshot(path=str(out / "login-criar.png"))
        await pg.fill("#lg-e", "novo@negocio.com"); await pg.fill("#lg-p", "segredo123"); await pg.fill("#lg-n", "Café X"); await pg.click("#lg-ok"); await pg.wait_for_timeout(500)
        check("conta criada: aviso VERDE (alert ok), não vermelho", await pg.locator(".alert.ok").count() == 1 and await pg.locator(".alert.err").count() == 0)
        check("depois de criar, volta para 'Entrar' com o e-mail preenchido", (await pg.inner_text("#lg-ok")).strip() == "Entrar" and await pg.input_value("#lg-e") == "novo@negocio.com")
        out and await pg.screenshot(path=str(out / "login-conta-criada.png"))
        check("sem erros de JavaScript (cadastro)", not errs, errs); await pg.close()
        # B — "Entrar" normal + esqueci a senha
        pg, errs = await page(b)
        check("sem ?criar abre em 'Entrar'", (await pg.inner_text("#lg-ok")).strip() == "Entrar")
        check("'Esqueci minha senha' visível no login, termos escondidos", await pg.is_visible("#lg-fg") and not await pg.is_visible("#lg-terms"))
        await pg.click("#lg-fg"); await pg.wait_for_timeout(300)
        check("esqueci sem e-mail: pede o e-mail, não chama o servidor", await pg.locator(".alert.err").count() == 1 and not await pg.evaluate("CALLS.some(c => c[0]==='reset')"))
        await pg.fill("#lg-e", "dono@cafe.com"); await pg.click("#lg-fg"); await pg.wait_for_timeout(400)
        calls = await pg.evaluate("CALLS")
        check("esqueci com e-mail: chama resetPasswordForEmail com retorno para o painel", any(c[0] == "reset" and c[1] == "dono@cafe.com" and str(c[2]).endswith("/" + ENTRY) for c in calls), calls)
        check("aviso verde neutro (não revela se o e-mail tem conta)", await pg.locator(".alert.ok").count() == 1 and "Se houver uma conta" in await pg.inner_text(".alert.ok"))
        out and await pg.screenshot(path=str(out / "login-esqueci.png"))
        await pg.fill("#lg-p", "errada1"); await pg.click("#lg-ok"); await pg.wait_for_timeout(400)
        check("senha errada continua em vermelho e no modo Entrar", await pg.locator(".alert.err").count() == 1 and (await pg.inner_text("#lg-ok")).strip() == "Entrar")
        check("sem erros de JavaScript (login)", not errs, errs); await pg.close()
        # C — voltou do link de senha nova
        pg, errs = await page(b, "", "#access_token=abc&type=recovery", session=True)
        check("link de recuperação abre a tela de senha nova", await pg.locator("#np-p").count() == 1)
        check("token sai da barra de endereço", "access_token" not in pg.url, pg.url)
        out and await pg.screenshot(path=str(out / "login-senha-nova.png"))
        await pg.fill("#np-p", "novasenha9"); await pg.click("#np-ok"); await pg.wait_for_timeout(800)
        check("salvar chama updateUser", await pg.evaluate("CALLS.some(c => c[0]==='updateUser')"))
        check("sem erros de JavaScript (senha nova)", not [e for e in errs if "updateUser" in e], errs); await pg.close()
        await b.close()
    print("ok — tela de entrada conferida" if all(results) else "FALHOU"); sys.exit(0 if all(results) else 1)
asyncio.run(main())
