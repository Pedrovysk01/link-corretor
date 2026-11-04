# Plano de implementação — Mapa de Vendas Bossa

Escopo: tudo o que foi aprovado na revisão de código, na varredura de design, nas 4 auditorias (layout, design system, acessibilidade, rede) e na proposta do sol.
Regra: uma fase por vez, um commit por fase, nada novo sem o teste daquela fase passar. Ao executar, cada fase vira um `GATES.md` (skill unlazy) com os testes abaixo.
Os testes reaproveitam os scripts da auditoria (`overflow.js`, `ds.mjs`, `sol.mjs`, teclado, contraste, rede), movidos para `app/tests/` e rodados no ego-browser.

## Precisa de você antes (bloqueia só o item indicado)
- Q1. Contato do comprador: WhatsApp (número), formulário ou e-mail do corretor? Bloqueia F6.
- Q2. Parcelas: arredondar na ficha ("≈ R$ 27,8 mil") ou manter exatas? Bloqueia F9.
- Q3. Arquitetura confirma o norte da prancha (23°) e o lado da piscina de cada tipologia. Bloqueia G5 (o resto do sol segue).
- Q4. Hospedagem final (Vercel, Netlify ou outra). Bloqueia H7.

## Fase A — Correções rápidas da revisão (antes de mexer na estrutura)
- A1. Nova tentativa do 3D reusa ou descarta o renderer: `dispose()` e remoção do canvas antigo, sem segundo contexto WebGL.
- A2. O teste do `can3D` libera o contexto WebGL (`WEBGL_lose_context`).
- A3. O aviso "Montando o relevo…" fica escondido enquanto o 3D sobe em segundo plano. Aparece só se o usuário pedir o 3D.
- A4. O botão "Relevo 3D" só fica marcado quando o 3D está de fato na tela (hoje fica marcado por 20–40 s ainda no 2D).
- A5. A mensagem de falha do 3D diferencia rede ("conexão instável, tente de novo") de aparelho sem suporte.
- A6. Apagar os 8 JPG de render que nada usa (~13 MB). Os originais ficam em `original/`.
- A7. `<html lang="pt-BR">`.
- A8. Servidor de teste sempre em `127.0.0.1` (já feito) e anotado no README.
Testes da fase:
- Clicar 3D com a textura bloqueada, duas vezes, e ter 1 canvas e 0 erros no console.
- A busca por `render*.jpg` em `media/` volta vazia.
- Em boot lento, `aria-pressed` do 3D fica "false" até o 3D aparecer.

## Fase B — Arquitetura (base para todo o resto; era a Fase 3)
- B1. Dados para `data/units.json`: casas, preços, status, tipos, áreas comuns, GEO. Trocar disponível ou vendida passa a ser editar um JSON, sem tocar no código.
- B2. Separar `index.html` em `css/` (tokens, base, componentes, telas) e `js/` em módulos ES: estado, mapa2d, relevo3d, ficha, galeria, filme, experiências, sol, util.
- B3. Um estado único (`state.js`) com a visão atual (2D/3D), a casa aberta, a luz, os filtros e a modal aberta. Remover as variáveis soltas e os "remendos" que sobrescrevem funções.
- B4. Remover as classes órfãs (`kolink`, `vgv`) e as variáveis sem uso (`--linen`, `--dock`).
- B5. Teste automático do fluxo 2D/3D (pendência da revisão): abrir, clicar 3D durante a montagem, voltar ao 2D e conferir o estado.
Testes da fase:
- `ds.mjs` dá `orphanCss: []`, `unusedVars: []` e `undefVars` só com as que o JS define.
- O roteiro completo do comprador (ficha, filme, experiências, luzes, 2D/3D, casa vendida) dá o mesmo resultado de antes. Screenshots antes/depois lado a lado.
- O console fica sem erros em desktop e celular.

## Fase C — Design system (tokens), base para o redesign
- C1. Cores: as 80 cores soltas viram as variáveis existentes ou novos tokens nomeados (superfície, texto, borda, sombra, véu). Inclui uma versão do tom dourado com contraste ≥ 4,5 para texto pequeno.
- C2. Tipografia: de 25 tamanhos para uma escala de 7 (`--t-xs` até `--t-display`), em rem, com espaçamento entre letras por tamanho (títulos apertados, corpo neutro).
- C3. Movimento: de 9 durações para 3 (rápido, padrão, cena), uma curva padrão e as molas do apple-design (amortecimento 1,0 por padrão).
- C4. Camadas: de 11 valores de z-index para uma escala nomeada (mapa, pins, barras, ficha, modal, aviso).
- C5. Cantos e sombras: 3 raios e 3 sombras (chip, painel, modal).
Testes da fase:
- `ds.mjs`: cores soltas ≤ 10 (só dentro do SVG gerado), tamanhos de fonte ≤ 8, durações ≤ 4.
- Contraste: o script de contraste retorna lista vazia nas telas de início, ficha e noite.

## Fase D — Layout responsivo e correções de vazamento (era a Fase 4)
- D1. Tirar o mapa girado no celular em pé. Mapa normal, enquadramento inicial nas 3 disponíveis, pins sempre visíveis ao abrir.
- D2. Celular em pé: barra inferior com Geral, Filme, Experiências e "Mais". "Mais" abre uma folha com 3D, luzes e "Só disponíveis".
- D3. Celular deitado: barra compacta numa linha. Painel do sol vira um chip. O texto legal sai da tela e vai para um link.
- D4. Tablet: a legenda não cobre pins. Os pins evitam os painéis com o `declutter` considerando as áreas ocupadas.
- D5. A ficha no celular é uma folha que sobe de baixo, arrastável, com 3 alturas: meia, cheia e fechada. O cabeçalho do projeto some quando ela abre. Cartões e barra não ficam por cima do texto.
- D6. A galeria da ficha: "1 / 8" e "Imagens ilustrativas" em cantos opostos.
- D7. Pins nunca cortados na borda: deslocar para dentro ou mostrar uma seta na borda.
Testes da fase:
- `overflow.js` em 390×844, 844×390, 768×1024 e 1440×900 dá `leaks: []` e `overlaps: []` no início e com a ficha aberta.
- Em 390×844, as 3 disponíveis aparecem dentro da tela ao abrir.

## Fase E — Acessibilidade (teclado e leitor de tela)
- E1. Contorno de foco visível nas casas do SVG (anel claro com sombra escura, legível sobre o render) e no canvas 3D.
- E2. Abrir a ficha leva o foco para o título da casa. Esc fecha e devolve o foco para a casa ou pin de origem. Na folha do celular, o foco fica preso dentro dela.
- E3. Fotos da galeria fora da vista saem da ordem do Tab. Só as setas e a foto atual recebem foco.
- E4. O 3D aceita teclado: setas giram, +/− aproximam e Tab percorre todas as casas, não só as 3 disponíveis.
- E5. `<main>`, títulos em ordem, `aria-pressed` também em Filme e Experiências, e anúncio no leitor de tela ao abrir a ficha ("Brisa 06, disponível, R$ 3,86 milhões").
- E6. As casas no 2D (47 paradas de Tab) ganham atalho: "Pular para casas disponíveis".
Testes da fase:
- Script de Tab: 0 paradas sem contorno, foco nunca no `body` no meio do ciclo, Enter na casa coloca o foco dentro da ficha, Esc devolve à origem.
- Contraste: lista vazia (repete o teste da C).

## Fase F — Redesign e venda (era a Fase 5, com apple-design)
- F1. Botões reagem ao toque na hora: encolhem levemente ao apertar, com mola e sem atraso.
- F2. A ficha entra e sai pelo mesmo lado, com mola, e pode ser interrompida no meio. No celular, ela é arrastável com impulso e resistência na borda.
- F3. Painéis translúcidos com desfoque (barra, legenda, ficha), versão sólida em "reduzir transparência" e borda forte em "mais contraste".
- F4. Painel do sol e legenda enxutos: só a legenda e o sol. Texto legal em "Informações legais".
- F5. Aviso "Toque em uma casa…" aparece uma vez e some depois do primeiro toque.
- F6. **Botão de contato** "Tenho interesse" na ficha e na barra, com a casa já citada na mensagem (depende de Q1).
- F7. Compartilhar casa: um link direto para a ficha (`#brisa-06`) e o botão compartilhar do aparelho.
- F8. Casa vendida: atalho "Ver as 3 disponíveis".
- F9. Parcelas arredondadas com "ver valores exatos" (depende de Q2).
- F10. Filme: pausar, som, barra de progresso e pular.
- F11. "Relevo 3D" desligado em tom neutro. O dourado fica reservado para "disponível".
- F12. Texto do sol em linguagem de comprador ("Meio-dia · sol forte, sombra curta"). O detalhe técnico (graus, azimute) fica num "saiba mais".
Testes da fase:
- Com "reduzir movimento" ligado, nenhuma animação de deslocamento, só troca suave (conferido com CSS emulado no ego-browser).
- O link `#brisa-06` abre direto a ficha certa.
- O botão de contato gera a mensagem com o nome e o preço da casa.

## Fase G — Sol imersivo
- G1. Trocar o cálculo pela fórmula da NOAA (com equação do tempo e refração). Aceitar qualquer data e hora.
- G2. Botão play: o dia passa em cerca de 8 s, do sol nascendo sobre o mar ao pôr atrás da mata. As sombras giram no 2D, o mapa de sombras do 3D é refeito só durante a animação, e a cor do céu e do render muda aos poucos.
- G3. Barra arrastável de hora (5h a 18h) com o sol desenhado num arco sobre o mapa, mostrando de onde vem a luz.
- G4. Chave Verão (21/dez) / Inverno (21/jun) / Hoje, mostrando o sol trocando de lado.
- G5. Na ficha, um mini diagrama da piscina daquela casa com as faixas de sol manhã/meio-dia/tarde, no verão e no inverno (depende de Q3 para sair do "estimado").
- G6. "Reduzir movimento": play vira troca direta entre manhã, meio-dia e tarde.
- G7. Desempenho: a animação fica em 60 fps no desktop e ≥ 30 fps no celular médio, e o 3D parado volta a não refazer sombras.
Testes da fase:
- `sol.mjs` contra o módulo novo: nascer, sol a pino e pôr de 21/jun, 7/out e 21/dez com diferença ≤ 2 min da tabela NOAA medida (5h36/11h23/17h11, 5h02/11h09/17h16, 5h00/11h20/17h40).
- A sombra às 11h20 aponta para sul em junho e para norte em dezembro (teste do vetor de sombra).

## Fase H — Carregamento, erros e entrega (era a Fase 6)
- H1. A imagem principal que falha ganha aviso discreto e "tentar de novo". O texto alternativo não aparece solto.
- H2. Miniaturas e fotos que falham mostram um fundo neutro com ícone, nunca o ícone de imagem quebrada.
- H3. O filme e os vídeos sem rede mostram o pôster com "vídeo indisponível". Repetir o teste que deu inconclusivo, agora sem cache.
- H4. A montagem do 3D tem progresso real (relevo, textura, casas) em vez de um aviso parado.
- H5. Textura própria de celular (2048 px, ~500 KB) no lugar da de 1,6 MB.
- H6. FPS real e memória no celular de verdade. Teste em 4G lento. Atualizar o `BASELINE.md`.
- H7. Deploy: nomes de arquivo com versão para o cache, compressão e cabeçalhos de cache longos para mídia (depende de Q4).
Testes da fase:
- Roteiro de rede (render, Three, fotos e vídeos bloqueados): nenhuma tela em branco, nenhum ícone quebrado, todo erro com saída.
- 4G simulado: o 2D aparece em ≤ 3 s e o carregamento do celular fica ≤ 2,5 MB.

## Ordem, tamanho e riscos
- Ordem: A, B, C, D, E, F, G, H. A e B destravam o resto. G pode correr junto com F depois da C, porque não mexem nos mesmos arquivos.
- Tamanho estimado: A pequeno, B grande, C médio, D grande, E médio, F grande, G médio, H médio.
- Riscos:
  - A Fase B é a de maior risco de regressão, por isso o roteiro com screenshots antes/depois.
  - A Fase D muda o celular por inteiro: fazer protótipo e você aprovar antes de aplicar.
  - O sol precisa de Q3 para não prometer o que a arquitetura não garante.
- Fora do escopo: backend, CRM, painel admin e troca do render oficial (regra: vender com o render oficial).

## Como cada fase fecha
1. Antes de codar: criar `.unlazy/<fase>/GATES.md` com os testes da fase (CHECK e EXPECT). Rodar o `gate-lint` e eu revisar cada comando.
2. Fazer a fase inteira, sem deixar pedaço para depois. Revisar como especialista e corrigir o que achar.
3. Rodar os testes da fase e os de todas as fases anteriores (regressão).
4. Screenshots no ego-browser (desktop, celular em pé e deitado, tablet) para você ver.
5. Commit em português descrevendo a fase. Você aprova antes da próxima.
6. O que não puder ser feito vira `ABANDON` com motivo, aparece no relatório e nunca é escondido.

## Rastreio: de cada achado ao item do plano
| Achado (origem) | Item |
|---|---|
| Segundo renderer ao tentar o 3D de novo (revisão 1) | A1 |
| Servidor expondo `.git` na rede (revisão 2) | A8 |
| Sem teste do fluxo 2D/3D (revisão 3) | B5 |
| 13 MB de JPG mortos (revisão 4) | A6 |
| Contexto WebGL aberto no `can3D` (revisão 5) | A2 |
| "Montando o relevo…" em todo boot (revisão 6, rede) | A3, H4 |
| Textura pesada no celular (revisão 7) | H5 |
| Celular abre sem casas marcadas (design 1) | D1 |
| Botões principais escondidos no celular (design 2) | D2 |
| Cabeçalho por cima da ficha no celular (design 3) | D5 |
| "1 / 8" sobre "Imagens ilustrativas" (design 4, layout) | D6 |
| "Relevo 3D" desligado em laranja (design 5) | F11 |
| Painel do sol e texto legal grandes demais (design 6) | F4 |
| Pins cortados na borda (design 7) | D7 |
| Sem botão de contato (acrescentar 1) | F6 |
| Compartilhar casa (acrescentar 2) | F7 |
| Atalho na casa vendida (acrescentar 3) | F8 |
| Controles do filme (acrescentar 4) | F10 |
| Toque vivo e ficha simétrica (acrescentar 5, apple-design) | F1, F2, F3 |
| Aviso "Toque em uma casa…" fixo (retirar 1) | F5 |
| Frase técnica do sol (retirar 2) | F12 |
| Parcelas quebradas (retirar 3) | F9 |
| Celular deitado e tablet sobrepostos (layout) | D3, D4 |
| Cartões e barra sobre o texto da ficha (layout) | D5 |
| Classes e variáveis órfãs (design system) | B4 |
| 80 cores, 25 tamanhos, 9 durações, 11 z-index (design system) | C1–C5 |
| Foco invisível nas casas (a11y 1) | E1 |
| Foco não entra na ficha, Esc perde o foco (a11y 2, 3) | E2, E3 |
| Página sem idioma (a11y 4) | A7 |
| 3D sem teclado (a11y 5) | E4 |
| Contraste do dourado 2,9–3,3 (a11y 6) | C1 |
| Botão 3D marcado sem estar no 3D (rede) | A4 |
| Imagem principal falha sem aviso (rede) | H1 |
| Mensagem culpa o aparelho em falha de rede (rede) | A5 |
| Miniaturas quebradas (rede) | H2 |
| Filme sem rede, teste inconclusivo (rede) | H3 |
| Horário do sol 10–15 min errado (sol) | G1 |
| Sol sem estações, sem animação (sol) | G2–G6 |
| Norte e piscinas estimados (sol) | Q3, G5 |
| FPS, rede lenta e celular real não medidos (pendências) | H6 |
| Fases 3–6 do plano original | B, D, F, H |
