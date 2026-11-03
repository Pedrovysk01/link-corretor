# Cliente Fiel — painel do cartão fidelidade

Recriação do painel (dono do negócio) a partir das telas salvas na pasta pai.
Front-end estático em HTML/CSS/JS puro, **sem build**. Funciona em dois modos:

| Modo | Quando | Dados |
|---|---|---|
| **Demonstração** | `assets/js/supabase-config.js` sem `anonKey` | `localStorage` do navegador |
| **Servidor** | `anonKey` preenchida | Supabase (login, RLS, RPCs atômicas, tempo real) |

## Como rodar com servidor (local)

1. Docker Desktop aberto. Na raiz do projeto: `npx supabase start` (portas 573xx; aplica `supabase/migrations` e `supabase/seed.sql`).
2. Copie a `ANON_KEY` impressa para `app/assets/js/supabase-config.js`.
3. Sirva a pasta raiz: `python -m http.server 8080` e abra:
   - **Painel do dono**: `http://localhost:8080/app/` — login demo `dono@clientefiel.test` / `demo1234`
   - **Página pública do cliente** (o que o QR abre): `http://localhost:8080/app/c/?s=sua-empresa`
   - **Scanner do funcionário** (câmera lê o QR do cliente e carimba): `http://localhost:8080/app/scan.html`
   - Studio: `http://127.0.0.1:57323` · e-mails de teste: `http://127.0.0.1:57324`

Produção: `npx supabase link` + `npx supabase db push`; trocar `url`/`anonKey` em `supabase-config.js` e `publicBase` se o domínio público for outro.

## Fluxo ponta a ponta

1. Dono publica o QR (Compartilhar → PDF/PNG) apontando para `/app/c/?s=<slug>`.
2. Cliente lê o QR → cadastra nome + telefone/e-mail + consentimento → recebe um **token** (guardado no celular) e vê o cartão com um QR próprio.
3. No balcão, o funcionário abre `scan.html`, lê o QR do cliente → `give_stamp_by_token` (RPC atômica, ledger em `stamp_events`).
4. O painel recebe a atualização em tempo real (canal `stamp_events`). Com o cartão cheio, "Resgatar" chama `redeem_reward`.

## Banco (resumo)

`businesses` (dono, slug, settings jsonb) · `cards` (1 ativo por negócio) · `customers` (token único, consentimento LGPD) · `customer_cards` (progresso por cartão) · `stamp_events` (ledger: stamp/redeem/undo, quem, fonte) · `campaigns` · `page_items` · `staff`.
RPCs: públicas (`public_business`, `public_join`, `public_card`) e do dono/equipe (`ensure_business`, `give_stamp`, `give_stamp_by_token`, `redeem_reward`, `undo_last_stamp`, `replace_card`). Escrita em progresso/ledger só via RPC.

## Como abrir (modo demonstração)

- Dê duplo clique em `index.html` (funciona direto via `file://`), **ou**
- sirva a pasta: `python -m http.server 8080` e abra `http://localhost:8080/app/`.

"Restaurar dados de exemplo" fica no menu do usuário (canto superior direito).

## Telas

| Menu | Rota | O que faz |
|---|---|---|
| Painel | `#/` | Primeiros passos (checklist), página pública, métricas, cartões |
| Imagens enviadas | (todas) | Toda imagem enviada (capa, fundo, logo, foto do cartão, produto, banners, fundo do compartilhar) passa por **Ajustar imagem** (`CF.adjustImage`): opacidade, tons de cinza, HDR e presets, depois Confirmar |
| Clientes | `#/customers` | Busca, ordenação, filtros, paginação, seleção, **export CSV**, dar carimbo, resgatar, excluir |
| Gerenciar cartões | `#/cards`, `#/cards/:id` | Lista e editor com preview ao vivo (4–16 carimbos) |
| Criar novo cartão | `#/cards/new` | Modal "manter ambos / substituir" (conforme o plano) |
| Campanhas | `#/campaigns` | 8 modelos, formulário rápido, assistente de 4 passos, histórico; regras: 1 ativa por vez, 1 por dia, 4/mês. Campos de notificação/texto têm botão **Salvar** → bloco **Salvos** (até 20 por campo, em `savedTexts`) acima de **Ideias** (título em destaque, sugestões em lista) |
| Avaliações Google | `#/reviews` | Escolher ficha e ativar pedidos de avaliação |
| Aniversários | `#/birthdays`, `#/birthdays/edit` | Automação com banner, estilo de carimbos, validade, e-mail |
| Pesquisas | `#/surveys`, `#/surveys/:id` | Criar, métricas por estrelas, pausar, arquivar (arquivadas ficam listadas com Restaurar); opção **“também depois de cada carimbo”**; tabelas `surveys`/`survey_responses` (migração 20261014), o cliente responde pelo token (`public_survey_answer`) e vê “Avalie sua visita” abaixo do cartão, com “responder de novo” opcional |
| Aplicativo e telas (Menu) | `#/app` | Home do app do cliente em destaque + mockups (cartão/QR, menu, novidades, carteira, notificação) com os dados reais; abaixo, QR/lojas do app do negócio |
| Visão geral (Menu) | `#/page` | Editor da página pública com preview do celular; capa, frase, endereço; **fundo da página**: cor lisa (paleta + cor livre), degradê de 2–4 cores editáveis com direção, ou imagem enviada; no degradê, "Mostrar % de cada cor" exibe o peso dentro de cada bolinha e permite editá-lo (soma sempre 100, a sobra vai para a última cor editada) (`biz.pageBg`, `CF.pageBgCss`, `CF.gradStops`; em `settings.pageBg`, migração 20261016 expõe `page_bg` na RPC pública); **arraste os blocos** (alça ⋮⋮ ou setas ↑↓) para definir a ordem na página do cliente (`position`); cada bloco tem **Só ícone** — os blocos marcados viram uma **linha de ícones** (arrastável como um bloco; ícones arrastáveis para esquerda/direita); padrão: WhatsApp, Wi-Fi e Instagram (`icon_only`, tipos `wifi`/`social`, migração 20261015); lápis em cada bloco/ícone reabre o modal para editar |
| Criar novo catálogo (Cartões) | `#/page/catalog` | Lista todos os catálogos **e menus** da página, com criação de ambos; **Adicionar item / Editar** reabrem o modal preenchido (`CF.addPageItem(type, id)`) e salvam no mesmo bloco; catálogos de produtos (foto, descrição, preço ou “sob consulta”, botão para a loja) — o bloco **Produtos** do produto de referência |
| Adicionar à página (Cartões) | `#/page/add` | Menu, catálogo, novidades, link, contato |
| Compartilhar | `#/page/share` | Link + redes; **gerador de imagem PNG** (6 estilos × Instagram/Story/Facebook); **material impresso** (A6/A4/etiqueta → PDF via impressão) |
| Funcionários | `#/staff` | Convites para a equipe (link `?equipe=<código>`), status, filial de cada um, revogar |
| Cartões de filiais | `#/locations` `#/locations/:id` | Filiais do negócio, números por filial, equipe de cada uma, ficha do Google, "usar esta filial neste aparelho" |
| Aplicativo e telas | `#/app` | Telas do app do cliente, carimbar pelo celular, compartilhar |
| Faturamento | `#/billing` | Planos, mensal/anual, calculadora de retorno |
| Configurações | `#/settings` | Empresa, fuso, moeda, logotipo, dados legais, campos personalizados, excluir conta |

## Estrutura

```
app/
  index.html
  assets/
    css/app.css              design system (tokens, componentes, responsivo)
    fonts/montserrat-latin.woff2 fonte Montserrat (licença OFL)
    fonts/oswald-latin.woff2     fonte Oswald (licença OFL), títulos condensados do cartão Premium
    img/logo-placeholder.svg  logo genérico (o dono troca em Configurações)
    vendor/qrcode.js         qrcode-generator (MIT)
    js/
      core.js                estado, ícones, modal/gaveta/toast, roteador, shell
      components.js          cartão da carteira, celular, notificação, QR
      card-themes.js         fundos temáticos do cartão Clássico + biblioteca de ícones (Lucide, ISC)
      card-premium.js        cartão Premium: 3 layouts, 25 setores com selo próprio, personalização completa (+ seu CSS)
      emoji3d.js             mapa ícone → emoji 3D (CF.icon devolve a imagem de assets/img/emoji3d/; Fluent Emoji 3D, MIT)
      emoji-data.js          os mesmos emojis em 44 px (base64) para os padrões de fundo e a imagem de divulgação
      wallet-card.js         cartão Clássico (cabeçalho, vitrine com carimbos em emoji 3D e rodapé) + seu CSS
      splash.js              tela de carregamento: logo animado (F·I·E·L em onda) + "CARREGANDO"
      theme-photos.js        rótulos das 3 fotos por tema (assets/img/themes)
      banners.js             20 banners ilustrados (SVG) + 33 fotos realistas (assets/img/bg, créditos em docs/CREDITOS-FOTOS.md)
      font-data.js           Montserrat e Oswald em base64 (SVG da imagem de divulgação; gerado de assets/fonts)
      device-data.js         molduras reais de aparelhos (iPhone, Pixel, Galaxy) em base64, para o celular da imagem de divulgação
      logo-data.js           logo em base64 (evita canvas "tainted" via file://)
      pages/                 uma rota (ou grupo) por arquivo
```

## O que é de demonstração (para trocar ao ligar um backend)

- **Marca**: "Cliente Fiel" (a referência usava outra marca, que não foi copiada). Textos, depoimentos e logos de terceiros das telas originais **não** foram reaproveitados.
- **Domínio público** `meu.clientefiel.example` e **preços** (R$ 79 / 149 / 449): `CF.config` em `core.js`.
- **Sem servidor**: carimbos, campanhas, e-mails, convites e cobrança só alteram o `localStorage`. Nenhuma notificação/e-mail é enviado; "Ativar plano" não cobra.
- **Busca do Google** (Avaliações e Localização): lista as empresas do Google Maps enquanto o dono digita (Places API (New)) quando há chave em `CF_GOOGLE.placesKey` (`supabase-config.js`); sem chave, entrada manual. Ative a *Places API (New)*, crie uma chave de API e restrinja-a a "Referenciadores HTTP" (o endereço do painel) e só a essa API.
- **Funcionários** e **Cartões de filiais** funcionam de verdade (equipe com login próprio; carimbo por filial); em demonstração tudo fica neste navegador.
- Telas fora do material de referência, criadas só para não deixar links mortos: editor de cartão (`#/cards/:id`), "Adicionar cliente" e os formulários de conteúdo da página.

## Cartão (modelo único, personalizável) e planos

**Fundos**: cada segmento/data tem **3 fotos realistas** (Pexels, sem rostos; `assets/img/themes/<tema>-1..3.jpg`, rótulos em `theme-photos.js`) mais o padrão ilustrado; a escolha fica em `design.tp` (0–2, ou -1 = ilustrado). A vitrine aplica um véu na cor do tema para os carimbos continuarem legíveis.

**Um só modelo de cartão**, totalmente personalizável (`card-premium.js`). O formato (tamanho) é escolhido no editor (`#/cards/:id`): **Compacto** (padrão: cabeçalho + vitrine de carimbos em emoji 3D + rodapé, com fundo por segmento/data, foto ou cor), **Painel lateral**, **Foto de fundo** e **Vertical** (os três maiores, ilustrados). Internamente `card.model` é sempre `premium` e o formato fica em `card.design.tpl`.

**Planos**: todas as funções são livres em todos os planos. Só muda o limite de clientes: nos **primeiros 21 dias** da conta (teste) vale o limite do pago; depois, **Free = 30 clientes** e **plano pago (Pro) = 3.000** (100× mais). O servidor reforça o limite (`supabase/migrations/20261010000100_client_limit.sql`, gatilho em `customers`, vale também para a entrada pelo QR). A tela de Faturamento mostra a conta dos 100×. A cobrança real ainda não está ligada ("Ativar" só muda o plano).

**Premium — o que o dono personaliza** (tudo com pré-visualização ao vivo):
- **Setor e selos**: 25 setores (cafeteria, hamburgueria, cinema, esportes, barbearia…), cada um com ícone de selo, cores e textos de exemplo. O selo pode ser um ícone do setor, o logo do negócio, o número do carimbo ou uma imagem enviada (PNG com transparência). Formato (círculo, selo, quadrado), estilo (contorno ou preenchido) e emblema com louros.
- **Layout**: painel lateral, foto de fundo ou vertical, mais 6 estilos prontos.
- **Imagem**: foto do negócio com enquadramento e escurecimento. Sem foto, vira um degradê com o ícone do setor.
- **Textos**: título em duas linhas, frase de chamada (`{n}` = carimbos necessários), faixa de validade e prêmio, rodapé, contador.
- **Cores e fonte**: 3 cores livres ou 10 paletas; texto claro/escuro automático para manter a leitura; fontes Moderna, Condensada e Clássica; textura lisa, pontilhada ou papel.


**Onde aparece**: lista de cartões, painel, prévias de campanha (a faixa da campanha ocupa o lugar dos carimbos), página pública do cliente (`c/`) e a imagem de divulgação (Compartilhar → PNG). Na imagem, o cartão é o mesmo HTML/CSS embutido num SVG (`foreignObject`) com as fontes em `assets/js/font-data.js`; no Safari esse método deixa o canvas inexportável, então lá a imagem usa o desenho Clássico. Os cartazes impressos (A6/A4/etiqueta) só levam QR e texto, sem o cartão. O CSS dos layouts (`.pc*`) mora em `card-premium.js`, não em `app.css`.

**Dados**: `cards.model` (`classic` | `premium`) e `cards.design` (JSON; foto e ícone enviados vão dentro, reduzidos no navegador, limite de ~900 KB).
**Ícones**: Lucide (licença ISC) + 3 desenhados aqui (copo para viagem, rolo de filme, bola de tênis). Nenhuma arte de terceiros foi copiada.

## Banners e fotos de fundo

Banner do cartão (campanhas e aniversário): **20 banners ilustrados** (SVG desenhados no projeto) e **33 fotos realistas** (Pexels, sem rostos), em grupos (Festa, Cores, Elegantes, Natureza, Moderno; Comida e bebida, Beleza, Lojas e serviços, Ambientes e festas). **Banners de campanha e aniversário usam só fotos reais** (gerais + 3 por data comemorativa) com efeito **glass** ajustável (desfoque 0–12 px, véu claro/escuro 0–80 %), guardado em `bannerFx`; nas campanhas o efeito vai dentro da coluna `banner` como `…|fx=blur.tint.amount` (sem migração); a RPC `public_business` devolve `banner`/`style` da campanha ativa (migração `20261012000100`). Os 20 banners SVG ficam só como fallback de dados antigos. O dono também pode **enviar a própria imagem** ("Enviar minha imagem"; reduzida no navegador). No cartão **Premium**, a mesma galeria de fotos aparece em Imagem, com enquadramento e escurecimento ajustáveis. Banners e fotos prontos ficam salvos só como índice/caminho (leves); a imagem enviada vai dentro do dado. Na imagem de divulgação (PNG), a foto pronta do Premium precisa do painel servido por http(s) (por `file://` o navegador não deixa ler o arquivo e o cartão sai com o degradê).

## Ícones em emoji 3D

Os emojis 3D (Fluent Emoji 3D, Microsoft, licença MIT) aparecem só onde são ilustração: menu lateral (`CF.navIcon`, cinza quando inativo), carimbos dos cartões, padrões de fundo e logo padrão. Botões, listas, tabelas e alertas usam ícones de linha (`CF.icon`). Para trocar um ícone, edite `assets/js/emoji3d.js`. Ficam como texto, de propósito, os emojis de notificação push (`core.js`), da legenda do Instagram (`share.js`) e do exemplo de notificação (`preview.html`), porque esses textos saem do app como caractere Unicode.

## Servidor (Supabase)

- **Produção**: projeto `SeuCliente` (`dvenzoicrpjsfvvuapvh`, us-east-2). Migrações aplicadas com `npx supabase link --project-ref dvenzoicrpjsfvvuapvh` + `npx supabase db push` (o `seed.sql` NÃO vai para produção: ele cria um usuário demo com senha conhecida). `assets/js/supabase-config.js` aponta para ele; o local fica comentado ali.
- **Cadastro**: o dono cria a conta na tela de login ("Criar conta"). O Supabase exige confirmar o e-mail e, com o remetente embutido, envia no máximo 2 e-mails por hora; antes de lançar, configure um SMTP próprio (Authentication → SMTP) e ajuste **Site URL** e **Redirect URLs** (hoje `http://localhost:3000`) para o endereço real do painel.
- **Extensões**: `pgcrypto` e `unaccent` ficam no schema `extensions` (padrão do Supabase na nuvem).
