# Guia de conteúdo — adicionar imagens e ambientes sem quebrar o padrão

Tudo do tour do Montemerano fica em `Planta Interativa/tour/`. Você **não precisa mexer em código** para trocar imagens ou textos: só em arquivos de dados.

## 1. Adicionar ou trocar uma imagem (render)

1. Coloque os JPG/PNG originais (qualquer tamanho) numa pasta qualquer.
2. No terminal, dentro de `Planta Interativa/tour/`:
   ```
   npm run imagens -- "C:/caminho/da/pasta"
   ```
   Isso gera WebP de até 1600 px (100–300 KB cada) em `public/img/`. O nome do arquivo vira o "slug": `Living Estar - A - 01.jpg` → `img/living-estar.webp`. O que já existe é pulado; use `--force` para refazer.
3. Ligue a imagem ao ambiente em `src/data/properties/montemerano.ts` (apartamento) ou `montemerano-lazer.ts` (lazer):
   ```ts
   {
     id: 'living',
     image: 'img/living-estar.webp',   // ← aparece no topo do painel, com "Imagem ilustrativa"
     name: 'Living',
     ...
   }
   ```
   A imagem de capa do empreendimento é `cover: 'img/externa-01.webp'`, no topo do arquivo.

**Regras para as imagens:** proporção 16:9 ou 3:2 (o painel recorta em 16:9); sem texto nem marca d'água dentro da imagem; sempre renders **ilustrativos** (a legenda "Imagem ilustrativa" é automática); peso máximo 400 KB depois de convertida.

## 2. Criar um ambiente novo

Em `montemerano.ts` (ou `montemerano-lazer.ts`), adicione um item em `rooms`:

```ts
{
  id: 'home-office',                 // sem espaços ou acentos; aparece na URL (?room=home-office)
  name: 'Home office',
  kind: 'study',                     // living | kitchen | bedroom | bathroom | hall | study | outdoor
  rect: { x: 0, z: 0, w: 3, d: 3 },  // metros: x = leste, z = sul
  floor: 'oak',                      // oak | stone | tile | deck | grass
  image: 'img/home-office.webp',
  description: 'Texto de venda em 1 ou 2 frases.',
  features: ['10 m²', 'Ponto de dados', 'Luz natural'],   // até 4 chips curtos
  furniture: [{ kind: 'desk', at: [1.5, 0.5] }],
}
```

Depois acrescente o `id` em `tour: [...]` (ordem do tour guiado) e as paredes/aberturas em `walls`. Peças disponíveis: `sofa, armchair, bed, desk, wardrobe, island, kitchenRun, diningTable, pool, lounger, plant, artwork, pendant, slatPanel, accentWall, glassCloset…` (lista em `src/data/types.ts`).

## 3. Trocar texto, preço, entrega

No mesmo arquivo: `tagline`, `location`, `priceFrom` (0 = esconde o preço), `completion`. Textos do filme de abertura: `src/data/film.ts`. Os vídeos ficam em `public/film/` (um por capítulo, sem áudio, 1600 px, ≤ 8 s).

## 4. Padrão de design (não quebrar)

A referência viva é **`painel/design-system.html`** (abra no navegador). Resumo:

- **Cor:** tinta verde `#16302e`, papel `#f3efe6`, **latão `#c9944a`** como único acento. Não use outro acento.
- **Tipografia:** títulos em *Instrument Serif*; interface em Figtree/Manrope; números em mono. Use só os tamanhos já definidos em `src/index.css`.
- **Raios:** 6 / 9 / 14 px (e 999 só para pílulas). **Movimento:** 0,2 s / 0,35 s, curva `cubic-bezier(.2,.8,.2,1)`; respeitar `prefers-reduced-motion`.
- **Texto:** pt-BR, tratamento "você", valores em R$, áreas com vírgula (`50,20 m²`).
- **Contraste:** mínimo 4,5:1 para texto; nada de texto de 10–12 px sobre vidro.
- **Antes de enviar:** `npm run typecheck` e `npm run build` precisam passar; abra o tour em desktop e em 390 px de largura e veja se nada sai da tela.

Se for criar um componente novo, copie o estilo de um existente em `src/index.css` em vez de inventar cores e tamanhos.
