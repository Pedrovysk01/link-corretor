"""Envia para os segredos do Supabase de PRODUÇÃO as variáveis das funções que estiverem no .env.local, sem mostrar os
valores na tela e sem gravá-los em lugar nenhum do projeto (usa um arquivo temporário, apagado logo depois).

  SERPAPI_KEYS ............................ busca do Google Maps (função maps-lookup) — docs/FICHA-GOOGLE.md
  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY,
  STRIPE_PORTAL_CONFIG (opcional),
  PUBLIC_APP_URL .......................... pagamento do plano Pro pela Stripe (função billing) — docs/STRIPE.md
  ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN ...... Asaas: Pix, boleto e cartão (função billing) — docs/PAGAMENTOS.md
  MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET ...... Mercado Pago: Pix e cartão (função billing) — docs/PAGAMENTOS.md
  LEADS_WEBHOOK_URL, LEADS_WEBHOOK_SECRET,
  FRAMER_WEBHOOK_SECRET ................... formulários do site e do Framer (função forms-intake) — docs/DEPLOY.md

Variável ausente ou vazia é pulada: o valor que já está no Supabase continua valendo.

Uso (a partir da raiz, depois de `npx supabase login`):  python tools/enviar-segredos.py
Só conferir o que seria enviado (nomes, sem valores e sem enviar):  python tools/enviar-segredos.py --conferir
O `Atualizar banco (Supabase).bat` já chama este script.
"""
import os, pathlib, re, shutil, subprocess, sys, tempfile

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
NAMES = ["SERPAPI_KEYS", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_MONTHLY", "STRIPE_PRICE_YEARLY", "STRIPE_PORTAL_CONFIG", "PUBLIC_APP_URL",
         "ASAAS_API_KEY", "ASAAS_WEBHOOK_TOKEN", "ASAAS_API_BASE", "MP_ACCESS_TOKEN", "MP_WEBHOOK_SECRET",
         "LEADS_WEBHOOK_URL", "LEADS_WEBHOOK_SECRET", "FRAMER_WEBHOOK_SECRET"]
# formato esperado de cada uma (para pegar troca de linha/colagem errada antes de enviar)
FORMAT = {"STRIPE_SECRET_KEY": r"^(sk|rk)_(live|test)_[A-Za-z0-9]+$", "STRIPE_WEBHOOK_SECRET": r"^whsec_[A-Za-z0-9+/=]+$",
          "STRIPE_PRICE_MONTHLY": r"^price_[A-Za-z0-9]+$", "STRIPE_PRICE_YEARLY": r"^price_[A-Za-z0-9]+$", "STRIPE_PORTAL_CONFIG": r"^bpc_[A-Za-z0-9]+$",
          "PUBLIC_APP_URL": r"^https://[^\s]+/$", "LEADS_WEBHOOK_URL": r"^https://[^\s]+$",
          "ASAAS_API_KEY": r"^\$aact_[A-Za-z0-9_:$=+/.-]+$", "ASAAS_WEBHOOK_TOKEN": r"^[A-Za-z0-9_-]{16,255}$", "ASAAS_API_BASE": r"^https://[^\s]+/v3$",
          "MP_ACCESS_TOKEN": r"^(APP_USR|TEST)-[A-Za-z0-9-]+$", "MP_WEBHOOK_SECRET": r"^[A-Za-z0-9]{16,128}$"}

env = ROOT / ".env.local"
if not env.exists():
    sys.exit("Não achei o .env.local na raiz (é onde ficam as chaves).")
vals = {}
for line in env.read_text(encoding="utf-8").splitlines():
    s = line.strip()
    if not s or s.startswith("#") or "=" not in s: continue
    k, v = s.split("=", 1); k = k.strip(); v = v.strip().strip('"').strip("'")
    if k in NAMES and v: vals[k] = v

bad = [k for k, rx in FORMAT.items() if k in vals and not re.match(rx, vals[k])]
if bad:
    sys.exit("Formato inesperado no .env.local (nada foi enviado): " + ", ".join(bad) + ". Confira em docs/PAGAMENTOS.md e docs/DEPLOY.md.")
if not vals:
    sys.exit("O .env.local não tem nenhuma das variáveis das funções (" + ", ".join(NAMES) + ").")

notes = []
if "SERPAPI_KEYS" in vals: notes.append(f"SERPAPI_KEYS ({len([x for x in vals['SERPAPI_KEYS'].split(',') if x.strip()])} chaves)")
stripe = [k for k in NAMES if k.startswith("STRIPE_") and k in vals]
if stripe:
    mode = "TESTE" if "_test_" in vals.get("STRIPE_SECRET_KEY", "") else "produção" if "STRIPE_SECRET_KEY" in vals else "?"
    notes.append(f"Stripe em modo de {mode}: " + ", ".join(stripe))
    falta = [k for k in ("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_MONTHLY") if k not in vals]
    if falta: print("Atenção: faltam " + ", ".join(falta) + " (se ainda não estiverem no Supabase, o pagamento pela Stripe fica desligado).")
for pv, ks in (("Asaas", ("ASAAS_API_KEY", "ASAAS_WEBHOOK_TOKEN")), ("Mercado Pago", ("MP_ACCESS_TOKEN",))):
    tem = [k for k in ks if k in vals]
    if tem and len(tem) < len(ks): print(f"Atenção: o {pv} precisa de " + " e ".join(ks) + " (falta " + ", ".join(k for k in ks if k not in vals) + ").")
if "ASAAS_API_KEY" in vals: notes.append("Asaas em modo de " + ("SANDBOX (teste)" if "_hmlg_" in vals["ASAAS_API_KEY"] else "produção"))
if "MP_ACCESS_TOKEN" in vals: notes.append("Mercado Pago em modo de " + ("TESTE" if vals["MP_ACCESS_TOKEN"].startswith("TEST-") else "produção"))
notes += [k for k in vals if k not in stripe and k != "SERPAPI_KEYS"]
if "--conferir" in sys.argv:   # só mostra o que seria enviado (nomes, nunca os valores)
    print("Seria enviado (valores não exibidos):\n  - " + "\n  - ".join(notes)); sys.exit(0)

fd, tmp = tempfile.mkstemp(suffix=".env")
try:
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        # entre aspas simples: o leitor de .env do Supabase trocaria "$algo" por uma variável (a chave do Asaas começa com $)
        f.write("".join((f"{k}='{v}'\n" if "'" not in v else f'{k}="{v}"\n') for k, v in vals.items()))
    npx = shutil.which("npx") or "npx"
    r = subprocess.run([npx, "-y", "supabase", "secrets", "set", "--env-file", tmp], cwd=ROOT, shell=(os.name == "nt"))
finally:
    try: os.remove(tmp)
    except OSError: pass
if r.returncode != 0:
    sys.exit("Não foi possível enviar os segredos (veja a mensagem acima).")
print("ok — enviados para os segredos do Supabase (valores não exibidos):\n  - " + "\n  - ".join(notes))
