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

## Regras do Pedro (pedidos que ele já repetiu — siga sem ele pedir de novo)

Atualizado em 12/11/2026. Se uma regra daqui conflitar com um documento antigo, vale esta.

### Entrega
- Mudou algo? **Reinicie o servidor e entregue a URL pronta para abrir.** Antes de reiniciar, mate todos os `link-server.py` (dois processos podem ficar na mesma porta e o antigo responde). Avise para dar Ctrl+F5 e troque o `?v=` dos arquivos.
- **Publique no GitHub ao terminar** cada pedido (commit só dos seus arquivos; nunca dos arquivos de outra sessão).
- Teste em cópia do banco (`LC_DB=<temporário>` em outra porta), nunca no banco real. Confira computador e celular (390 px) antes de dizer que está pronto.
- Não diga "feito" para o que não foi aberto e visto. Se algo não abriu, diga.

### Padronização
- **O que vale para um empreendimento vale para todos.** Pedido feito numa apresentação é aplicado nas demais na mesma entrega.
- Cabeçalho, menu, rodapé e Materiais são os mesmos em todas as apresentações, **mesmo quando o recurso ainda não existe** naquele empreendimento (não esconder: ligar a algo equivalente ou marcar "em breve").
- Caixas das apresentações: **vidro forte** (fundo translúcido ~50 %, desfoque 26–30 px), mesmas cores em todos os projetos, texto com contraste ≥ 4,5:1.
- Mapas Mapbox: esconder `a.mapboxgl-ctrl-logo`; créditos ficam no botão "i".
- Nome de cidade, bairro, endereço e metragem: conferir no catálogo/book do empreendimento antes de escrever. Não deduzir.

### Painel
- **Tema claro é o padrão.**
- **Topo, barra lateral e moldura têm sempre a mesma cor, sem linha nem sombra entre eles** (um elemento só), em qualquer modo e com o tema da logo.
- Busca global centralizada no topo.
- Cartões (corretores, empreendimentos e listas parecidas): **fileiras de 4** sempre que couber; 3, 2 e 1 em telas menores.
- Imagens de cartão são **1:1**: capa do empreendimento e foto do corretor (recorte no centro).
- Contato do corretor: botão só com a logo do WhatsApp, usando o número que o próprio corretor informou.
- Avisos de cliente novo: **no máximo 9 na tela**; acima disso, sino com contador vermelho "+9".
- Detalhe do cliente: só o último acesso + "Carregar mais"; selo do corretor (ou dos corretores) que atende.
- Caixas de marcar: uma por linha. Grupos longos de opções (ex.: idiomas): 3 colunas. Bandeiras como imagem, nunca emoji.
- Campos de texto que a construtora preenche têm limite de letras e contador.

### Apresentação e cliente
- Botões **Corretor · Cliente · Construtora** logo abaixo de "Visão 3D".
- Cadastro do cliente: **primeiro só o nome**; depois WhatsApp ou e-mail. Abre na 3ª interação (**3 cliques** no computador, 3 toques no celular) ou após **30 segundos**.
- Todo ambiente com render no catálogo mostra o render na sua caixa; mais de um render do mesmo ambiente = carrossel.
- Demonstração: com dados de exemplo, as notificações de cadastro ficam sempre ativas (painel aberto ou apresentação em uso).

### Conversa
- Respostas curtas, em português simples (frases curtas, uma ideia por frase). Comparações em tabela "antes × depois".
- Diga **como ver** o resultado (caminho de cliques + URL), não só o que mudou.
- Pedido ambíguo: pergunte com opções fechadas e uma recomendada, antes de construir.
