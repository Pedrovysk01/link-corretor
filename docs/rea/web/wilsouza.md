# REA · navegador · wilsouza

URL observada: `http://127.0.0.1:8100/`

## Recursos carregados pela página
- 24 recursos (31769 KB declarados) · hosts: 127.0.0.1:8100 ×24
- Tipos: Script ×22, Font ×2
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 52 scripts (52 módulos ES, 0 com source map)
- http://127.0.0.1:8100/
- http://127.0.0.1:8100/@react-refresh
- http://127.0.0.1:8100/@vite/client
- http://127.0.0.1:8100/node_modules/.vite/deps/@react-three_drei.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/@react-three_fiber.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/@react-three_postprocessing.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/client-C6mbbQcu.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/jsx-runtime-cNwuCTLA.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/lucide-react.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/maath.esm-BU4ZJydU.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/motion_react.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/postprocessing.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/react-4hkZzRew.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/react-dom-CRx58tZq.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/react-dom_client.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/react-three-fiber.esm-DNU6Ch3Z.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/react.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/rolldown-runtime-SbdDWaPq.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/scheduler-DgymjHxv.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/three.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/three.module-CVnfGTZf.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/three_examples_jsm_utils_BufferGeometryUtils__js.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/vanilla-B_TNa2tD.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/.vite/deps/zustand.js?v=9d4a4ff3
- http://127.0.0.1:8100/node_modules/@fontsource-variable/inter/index.css
- http://127.0.0.1:8100/node_modules/@fontsource-variable/space-grotesk/index.css
- http://127.0.0.1:8100/node_modules/vite/dist/client/env.mjs
- http://127.0.0.1:8100/src/App.tsx
- http://127.0.0.1:8100/src/config/empreendimento.ts

## DOM e acessibilidade
- Nós DOM: 1007 · nós de acessibilidade: 1252

## Console
- [debug]  (client:945)
- [info]  (client-C6mbbQcu.js?v=9d4a4ff3:15557)
- [debug]  (client:1054)
- [warning]  (client:367)

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 6 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 52/52 · parse ok 50 · nós AST 1030367
- Chunks: 52 (arestas 196) · rotas candidatas: 1 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- bundle_runtime: Vite (medium)
- vendor_fingerprint: React (medium)
- endpoint_candidate: radius (low)
- endpoint_candidate: scale (low)
- endpoint_candidate: center (low)
- endpoint_candidate: rotation (low)
- endpoint_candidate: factor (low)
- endpoint_candidate: uCellSize (low)
- endpoint_candidate: uInvert (low)
- endpoint_candidate: uColor (low)
- endpoint_candidate: uCharactersCount (low)
- endpoint_candidate: uCharacters (low)
- endpoint_candidate: sectorCount (low)
- endpoint_candidate: time (low)
- endpoint_candidate: lensPosition (low)
- endpoint_candidate: opacity (low)
- endpoint_candidate: screenRes (low)
- endpoint_candidate: noiseScale (low)
- endpoint_candidate: sharpness (low)
- endpoint_candidate: vite-error-overlay (low)
- endpoint_candidate: asciiTexture (low)
- endpoint_candidate: color (low)
- endpoint_candidate: USE_COLOR (low)
- endpoint_candidate: INVERTED (low)
- endpoint_candidate: cellCount (low)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
