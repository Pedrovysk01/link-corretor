# REA · navegador · serica

URL observada: `http://127.0.0.1:8103/`

## Recursos carregados pela página
- 4 recursos (1753 KB declarados) · hosts: 127.0.0.1:8103 ×4
- Tipos: Script ×4
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 8 scripts (8 módulos ES, 3 com source map)
- http://127.0.0.1:8103/@vite/client
- http://127.0.0.1:8103/node_modules/.vite/deps/chunk-IT3TP6RZ.js?v=7bea8834
- http://127.0.0.1:8103/node_modules/.vite/deps/three.js?v=7bea8834
- http://127.0.0.1:8103/node_modules/.vite/deps/three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834
- http://127.0.0.1:8103/node_modules/.vite/deps/three_examples_jsm_loaders_RGBELoader__js.js?v=7bea8834
- http://127.0.0.1:8103/node_modules/vite/dist/client/env.mjs
- http://127.0.0.1:8103/src/main.js
- http://127.0.0.1:8103/src/style.css

## DOM e acessibilidade
- Nós DOM: 291 · nós de acessibilidade: 303

## Console
- [debug]  (client:732)
- [warning]  (three_examples_jsm_loaders_RGBELoader__js.js?v=7bea8834:269)
- [debug]  (client:826)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)
- [error]  (three_examples_jsm_loaders_GLTFLoader__js.js?v=7bea8834:1907)

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 7 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 8/8 · parse ok 8 · nós AST 214377
- Chunks: 8 (arestas 9) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- bundle_runtime: Vite (medium)
- endpoint_candidate: WEBGL_multi_draw (low)
- endpoint_candidate: EXT_texture_filter_anisotropic (low)
- endpoint_candidate: EXT_clip_control (low)
- endpoint_candidate: WEBGL_multisampled_render_to_texture (low)
- endpoint_candidate: EXT_color_buffer_float (low)
- endpoint_candidate: WEBGL_compressed_texture_s3tc_srgb (low)
- endpoint_candidate: WEBGL_compressed_texture_s3tc (low)
- endpoint_candidate: WEBGL_compressed_texture_pvrtc (low)
- endpoint_candidate: WEBGL_compressed_texture_etc (low)
- endpoint_candidate: WEBGL_compressed_texture_astc (low)
- endpoint_candidate: EXT_texture_compression_bptc (low)
- endpoint_candidate: EXT_texture_compression_rgtc (low)
- endpoint_candidate: WEBGL_lose_context (low)
- endpoint_candidate: KHR_parallel_shader_compile (low)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
