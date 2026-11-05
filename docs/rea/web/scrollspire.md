# REA · navegador · scrollspire

URL observada: `http://127.0.0.1:8104/`

## Recursos carregados pela página
- 19 recursos (9118 KB declarados) · hosts: 127.0.0.1:8104 ×19
- Tipos: Script ×19
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 54 scripts (54 módulos ES, 19 com source map)
- http://127.0.0.1:8104/
- http://127.0.0.1:8104/@react-refresh
- http://127.0.0.1:8104/@vite/client
- http://127.0.0.1:8104/node_modules/.vite/deps/@react-three_drei.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/@react-three_fiber.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/@react-three_postprocessing.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-4TPLFE2C.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-DC5AMYBS.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-FD2NSRRT.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-FISK62JY.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-PWGZE4B4.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-RLJ2RCJQ.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-S725DACQ.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-YCOEJRGR.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/chunk-Z24DV3IB.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/gsap.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/gsap_ScrollTrigger.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/lenis.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/react-dom_client.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/react.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/.vite/deps/three.js?v=3ab6dffb
- http://127.0.0.1:8104/node_modules/vite/dist/client/env.mjs
- http://127.0.0.1:8104/src/App.jsx
- http://127.0.0.1:8104/src/components/AvailabilityRibbon.jsx
- http://127.0.0.1:8104/src/components/BuildingModel.jsx
- http://127.0.0.1:8104/src/components/ChapterIndicator.jsx
- http://127.0.0.1:8104/src/components/CustomCursor.jsx
- http://127.0.0.1:8104/src/components/DustField.jsx
- http://127.0.0.1:8104/src/components/GrainOverlay.jsx

## DOM e acessibilidade
- Nós DOM: 1079 · nós de acessibilidade: 646

## Console
- [debug]  (client:494)
- [debug]  (client:617)
- [info]  (chunk-YCOEJRGR.js?v=3ab6dffb:21550)
- [log]  (HeroCanvas.jsx:263)
- [log]  (HeroCanvas.jsx:263)
- [log]  (HeroCanvas.jsx:263)
- [log]  (HeroCanvas.jsx:263)
- [log]  (HeroCanvas.jsx:263)
- [log]  (HeroCanvas.jsx:263)

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 7 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 54/54 · parse ok 52 · nós AST 1103807
- Chunks: 54 (arestas 247) · rotas candidatas: 1 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- bundle_runtime: Vite (medium)
- vendor_fingerprint: React (medium)
- endpoint_candidate: map (low)
- endpoint_candidate: intensity (low)
- endpoint_candidate: brightness (low)
- endpoint_candidate: contrast (low)
- endpoint_candidate: factor (low)
- endpoint_candidate: offset (low)
- endpoint_candidate: RADIAL_MODULATION (low)
- endpoint_candidate: modulationOffset (low)
- endpoint_candidate: INVERTED (low)
- endpoint_candidate: nearColorBuffer (low)
- endpoint_candidate: farColorBuffer (low)
- endpoint_candidate: farCoCBuffer (low)
- endpoint_candidate: nearCoCBuffer (low)
- endpoint_candidate: scale (low)
- endpoint_candidate: angle (low)
- endpoint_candidate: EDGE_THRESHOLD_MIN (low)
- endpoint_candidate: EDGE_THRESHOLD_MAX (low)
- endpoint_candidate: SUBPIXEL_QUALITY (low)
- endpoint_candidate: SAMPLES (low)
- endpoint_candidate: distortion (low)
- endpoint_candidate: seeds (low)
- endpoint_candidate: active (low)
- endpoint_candidate: columns (low)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
