# REA · 3d-real-estate-viewer

Pasta analisada: `C:\Users\pacc1\Documents\Antigravity\Link Corretor\.ds-audit\refs\3D-Real-Estate-Viewer\src`

## Números
- Arquivos JS/TS lidos: 41 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 279 · arestas de import: 260 (relativos não resolvidos: 0)
- Grafo semântico: 1835 nós (expression 977, binding 258, property-slot 117, call-site 115, function 111, return-site 109) · incógnitas declaradas: 625
- Rotas detectadas: 1

## Dependências externas (por nº de imports)
- @mui/material × 90
- @/shared × 28
- @/app × 24
- react × 20
- react-router-dom × 13
- @/entities × 13
- @react-three/drei × 11
- @/features × 8
- @mui/icons-material × 8
- @/widgets × 8
- @/pages × 3
- @react-three/fiber × 2
- zustand × 2
- react-dom × 2

## Arquivos mais importados (o 'núcleo' do projeto)
- widgets/property-viewer/ui/scene/SceneCanvas.tsx ← 1
- widgets/property-viewer/ui/scene/models/GlbApartmentModel.tsx ← 1
- widgets/property-viewer/ui/scene/models/Wall.tsx ← 1
- widgets/property-viewer/ui/photos/PhotoGallery.tsx ← 1
- widgets/property-viewer/ui/scene/models/ProceduralApartment.tsx ← 1
- widgets/property-viewer/ui/scene/ViewerErrorBoundary.tsx ← 1
- widgets/property-viewer/ui/scene/models/Furniture.tsx ← 1
- widgets/property-viewer/ui/floor-plan/FloorPlanView.tsx ← 1
- widgets/property-viewer/ui/scene/models/RoomMesh.tsx ← 1
- widgets/property-list/ui/PropertyCard.tsx ← 1

## Arquivos que mais importam (os 'orquestradores')
- pages/property-viewer/ui/PropertyViewerPage.tsx → 11
- widgets/property-viewer/ui/PropertyViewerWidget.tsx → 7
- widgets/property-viewer/ui/scene/SceneCanvas.tsx → 7
- app/router/AppRouter.tsx → 6
- main.tsx → 6
- pages/properties/ui/PropertiesPage.tsx → 5
- widgets/property-list/ui/PropertyCard.tsx → 5
- widgets/property-info/ui/PropertyInfoPanel.tsx → 5

## Arquivos com mais funções (onde está a lógica)
- pages/property-viewer/ui/PropertyViewerPage.tsx: 8 funções
- widgets/property-viewer/ui/scene/models/RoomMesh.tsx: 7 funções
- app/store/viewerStore.ts: 6 funções
- entities/property/model/useProperty.ts: 6 funções
- widgets/property-info/ui/PropertyInfoPanel.tsx: 6 funções
- widgets/property-viewer/ui/floor-plan/FloorPlanView.tsx: 5 funções
- entities/property/model/useProperties.ts: 5 funções
- widgets/property-viewer/ui/scene/ViewerErrorBoundary.tsx: 5 funções
- features/select-floor/ui/FloorSelect.tsx: 5 funções
- features/select-room/ui/RoomList.tsx: 5 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
