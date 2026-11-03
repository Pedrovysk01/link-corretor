# Link Corretor — arquitetura e ponto de partida

Diagramação completa (fluxo, peças, modelo de dados, opções do dono): https://claude.ai/artifact/QQBs4u8BhghGJPuoWAcmBu

## Quem usa

- **Dono (construtora/imobiliária)**: cadastra empreendimentos, sobe a apresentação 3D, liga/desliga idiomas, IA, dados coletados, formulário, WhatsApp; convida corretores; vê ranking, perguntas feitas à IA e leads.
- **Corretor (celular)**: gera o link por empreendimento e canal, envia no WhatsApp/QR, vê cliques e leads, recebe aviso na hora.
- **Cliente final (sem cadastro)**: abre o link, navega no 3D, pergunta à IA, troca idioma, deixa contato.

## Caminho do link

`/r/:code` registra o clique (`public_track`, com `abuse_ok`) e redireciona para `/p/:code` (apresentação 3D com os módulos que o dono ligou). Perguntas vão pela edge function `ask-ai` (contexto = `properties.facts` + documentos), ficam em `ai_questions`. Lead vai para `leads` ligado ao link/corretor. Realtime avisa dono e corretor.

## Modelo de dados

`businesses → brokers → links → clicks | ai_questions | leads`; `businesses → properties → presentations` (`model_url`, `languages[]`, `ai_on`, `modules jsonb`).

## Decisões em aberto

| Pergunta | Opções | Sugestão |
|---|---|---|
| Origem do 3D | glTF subido pelo dono · link externo (Matterport, Unreal) · vídeo 360 | glTF no Storage, link externo como alternativa |
| Corretor tem login? | Sim, pelo celular · só o dono cria links | Sim (esquema de equipe por convite) |
| Limite da IA | Sem limite · teto por empreendimento/mês | Teto configurável pelo superadmin |
| Domínio dos links | Plataforma · domínio da construtora | Plataforma agora, próprio depois |

## O que veio na cópia (03/11/2026)

- `app/index.html`, `app/admin/`, `app/assets/` — casca do painel (shell, modo escuro, auto-ink, tabelas, i18n, acesso/login, onboarding, dashboard e lista genéricos), fontes, `vendor/` (supabase-js, qrcode, jsqr).
- `supabase/` — `config.toml`, funções `admin-api` e `forms-intake`, migrações de base: core, security, leads, webhooks, platform_admin(+ops), abuse_limits, staff_logins, locations.
- `tools/` — `dev-server.py`, `build-site.mjs`, `enviar-segredos.py`, `make-app-icons.py`, `admin_api.py`, `i18n/` (só o builder; as planilhas de tradução ficaram para trás).
- `tests/` — ícones, mobile, contraste, scrollbars, staff, login, security, tables, sync, webhooks, admin, platform, forms, notices, site, locations, `fake-supabase.html`.
- `site/` — estrutura do site de marketing (src, css/js, FAQ e páginas legais como modelo).
- `docs/` — DEPLOY, DESIGN (só como modelo), ADMIN, WEBHOOKS.

## O que ficou de fora de propósito

Cartões, carimbos, selos, temas, carteiras (wallet-pass), cobrança (billing, pagar/, stripe-setup), mockups e artes, emojis 3D, página do cliente (`app/c/`), scanner, prospecção, demo de segmentos, dados (`data/`), vídeos, mobile (Capacitor), `dist/`, `.env.local`, histórico git.

## Primeiros passos sugeridos

1. Definir a origem do 3D e a identidade visual.
2. Migração do domínio novo e limpeza das referências a cartão/carimbo em `core.js`, `data.js`, `index.html`, `screens-v2.js`, `dashboard-v2.js`, `customers-v2.js` (ainda falam de clientes/carimbos).
3. Páginas públicas `/r/:code` e `/p/:code`; função `ask-ai`.
4. Telas do dono (Empreendimentos, Apresentação, Corretores, Leads, Perguntas) e app do corretor.
5. Adaptar os testes e criar `check-links.py` e `check-ai.py`.
