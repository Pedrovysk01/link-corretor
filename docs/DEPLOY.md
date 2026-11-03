# Publicar (Vercel + Supabase)

## Vercel: site de vendas + painel

O `vercel.json` gera o site com `node tools/build-site.mjs`, que grava tudo em `dist/`:

| Endereço | O que é |
| --- | --- |
| `/` | site de vendas |
| `/app/` | painel |
| `/app/c/?s=<slug>` | página do cliente |
| `/app/scan.html` | leitor de QR |

1. Vercel → **Add New → Project → Import** o repositório do GitHub. Framework: *Other*. O build e a saída já vêm do
   `vercel.json`.
2. A URL e a chave **anon** do Supabase já estão em `app/assets/js/supabase-config.js`. Essa chave é pública por
   desenho: a segurança está nas regras de acesso (RLS) e nas funções do banco.
   **Nunca** coloque no Git a `service_role`, um token `sbp_…`, chaves da SerpAPI, o `.env.local`, o JSON de conta de
   serviço ou os certificados da Apple. O `.gitignore` já bloqueia os casos conhecidos.
3. Domínio próprio: Vercel → Settings → Domains.

## Supabase: banco de produção

**Jeito fácil:** dê dois cliques em **`Atualizar banco (Supabase).bat`**, na raiz. Ele faz cinco coisas:

1. pede o login do Supabase no navegador;
2. mostra as migrações que faltam e pergunta se deve aplicar (dá para pular);
3. envia para os segredos das funções as chaves que estiverem no `.env.local`: SerpAPI, Stripe, Asaas, Mercado Pago e formulários
   (`python tools/enviar-segredos.py`). Os valores não aparecem na tela;
4. publica as funções `maps-lookup` (busca do Google Maps no painel publicado), `wallet-pass` (carteiras),
   `forms-intake` (formulários do site e do Framer) e `billing` (pagamento do Pro: Stripe, Asaas, Mercado Pago e Pix manual);
5. avisa quando terminar.

> A busca do Google Maps na configuração inicial só funciona no painel publicado depois dos passos 3 e 4. No
> computador (`Iniciar painel.bat`) ela usa o servidor local e já funciona.

Pelo terminal, a partir da raiz:

```bash
npx supabase login                      # abre o navegador (uma vez por computador)
npx supabase migration list --linked    # coluna "Remote" vazia = migração ainda não aplicada na produção
npx supabase db push --linked           # aplica as pendentes, na ordem
python tools/enviar-segredos.py         # segredos das funções, lidos do .env.local (--conferir só lista os nomes)
npx supabase functions deploy maps-lookup
npx supabase functions deploy wallet-pass
npx supabase functions deploy forms-intake
npx supabase functions deploy billing
npx supabase functions deploy forja-proxy
npx supabase functions deploy admin-api
```

- Se o `db push` pedir a **senha do banco**, ela está em Supabase → Project Settings → Database. Dá para redefinir lá.
- Se o `migration list` mostrar como pendente uma migração que **já está** no banco (aplicada à mão pelo editor SQL),
  marque-a como aplicada antes do push: `npx supabase migration repair --status applied 20261015000100`.

A situação real da produção muda a cada publicação, então **não confie numa data escrita aqui**: a coluna "Remote" de
`npx supabase migration list --linked` é a verdade (vazia = ainda não aplicada). A tabela abaixo diz o que cada migração faz.

| Migração | O que faz | Na produção? |
| --- | --- | --- |
| `20261016000100` e `20261017000100` | página com fundo e blocos do Google | aplicada |
| `20261018000100_visitors` | visitantes e Wi-Fi em troca de contato | aplicada |
| `20261019000100_security` | trava do plano, cadastro sem devolver o cartão de outra pessoa, só https | aplicada |
| `20261020000100_leads` | formulário de contato do site | aplicada |
| `20261021000100_card_flow` | código curto, carimbo de boas-vindas, pedidos de carimbo, avisos em tempo real | aplicada |
| `20261022000100_onsite_menu` | cardápio só no local (Wi-Fi da loja / localização) | aplicada |
| `20261023000100_webhooks` | webhooks para outros sistemas | aplicada |
| `20261023000200_billing` | pagamento do plano Pro pela Stripe ([`docs/STRIPE.md`](STRIPE.md)) | aplicada |
| `20261024000100_platform_admin` | superadmin, itens de menu por cliente e chatbot Forja (`docs/FORJA.md`) | aplicada |
| `20261025000100_card_always_active` | nunca ficar sem cartão ativo | aplicada |
| `20261026000100_platform_admin_ops` | painel da plataforma: pagamentos, KPIs, editar negócios, modelos, auditoria (`docs/ADMIN.md`) | aplicada |
| `20261027000100_prospects_claim` | páginas de prospecção, link de ativação e acesso dos usuários no painel da plataforma | aplicada |
| `20261028000100_admin_stats_prospects` | números do painel da plataforma sem contar as páginas em preparação | aplicada |
| `20261029000100_billing_providers` | outros meios de pagamento (Asaas, Mercado Pago, Pix manual), links de pagamento e vencimento ([`docs/PAGAMENTOS.md`](PAGAMENTOS.md)) | aplicada |
| `20261030000100_prospect_accounts` | páginas de prospecção com conta própria, ativação pelo dono, trava da prévia ([`docs/ADMIN.md`](ADMIN.md)) | aplicada |
| `20261031000100_admin_logo` | logo (e capa) pelo painel da plataforma | aplicada |
| `20261101000100_admin_feature_usage` | funções em uso por negócio (colunas da tabela de Negócios) | aplicada |
| `20261102000100_admin_suggestions` | sugestões da página com o Jev (aba Sugestões), `admin_business` com itens/cartão completos, desenho do cartão no "Salvar cartão"/modelo do painel da plataforma (vitrine) ([`docs/ADMIN.md`](ADMIN.md)) | aplicada |
| `20261104000100_staff_logins` | logins para a equipe: `staff.invite_token`, `staff_invite_info`, `staff_accept`, `my_workspace` (dono × funcionário) | pendente |
| `20261105000100_locations` | filiais: tabela `locations`, `stamp_events.location_id`, `give_stamp(..., p_location)`, `location_stats`, `redeem_reward` com filial | pendente |
| `20261103000100_abuse_limits` | limites contra abuso nas funções públicas (cadastro, Wi-Fi, visitas), trava do limite do plano contra cadastros simultâneos, endereço de webhook só https:443 e sem DNS curinga | **pendente** (rode `Atualizar banco (Supabase).bat`) |

A migração `20261023000100_webhooks` liga o agendador `pg_cron`, que reenvia os avisos a cada minuto. No Supabase
hospedado ele já vem disponível. Se o `db push` reclamar, ligue em Database → Extensions → `pg_cron` e rode de novo.

Segredos das funções. O jeito fácil é pôr as linhas no `.env.local` e rodar o `.bat` (passo 3). Também dá para usar
Supabase → Edge Functions → Secrets.

| Segredo | Função | Para quê |
| --- | --- | --- |
| `SERPAPI_KEYS` | `maps-lookup` | busca no Google Maps |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_PORTAL_CONFIG`, `PUBLIC_APP_URL` | `billing` | pagamento do Pro pela Stripe: [`docs/STRIPE.md`](STRIPE.md) (`python tools/stripe-setup.py --enviar` preenche tudo) |
| `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` | `billing` | Asaas (Pix, boleto, cartão): [`docs/PAGAMENTOS.md`](PAGAMENTOS.md) |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | `billing` | Mercado Pago (Pix, cartão): [`docs/PAGAMENTOS.md`](PAGAMENTOS.md) |
| `FRAMER_WEBHOOK_SECRET` | `forms-intake` | confere a assinatura do formulário do Framer (opcional, recomendado) |
| `LEADS_WEBHOOK_URL`, `LEADS_WEBHOOK_SECRET` | `forms-intake` | repassa cada contato para o seu sistema (n8n, Make, CRM…), assinado como os webhooks do painel (opcional) |

Carteiras Google/Apple: veja [`docs/WALLET.md`](WALLET.md). Sem elas, os botões ficam escondidos.

### Formulário do Framer

Os contatos do site de vendas e do formulário do Framer vão para a tabela `leads`, pela função `forms-intake`.

1. No Framer, selecione o formulário → **Send To → Webhook**.
2. URL: `https://dvenzoicrpjsfvvuapvh.supabase.co/functions/v1/forms-intake`.
3. Em **Secret**, cole um segredo forte. O mesmo valor vai no `.env.local` como `FRAMER_WEBHOOK_SECRET`.
4. Dê aos campos nomes que a função reconhece, com ou sem acento:
   - `Nome`
   - `E-mail`
   - `WhatsApp` (ou `Telefone`)
   - `Negócio` (ou `Empresa`)
   - `Segmento`
   - `Mensagem`
   - `Consentimento` (caixa de seleção obrigatória)

Para receber cada contato também em outro sistema, preencha `LEADS_WEBHOOK_URL` (https) e `LEADS_WEBHOOK_SECRET`. A
assinatura (`X-SCF-Signature`) é conferida como em [`docs/WEBHOOKS.md`](WEBHOOKS.md).

## Antes de cada publicação

```bash
python tests/check-contrast.py
python tests/check-icons.py
python tests/check-mobile.py
python tests/check-smoke.py
python tests/check-sync.py
python tests/check-site.py
```

Com o Supabase local ligado (`npx supabase start`), rode também:

```bash
python tests/check-security.py
python tests/check-wallet.py
python tests/check-webhooks.py
python tests/check-forms.py
python tests/check-billing.py
```

`check-wallet`, `check-forms` e `check-billing` sobem as funções locais com segredos FALSOS e as desligam no fim. Para
voltar a usá-las, rode `npx supabase functions serve`.
