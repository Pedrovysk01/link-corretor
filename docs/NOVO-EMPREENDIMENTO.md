# Novo empreendimento — entendimento geral

Como todo empreendimento entra na plataforma, do material que a construtora envia até a apresentação publicada.
Vale para qualquer construtora. Decisões fechadas em 05/11/2026 (ver "Decisões" no fim).

## 1. O que a plataforma entrega para cada empreendimento

| Peça | O que é | Quem vê |
|---|---|---|
| Apresentação 3D | O prédio (ou as casas) no terreno real, com sol pela hora e janelas acesas à noite | Cliente, corretor |
| Unidades | Cada unidade clicável no 3D; cor pela situação (disponível / reservada / vendida) | Cliente, corretor |
| Ficha da unidade | Área privativa, andar, vagas, planta do tipo, valor e fluxo de pagamento | Cliente, corretor |
| Espelho | Grade andares × finais, nas cores da situação; clicar abre a ficha e destaca no 3D | Cliente, corretor, construtora |
| Materiais | Galeria, planta com pontos, antes/depois, dados da cidade | Cliente, corretor |
| Link por corretor | `/r/<código>`: cada abertura fica no nome do corretor que enviou | Corretor, construtora |
| Cadastro do cliente | Nome na 3ª interação (ou 30 s); depois WhatsApp ou e-mail | Cliente |
| IA | Responde só com os fatos do empreendimento, em até 9 idiomas | Cliente |
| Painel | Clientes, corretores, avisos de cadastro, divisão de comissão, dados da cidade | Construtora |

## 2. O que a construtora envia (em ordem de importância)

1. **Modelo 3D do projeto** (`.skp` do arquiteto, ou `.glb`/`.fbx`/`.ifc`). Sem ele, modelamos a torre a partir das plantas e dos renders (volume, varandas, janelas). Fica bom, mas não é o desenho do arquiteto.
2. **Matrícula do terreno** com as coordenadas dos vértices, ou um link do Google Maps com o alfinete no lote. Sem isso o prédio não fica no lugar exato e o terreno não pode ser recortado.
3. **Plantas de venda, uma por tipo** (Final 01, Final 02, Cobertura…). PDF ou imagem.
4. **Tabela de vendas** (planilha): unidade, andar, final, tipo, área privativa, vagas, valor, situação. Pode vir depois: a apresentação fica pronta com "sob consulta".
5. **Renders oficiais** (fachada, aérea, noturna, ambientes, lazer). Vão para a galeria, o painel dos ambientes e a planta com pontos.
6. **Catálogo / book** em PDF. Tiramos dele nome, endereço, slogan, textos dos ambientes.
7. **Fatos para a IA**: tipologias, metragens, lazer, prazo, condições. Texto corrido serve.
8. **Logo** (SVG ou PNG com fundo transparente) e cores da marca.
9. **Dados da cidade**: até 5 itens curtos (obras, valorização, serviços). A construtora preenche no painel.
10. **Vídeo do drone** ou do decorado (opcional): vira filme de abertura e 360°.

## 3. O fluxo de trabalho (5 passos, iguais para todos)

1. **Modelo** — converter o arquivo do arquiteto em `.glb` leve (Blender): só o que aparece de fora, comprimido. Sem arquivo: modelar pelas plantas.
2. **Terreno, bairro e sol** — coordenadas da matrícula no centro da cena; recorte do terreno com satélite e relevo; sol pela data e hora; noite com "hora azul".
3. **Unidades** — dividir cada andar pelos finais da planta-chave. Regra: divisa de unidade nunca corta janela. Conferir acendendo uma unidade por vez.
4. **Tabela, ficha e espelho** — tabela vira arquivo de dados (`units.json`). Teste automático: valor = área × R$/m². Ficha e espelho leem desse arquivo. Aviso legal junto de todo valor.
5. **Celular e entrega** — testar em 390 px e no computador; ficha vira folha embaixo; publicar o link; conferir cada número da ficha contra a tabela.

## 4. Decisões

| # | Pergunta | Decisão |
|---|---|---|
| D1 | Planta: por tipo ou por unidade? | **Por tipo.** Uma imagem por tipo (Final 01, 02, Cobertura). A ficha da unidade mostra a planta do seu tipo. |
| D2 | Espelho: como funciona? | **Grade com cores e ficha.** Linhas = andares, colunas = finais. Cor pela situação. Clicar abre a ficha e destaca a unidade no 3D. |
| D3 | Preço antes da tabela chegar? | **"Sob consulta" + botão do corretor.** A ficha abre com área, andar e planta; no lugar do valor, "sob consulta" e o WhatsApp do corretor. |
| D4 | Janelas: identificar ou só acender? | **Identificar.** Cada janela pertence a uma unidade; à noite acendem só as vendidas. Em prédios com 2 por andar, basta dividir o andar ao meio. |
| D5 | Sem o `.skp`? | **Modelar.** Volume pelas plantas, fachada pelos renders. Trocar pelo do arquiteto quando chegar. |
| D6 | Caixas da apresentação | **Padrão do Bossa:** papel creme 92 %, tinta verde, latão. Igual nas três e nas próximas. |
| D7 | Aviso legal | Sempre ao lado de qualquer valor, em toda tela. Texto da Lei 4.591/64 quando for pré-lançamento. |

## 5. Vocabulário

- **Planta**: desenho de um apartamento visto de cima, com os cômodos. Uma por tipo.
- **Planta-chave**: desenho do andar inteiro mostrando onde fica cada final. Serve para dividir o 3D em unidades.
- **Espelho**: tabela do prédio inteiro (andares × finais) com a situação de cada unidade.
- **Final**: a posição do apartamento no andar (01, 02…). 1201 = 12º andar, final 01.
- **Tipo**: o modelo de planta (ex.: 3 suítes frente). Vários finais podem ter o mesmo tipo.
- **Fluxo**: como o valor é pago (entrada, mensais, semestrais, chaves, pós-obra).

## 6. Onde está cada coisa no código

- Apresentações: `Planta-Interativa/Planta Interativa/{app, apresentacao, tour}` (Bossa, Felicità, Montemerano).
- Cabeçalho, Materiais e rodapé padrão: `painel/casca.js`, `painel/materiais.js` (injetados pelo servidor).
- Dados da cidade: `properties.city_cards` (servidor) → `window.LC_CIDADE` (apresentação).
- Fatos da IA: `tools/seed/<empreendimento>-fatos.txt` e campo "O que a IA sabe" no painel.
- Guia para o cliente (PDF): `docs/guia-cliente/` (gerado a partir de `guia.html`).
