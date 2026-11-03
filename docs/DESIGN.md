# Seu Cliente Fiel — Design System

Fonte de verdade da identidade visual. Use este arquivo ao gerar telas e conteúdos (por exemplo, com o MCP **Stitch**) para que tudo saia na mesma linguagem do painel. Os tokens abaixo existem em código em [`app/assets/css/app.css`](../app/assets/css/app.css) (`:root`).

## 1. Produto

- **Nome:** Seu Cliente Fiel (curto: Cliente Fiel). Idioma: português do Brasil, tratamento "você".
- **O que é:** cartão fidelidade digital (carimbos) para negócios locais: cafeterias, padarias, salões, barbearias, pet shops, academias, lojas. O cliente guarda o cartão no celular e o dono acompanha tudo no painel.
- **Tom:** direto, caloroso, prático. Frases curtas, verbos de ação ("Crie seu cartão", "Dê um carimbo"). Sem jargão.

## 2. Paleta oficial

| Cor | Hex | Papel |
|---|---|---|
| Amarelo | `#F2BB16` | fim do degradê, destaques, estrela da recompensa |
| Âmbar | `#F28C0F` | meio do degradê, ícones e apoio |
| **Laranja (principal)** | `#F26716` | cor da marca: botões, links ativos, foco |
| Vermelho-tijolo | `#D93D1A` | início do degradê, texto de marca, hover |
| Preto | `#0D0D0D` | texto principal, fundos escuros |

**Degradê da marca** (usado em item/aba selecionado, barras de progresso e botões primários):
`linear-gradient(90deg, #D93D1A 0%, #F26716 36%, #F28C0F 68%, #F2BB16 100%)`
Texto sobre o degradê: `#0D0D0D`. Sobre `#F26716` ou `#D93D1A` isolados (botão): branco, peso 600.

**Escala de marca** (`--brand-*`): 25 `#FFFAF3` · 50 `#FFF3E4` · 100 `#FEE4C2` · 200 `#FBCD92` · 300 `#F7A95A` · 400 `#F28C0F` · **500 `#F26716`** · 600 `#D93D1A` · 700 `#B2300F` (texto em laranja sobre branco: único tom com contraste AA) · 800 `#862309` · 900 `#0D0D0D`.

**Neutros (frios, originais):** 25 `#FCFCFD` · 50 `#F9FAFB` · 100 `#F2F4F7` · 200 `#E4E7EC` · 300 `#D0D5DD` · 400 `#98A2B3` · 500 `#667085` · 600 `#475467` · 700 `#344054` · 800 `#1D2939` · 900 `#101828`.

**Estado:** sucesso `#12B76A`, aviso `#F79009`, erro `#F04438`, info `#0BA5EC` (usar só para estados, não para decorar).

**Regras:** laranja claro (`#F26716`) não passa em texto sobre branco: para texto use `#B2300F` ou `#D93D1A` em corpo grande. Evite azul e roxo na interface. O roxo "Aura" (`data-theme="v2"`) é um tema opcional e não é a marca.

**Modo escuro:** fundo azul-marinho `#0F1628` com brilho radial `#1D2B66` no canto superior esquerdo, superfícies de vidro `rgba(255,255,255,.045)`, marca em `#F58A45`/`#F26716`. O que o cliente vê (cartão, página do celular, cartaz) continua claro.

## 3. Logo

Arquivos em [`app/assets/img/`](../app/assets/img/): `seucliente-logo.svg` (fundo claro), `seucliente-logo-branco.svg` (fundo escuro), `seucliente-marca.svg` (só os 4 círculos), `favicon.svg`.
Composição: "SEU CLIENTE" (Montserrat 300, espaçado) sobre 4 círculos sobrepostos com **F · I · E · L** em Montserrat 900 branco. Cores dos círculos do logo: `#E64A19`, `#F97316`, `#F59E0B`, `#FACC15` (são do desenho do logo, não da UI). Área de respiro: 1 círculo. Nunca esticar, recolorir os círculos nem usar o texto branco sobre fundo claro.

## 4. Tipografia

- **Montserrat** (variável 100–900): toda a interface. Corpo 14 px/1.5, títulos de página 20 px peso 500, números de destaque 30 px peso 600.
- **Oswald** (condensada): só em títulos do cartão Premium. **Georgia**: estilo "Clássico" dos cartazes.
- Rótulos pequenos: 11–12 px, MAIÚSCULAS, espaçamento .1em.

## 5. Forma e profundidade

Cantos: 8 px (campos, botões), 12–16 px (cartões de interface), 24 px (janelas), 50% (carimbos). Sombra suave: `0 1px 3px rgba(16,24,40,.1)`; elevada `0 12px 16px -4px rgba(16,24,40,.08)`. Bordas 1 px em `#E5E2DE`. Espaçamento em múltiplos de 4 (24 px entre cartões de página).

## 6. Componentes

- **Menu lateral:** fundo branco, ícones vetoriais de traço (cinza quando inativos), item ativo com um degradê **suave** da marca (14–22% de opacidade) e texto `#B2300F`.
- **Abas e chips selecionados:** laranja claro de fundo (`--brand-50`) com borda `--brand-300`, sem degradê.
- **Botão primário:** laranja sólido `#F26716`, texto branco; **ao passar o mouse** vira o degradê do logo (vermelho-tijolo → amarelo) com texto escuro. Secundário: branco com borda neutra.
- **Caixas de ícone:** sempre redondas (50%), ícone centralizado.
- **Títulos de box** (cabeçalho de card/acordeão) e títulos de grupo do menu: 14 px, negrito, MAIÚSCULAS, `#E64A19`.
- **Menu lateral:** categoria em 14 px negrito maiúsculo; itens em 13 px peso 300; grupos fechados por padrão (acordeão).
- **Cartão de fidelidade (Clássico):** cartão branco com logo + nome à esquerda e "CARIMBOS 3/8" à direita; "vitrine" colorida (fundo do segmento ou data) com selos com **gravuras vetoriais próprias por segmento**, contorno duplo e detalhes de carimbo; o último é a recompensa, com símbolo vetorial; rodapé com rótulo minúsculo em maiúsculas e a oferta na cor de destaque.
- **Cartão Premium:** 3 layouts (painel lateral, foto de fundo, vertical), 25 setores com selo próprio, foto do negócio, 3 cores livres, fontes Moderna/Condensada/Clássica.
- **Banners de campanha:** só fotos reais (33 gerais + 3 por data comemorativa) com efeito glass ajustável, ou imagem enviada pelo dono.

## 7. Imagens e ícones

- Ícones: linha fina e neutra na interface; gravuras vetoriais próprias nos selos e fundos. Sem emojis na interface, nos cartões ou no site.
- Fotos: realistas, calorosas, sem rostos de pessoas, com luz quente. Fundo de banner em 3:2.
- Mockups: aparelhos reais (iPhone 15/17 Pro, Pixel 8, Galaxy S24), nunca telefone desenhado à mão.

## 8. Como pedir conteúdo ao Stitch

Cole este contexto no prompt e ajuste só o conteúdo:

> Marca "Seu Cliente Fiel", cartão fidelidade digital para negócios locais no Brasil. Português do Brasil. Paleta: amarelo #F2BB16, âmbar #F28C0F, laranja #F26716 (principal), vermelho-tijolo #D93D1A, preto #0D0D0D; neutros quentes (#F9F8F6 fundo, #E5E2DE bordas). Degradê de marca (vermelho-tijolo → amarelo) usado com moderação: só no item ativo do menu, em baixa opacidade. Fonte Montserrat. Cantos arredondados (8/16/24 px), sombras suaves, ícones vetoriais elegantes e selos desenhados para cada segmento, fotos realistas e calorosas sem rostos. Mobile primeiro. Tom direto e caloroso, tratando por "você".

Exemplos de telas para gerar: página de preços, landing "Como funciona" (cadastre → o cliente lê o QR → carimba → ganha a recompensa), cartaz de balcão com QR, e-mail de boas-vindas ao dono, cartões de segmento (cafeteria, barbearia, pet shop).

## 9. Referências no repositório

[`wallet-card.js`](../app/assets/js/wallet-card.js) (cartão Clássico) · [`card-premium.js`](../app/assets/js/card-premium.js) · [`banners.js`](../app/assets/js/banners.js) · [`card-themes.js`](../app/assets/js/card-themes.js) · créditos de [fotos](CREDITOS-FOTOS.md) (o catálogo antigo de emojis foi desativado; os créditos históricos permanecem arquivados).


## Coleção de selos — 14/10/2026

25 segmentos com motivo principal próprio, disponível em `CFThemes.stampIcons`. `stampSvg()` desenha o motivo em 24 × 24; `sealSvg()` cria o carimbo em 100 × 100, com anéis de gravura e três acabamentos. As alternativas continuam vetoriais. Cartões clássicos, com foto e v2 compartilham essa biblioteca. Pendentes usam gravura suave; conquistados usam contraste alto. Logos e imagens próprias do estabelecimento continuam disponíveis.

Prévia interativa: `/app/selos-v2.html`. Verificação: `python tests/check-seals.py` (1.200 combinações dos 25 setores × 16 modelos × 3 preenchimentos, ausência de bitmaps de emoji, área dos desenhos, seleção, busca e quatro larguras).
