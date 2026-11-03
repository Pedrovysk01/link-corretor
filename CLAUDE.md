# Link Corretor — instruções do projeto

Links rastreados por corretor para apresentações 3D de empreendimentos, com IA que responde ao cliente. Quem monitora é a construtora/imobiliária. Base copiada do projeto **Cliente Fiel** (`../Cliente Fiel - Cartão Fidelidade`) em 03/11/2026 — só a infraestrutura; o domínio (cartão, carimbo, carteira, cobrança) ficou de fora.

Arquitetura e decisões: `docs/ARQUITETURA.md`. Diagramação: https://claude.ai/artifact/QQBs4u8BhghGJPuoWAcmBu

## Vocabulário (substitui o do Cliente Fiel)

| Cliente Fiel | Aqui |
|---|---|
| negócio / dono | construtora ou imobiliária / dono |
| funcionário (`staff`) | corretor (`brokers`) |
| cliente / cartão | visitante / link |
| filial (`locations`) | empreendimento (`properties`) |
| carimbo (`stamp_events`) | clique (`clicks`) |

Nunca mostre "v2" nem "Cliente Fiel" ao usuário. Português do Brasil, tratamento "você".

## Sem cobrança

Não há Stripe, Asaas, Mercado Pago, plano Pro nem tela Faturamento neste projeto. Não copie `billing` de volta. Limites (ex.: perguntas à IA por mês) são configurados pelo superadmin.

## Servidor local

`Iniciar painel.bat` ou `python tools/dev-server.py` (porta 8080). Segredos só em `.env.local` (modelo em `.env.example`); vão para o Supabase com `python tools/enviar-segredos.py`.

## Banco (Supabase)

As migrações copiadas (`supabase/migrations/`) trazem contas, superadmin, equipe por convite, locais, leads, webhooks e trava anti-abuso — ainda com os nomes antigos (`staff`, `locations`, `stamp_*`). O primeiro trabalho é escrever a migração do domínio novo (`brokers`, `properties`, `presentations`, `links`, `clicks`, `ai_questions`, `leads`) e remover o que sobrou de cartão/carimbo. Funções públicas (`public_track`, lead) devem passar por `abuse_ok`.

## Regras herdadas que continuam valendo

- Ícones no centro das caixas redondas: `python tests/check-icons.py` depois de mexer em CSS ou tela nova. Nunca criar seletor de classe solto com nome genérico (`.brand`, `.ico`, `.mini`).
- Nada passa da borda em 390/360 px (`check-mobile.py`); contraste ≥ 4,5:1 nos dois modos (`check-contrast.py`); sem barra de rolagem dentro de caixas (`check-scrollbars.py`).
- Modo escuro neutro (`#0e0e10` / `#18181b`); `auto-ink.js` corrige a tinta, mas o CSS deve nascer legível.
- Barra lateral e topo: `app/assets/css/shell.css` (carregado por último).
- Tabelas: `table.t` + `assets/js/table-kit.js`.
- Frase nova na interface: traduzir em `tools/i18n/` e rodar `build.py`.
- Testes Playwright simulam o Supabase com `route("**/supabase-config.js*")` (com `*` no fim).
- Depois de mudar CSS/JS, troque o `?v=` nos `<script>`/`<link>`.
- Verificação gráfica antes de entregar: sobreposições em celular e computador.

## Identidade visual

Ainda não definida. `docs/DESIGN.md` é o do Cliente Fiel e serve só de modelo de estrutura — **não herdar o laranja/amarelo nem o logo**. Criar paleta e logo próprios antes de desenhar telas.
