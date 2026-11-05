# REA · scrollspire

Pasta analisada: `C:\Users\pacc1\Documents\Antigravity\Link Corretor\.ds-audit\refs\ScrollSpire-Cinematic-3D-Scrollytelling-for-Luxury-Real-Estate\src`

## Números
- Arquivos JS/TS lidos: 30 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 204 · arestas de import: 320 (relativos não resolvidos: 2)
- Grafo semântico: 5963 nós (expression 3849, call-site 559, binding 541, property-slot 431, function 199, return-site 159) · incógnitas declaradas: 2176
- Rotas detectadas: 0

## Dependências externas (por nº de imports)
- react × 106
- gsap × 34
- @react-three/fiber × 14
- three × 12
- @react-three/drei × 6
- @react-three/postprocessing × 5
- react-dom × 2
- lenis × 2

## Arquivos mais importados (o 'núcleo' do projeto)
- lib/scroll.js ← 12
- data/property.js ← 11
- lib/splitChars.jsx ← 6
- components/MagneticButton.jsx ← 2
- components/sections/HeritageSection.jsx ← 1
- components/JaaliBackground.jsx ← 1
- components/GrainOverlay.jsx ← 1
- App.jsx ← 1
- components/HeroCanvas.jsx ← 1
- components/DustField.jsx ← 1
- components/Loader.jsx ← 1
- components/SparkEmitter.jsx ← 1

## Arquivos que mais importam (os 'orquestradores')
- App.jsx → 24
- components/HeroCanvas.jsx → 11
- components/sections/CTASection.jsx → 6
- components/sections/LifestyleSection.jsx → 5
- components/sections/HeroSection.jsx → 5
- components/sections/AmenitiesSection.jsx → 5
- components/sections/RevealSection.jsx → 5
- components/sections/HeritageSection.jsx → 5

## Arquivos com mais funções (onde está a lógica)
- components/BuildingModel.jsx: 19 funções
- components/HeroCanvas.jsx: 16 funções
- components/sections/AmenitiesSection.jsx: 15 funções
- App.jsx: 14 funções
- components/MobileMenu.jsx: 13 funções
- components/sections/CTASection.jsx: 13 funções
- components/Loader.jsx: 12 funções
- components/CustomCursor.jsx: 8 funções
- components/ChapterIndicator.jsx: 8 funções
- components/SkyDome.jsx: 7 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
