# Painel da plataforma (superadmin) — `app/admin/`

Painel **à parte** do painel do lojista, para operar a plataforma: pagamentos e planos, todos os negócios, edição dos dados de cada cliente, criação/importação de estabelecimentos e exportação de dados. Chatbots (Forja) e chaves estão descritos em [`FORJA.md`](FORJA.md).

Endereço: `…/app/admin/` (local: `http://localhost:8080/app/admin/`). Entra quem está em `platform_admins`; o painel do lojista mostra o atalho **Plataforma → Painel da plataforma** para essas contas.

## Telas

| Tela | O que faz |
| --- | --- |
| Visão geral | KPIs: receita mensal recorrente (MRR, preços de `CF.config.prices`), negócios, ativos em 30 d, assinaturas Pro, em teste, atrasadas, clientes, carimbos; lista do que precisa de atenção |
| Pagamentos | **Formas de pagamento** (meio padrão do lojista: Stripe, Asaas, Mercado Pago ou Pix manual; chave Pix; preços; carência; webhooks) · negócio × assinatura (`billing_accounts`): plano, situação, meio, periodicidade, valor/mês, próxima cobrança ou validade, cancelamento; filtro; CSV · **Links de pagamento** (gerar para qualquer negócio, copiar/WhatsApp, confirmar o Pix manual, cancelar). Detalhes: [`docs/PAGAMENTOS.md`](PAGAMENTOS.md) |
| Negócios | Lista com uso, Google e chatbot; **detalhe com abas**: Geral e plano (trocar plano/teste, meio de pagamento atual, gerar link de pagamento, cancelar renovação, dados, regras de boas-vindas/comprovante) · Cartão (criar/editar/excluir; nunca fica sem ativo) · Página e itens (blocos, ordem, “só ícone”, conteúdo JSON) · Clientes (lista + CSV) · Menu do painel (itens extras do menu do lojista) · Chatbot (Forja) · Exportar/modelo |
| Negócios › **Funções em uso** | Caixas de seleção acima da tabela: cada função do “Aplicativo e telas” do lojista (capa, logotipo, fundo, cartão, linha de ícones, menus, catálogos, novidades, WhatsApp, Wi-Fi, links, mapa, campanha, aniversários, pesquisa, Avaliações Google, QR impresso, sem marca d’água) vira uma coluna com ✓/—, mais o total “Em uso” (x/18). Fica lembrado neste navegador. Dados: `admin_feature_usage` (notificações não entram: ficam no navegador do lojista) |
| Negócio › **Menu do painel** | Itens extras no menu lateral DESTE lojista (ex.: telas do chatbot Forja): grupo, nome, ícone (escolhido pelo desenho), tipo (tela do chatbot, link externo, tela do painel), o que abre, ativo e ordem |
| Criar / importar | **Por e-mail** (conta do dono + convite + negócio pronto), **Planilha CSV** (`nome;email;plano;teste`, até 50, com conferência antes), **Modelo JSON** (aplicar o modelo de um negócio em outro) |
| Exportar | `negocios.csv/json`, `assinaturas.csv`, `clientes-<slug>.csv`, `modelo-<slug>.json`, `modelos.json` |
| Auditoria | `admin_audit`: quem trocou plano, editou, importou, criou |
| Prospecção | Páginas criadas para estabelecimentos que ainda não são clientes (situação, validade do link, clientes) · **Novo link** de ativação com mensagem de WhatsApp · **Preparar a partir da base do Prospector** (só servidor local: filtra `data/prospeccao.json` e cria as páginas escolhidas) |
| Negócio › **Acesso** | Dono da conta (e-mail, criação, último acesso, e-mail confirmado) e equipe · **Definir nova senha** (sugere uma forte) · **Link de redefinição** e **link de acesso direto** (uso único, para mandar por WhatsApp) · **E-mail de redefinição** (precisa do SMTP) · em página em preparação: link de ativação |
| Negócio › **Sugestões** | O que colocar na página, decidido com os dados coletados + o Jev (ver abaixo): prêmio do cartão (hoje × sugerido), blocos novos (prévia das linhas lidas do site), notas internas (ex.: “já tem programa de pontos próprio”, horário do site × Google). Cada uma com a certeza do Jev (ou “regra”) e o porquê. **Aprovar e aplicar** grava no cartão/página; **Descartar**; “Já decididas” com **Reabrir**. O número na aba = sugestões em aberto |

## Sugestões da página com o Jev (migração 20261102)

O Jev (TypeSafe "System One", pelo crédito do OpenRouter) **não busca dados nem escreve texto**: ele escolhe entre opções e
diz quanta certeza tem. `tools/ficha_jev.py` junta isso com os dados já coletados:

```bash
python tools/ficha_jev.py bancada                                                   # mede o Jev contra a revisão manual
python tools/ficha_jev.py negocio "big itália" --site data/bigitalia/site.txt       # mostra as sugestões
python tools/ficha_jev.py negocio "big itália" --site data/bigitalia/site.txt --gravar   # grava na produção (aba Sugestões)
```

- **Uma chamada por negócio** com várias perguntas: prêmio do cartão (opções montadas com os preços reais do site); para
  cada bloco candidato, três perguntas — é útil? muda logo? concorre com o cartão? (entra se útil ≥ 60%, muda < 50% e
  concorre < 50%); já tem programa de fidelidade próprio?; é rede com várias unidades? Custo da Big Itália: ~3,4 mil
  tokens ≈ US$ 0,00014.
- **Regras** sem modelo: horário do site × Google (aviso se diferem mais de 5 min).
- **Nada é inventado**: os blocos só levam linhas lidas do site. O leitor atual entende o site do Expresso Delivery
  (cardápio, área de entrega, fidelidade); outro sistema de pedidos precisa de outro leitor.
- **Bancada** (10/2026, 153 estabelecimentos de Itapema contra a revisão à mão): tipo (cafeteria/pizzaria/outro) 96% certo,
  99% quando o Jev tem ≥ 85% de certeza (12 ficam para revisar). "É rede nacional?" é fraco (achou 2 de 4) — para isso
  a lista de redes continua valendo; o Jev serve de segunda opinião.
- `admin_suggestions` só é lida pelo superadmin (RLS sem políticas; RPCs `admin_suggestions`, `admin_suggest`,
  `admin_suggestion_decide` com `is_platform_admin`). Rodar de novo não duplica (`dedupe`) e não reabre o que já foi decidido.
- A mesma migração faz `admin_business` devolver os **itens da página**, o **cartão completo** e as **configurações**: antes a
  aba "Página e itens" vinha vazia na produção e "Salvar itens" apagaria a página (o painel agora se recusa a salvar
  quando o banco não manda os itens).
- Chave: `JEV_API_KEY` (+ `JEV_BASE_URL=https://openrouter.ai/api`) no `.env.local`; sem ela, usa a do Forja
  (`../ROBIT/forja/.dev.vars`). Nunca vai para o navegador.

## Vitrine da página (`tools/vitrine.py`)

A melhor apresentação de uma página em preparação com o que já foi coletado — nada inventado:

```bash
python tools/vitrine.py "big itália"                    # gera data/<slug>_vitrine.json + imagens em data/<slug>_vitrine/
python tools/vitrine.py "big itália" --gravar           # aplica na produção (capa, fundo, cartão com desenho, blocos novos)
```

- **Cores da marca** tiradas do logo (média dos pixels do tom mais comum: destaque saturado + escuro).
- **Arte do cartão** (1200×760, JPEG embutido ~80 KB): foto do setor (`assets/img/themes`, Pexels, sem rostos), escura em cima
  para o texto, a comida embaixo, brilho na cor da marca e a "fumacinha" subindo. Modelo **Foto de fundo** do
  `card-premium.js`: selo com o logo, "FIDELIDADE" + nome curto, "Complete o cartão e ganhe …" (sem número: o cartão conta o
  prêmio como a última casa), prêmio e bairro, Instagram no rodapé.
- **Capa** (1200×420, outra parte da foto, de perto) e **fundo da página** em degradê claro com um toque da cor da marca (o
  título da página é escuro; fundo escuro não serve).
- **Itens**: os de hoje + os blocos recomendados pelo Jev (`data/<slug>_sugestoes.json`), antes de "Como chegar"/"Horário";
  blocos com mais de 15 linhas ficam de fora (o link do cardápio cobre). O prêmio recomendado entra no cartão.
- Sem `--gravar`, o JSON é um **modelo** do painel: Criar / importar › Modelo JSON › arraste o arquivo, escolha o negócio
  e marque **substituir** (troca cartão e itens). Com `--gravar`, aplica direto e marca as sugestões usadas como aprovadas.
- Precisa da migração `20261102000100`: antes dela, "Salvar cartão" e "Importar modelo" do painel da plataforma perdiam o
  desenho do cartão (`cards.design`/`theme`); a exportação também não levava.

## Como os dados chegam (`app/admin/api.js`)

1. **Servidor local** `tools/dev-server.py` → `/api/admin` (service_role; só `127.0.0.1`; precisa de `CF_ADMIN_LOCAL=1` no `.env.local`). Acesso total, inclusive saldo das chaves SerpAPI.
2. **Supabase**: login (e-mail/senha) → `is_platform_admin()` → RPCs `admin_*` (migrações 24 e 26) e funções `admin-api` (criar contas) e `forja-proxy`.
3. **Demonstração**: sem servidor, dados de exemplo em memória (para ver as telas e para os testes).

## Prospecção: página pronta + ativação pelo dono (migração 27)

1. A página é criada numa **conta técnica** (`prospeccao@seuclientefiel.com.br`, senha aleatória, ninguém entra) com os dados que já temos do Prospector: nome, nicho, WhatsApp, nota/avaliações e "Como chegar" (pelo ID do Maps — sem gastar SerpAPI), cartão com recompensa do nicho e carimbo de boas-vindas.
2. Fica **no ar como demonstração** (`…/app/c/?s=<slug>`, `noindex`): mostra cartão e blocos, mas **ninguém se cadastra** — o formulário vira um aviso e o banco recusa (`customers_block_preview`). Não coletamos dados de clientes de um negócio que não aceitou.
3. O dono recebe o **link de ativação** (`…/app/?ativar=<token>`, vale 60 dias, só o hash fica no banco). Ele cria a conta (ou entra) e `claim_business` transfere o negócio para ele, libera os cadastros e o teste grátis começa ali. Se a conta pedir confirmação de e-mail, o token fica guardado no navegador e a ativação acontece no próximo login.
4. Em lote: `python tools/preparar_prospects.py data/<lista>.json` cria as páginas e gera `data/<lista>_ativacao.csv` (página, link de ativação, mensagem e link `wa.me` com a mensagem). Idempotente pelo ID do Maps.

## Prospecção com conta própria (migração 30)

Em vez do link de ativação, a página pode já nascer com a **conta do estabelecimento**: login temporário + senha.

1. **Dados reais:** `python tools/buscar_itapema.py` busca no Google Maps (SerpAPI, com paginação) todas as cafeterias
   e pizzarias da cidade e junta com a base do Prospector → `data/itapema_cafes_pizzarias.json/.csv`.
   Depois, `python tools/enriquecer_prospects.py data/itapema_cafes_pizzarias.json` completa cada um com o **painel do
   Google**: perfis (Instagram, Facebook, TikTok), WhatsApp (inclusive de fixo), pedido online (iFood…), cardápio,
   descrição e faixa de preço. Ele só usa o painel se o ID do Maps for o mesmo. Também pega o **logo do site próprio**:
   ícone ou imagem "logo", virando um quadrado de 256 px, com fundo escuro se o logo for claro. Gasta 1 busca por
   estabelecimento.
   - Instagram e Facebook não são lidos (as regras deles não permitem). Esses logos você sobe no painel: **Negócio →
     Geral e plano → Logo**.
   - Confira os logos antes de publicar: ícone da plataforma de pedidos não é logo do estabelecimento (lista
     `LOGO_PLATAFORMA` no script).
2. **Páginas e contas:** `python tools/contas_prospects.py data/itapema_cafes_pizzarias.json` (`--dry-run` para
   conferir). Para cada estabelecimento:
   - cria a página, ou atualiza se ela ainda está em preparação, com endereço, WhatsApp, site/Instagram, "Como chegar"
     com a nota, horário, recompensa do nicho e a ficha do Google;
   - cria a conta `<slug>@seuclientefiel.com.br` (marcada com `temporary_email`; as antigas eram `.invalid` e foram migradas com `tools/migrar_email_contas.py`) com uma senha forte. Antes o domínio era o `.invalid`, reservado: ninguém
     consegue registrá-lo, então ninguém recebe e-mail de "esqueci a senha" dessas contas;
   - põe a página nessa conta (`admin_assign_owner`).

   A saída é `data/<lista>_acessos.xlsx/.csv`, com página, login, senha, mensagem pronta e link do WhatsApp. O estado
   fica em `data/<lista>_contas.json`: rodar de novo não recria contas nem troca senhas. A pasta `data/` fica fora do
   Git.
3. A página continua **em prévia** (sem cadastro de clientes). Quando o dono entra, vê "Página em prévia" no topo e o
   aviso no Painel. **Ativar minha página** (`owner_activate_business`) libera o cadastro e começa o teste de 21 dias.
4. No painel da plataforma, em **Negócio → Acesso**:
   - **Trocar e-mail** (função `admin-api`, ação `set-email`) troca o temporário pelo e-mail real do dono; a senha
     continua a mesma;
   - **Definir nova senha** e **Ativar página agora** também ficam ali.
5. A marcação de prévia (`settings.prospect`) só muda pelo servidor (gatilho `businesses_keep_prospect`). Salvar as
   configurações no painel do lojista não tira mais a página da prévia.

## Segurança

- Todas as RPCs `admin_*` começam com `if not public.is_platform_admin() then raise exception 'forbidden'`. A partir da migração 26, `is_platform_admin()` também é verdadeiro para a **service_role** (API local e funções do servidor).
- Toda escrita grava em `admin_audit` (usuário, ação, negócio, detalhes).
- Criar a **conta** do dono exige service_role: só a função `admin-api` (que confere `platform_admins` do chamador) e a API local fazem isso. O convite sai pelo e-mail do Supabase (Auth › SMTP). Se o dono já tem conta, o negócio é criado e devolvemos um **link de acesso** para você mandar por outro canal.
- O modelo exportado não leva clientes, pagamentos nem a ficha do Google (`settings.gmaps`).
- O painel não mexe no slug nem no dono de um negócio (o dono só muda pela ativação).
- Trocar senha/gerar links (função `admin-api`) recusa outro superadmin e a conta técnica de prospecção; tudo vai para a Auditoria.

## Tornar alguém superadmin

```sql
insert into public.platform_admins(user_id, note) select id, 'nome' from auth.users where email = 'email@exemplo.com';
```

## Testes

- `python tests/check-platform.py` — telas do painel da plataforma em demonstração (KPIs, pagamentos, detalhe e abas, criar por e-mail/CSV, modelo, exportações, auditoria, trava de acesso).
- `python tests/check-security.py` — RPCs `admin_*` recusam quem não é superadmin (precisa do Supabase local).
