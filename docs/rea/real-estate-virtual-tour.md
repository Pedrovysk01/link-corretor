# REA · real-estate-virtual-tour

Pasta analisada: `C:\Users\pacc1\Documents\Antigravity\Link Corretor\.ds-audit\refs\real-estate-virtual-tour\src`

## Números
- Arquivos JS/TS lidos: 76 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 709 · arestas de import: 684 (relativos não resolvidos: 4)
- Grafo semântico: 18401 nós (expression 10079, property-slot 2476, call-site 1754, binding 1272, literal 1076, function 604) · incógnitas declaradas: 5713
- Rotas detectadas: 0

## Dependências externas (por nº de imports)
- react × 58
- vitest × 53
- three × 45
- lucide-react × 22
- @react-three/drei × 17
- @react-three/fiber × 10
- @testing-library/react × 9
- @react-three/postprocessing × 7
- zustand × 6
- zod × 4
- @testing-library/user-event × 4
- camera-controls × 2
- postprocessing × 2
- @testing-library/jest-dom × 2
- react-dom × 2

## Arquivos mais importados (o 'núcleo' do projeto)
- state/store.ts ← 17
- scene/materials.ts ← 13
- lib/geometry.ts ← 12
- data/properties/index.ts ← 9
- scene/furniture/primitives.tsx ← 7
- scene/constants.ts ← 6
- lib/random.ts ← 5
- lib/format.ts ← 4
- ui/TopBar.tsx ← 4
- scene/assets.ts ← 4
- inquiry/schema.ts ← 3
- lib/webgl.ts ← 2

## Arquivos que mais importam (os 'orquestradores')
- scene/TourCanvas.tsx → 16
- ui/panels.test.tsx → 13
- ui/TourView.tsx → 12
- ui/film/FilmIntro.tsx → 10
- scene/structure/Structure.tsx → 10
- scene/CameraRig.tsx → 8
- scene/furniture/index.tsx → 8
- scene/Surroundings.tsx → 6

## Arquivos com mais funções (onde está a lógica)
- lib/geometry.ts: 31 funções
- data/properties/properties.test.ts: 28 funções
- ui/FloorPlan.tsx: 28 funções
- lib/geometry.test.ts: 26 funções
- ui/panels.test.tsx: 23 funções
- ui/inquiry/InquiryFields.tsx: 22 funções
- inquiry/submitInquiry.test.ts: 20 funções
- scene/Surroundings.tsx: 18 funções
- scene/CameraRig.tsx: 18 funções
- ui/film/FilmIntro.tsx: 18 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
