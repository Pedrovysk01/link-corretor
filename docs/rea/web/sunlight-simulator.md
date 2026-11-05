# REA · navegador · sunlight-simulator

URL observada: `http://127.0.0.1:8101/`

## Recursos carregados pela página
- 13 recursos (854 KB declarados) · hosts: 127.0.0.1:8101 ×13
- Tipos: Script ×10, Stylesheet ×3
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 10 scripts (0 módulos ES, 0 com source map)
- http://127.0.0.1:8101/examples/sample_data.js
- http://127.0.0.1:8101/js/cities.js
- http://127.0.0.1:8101/js/config.js
- http://127.0.0.1:8101/js/desktop.js
- http://127.0.0.1:8101/js/i18n.js
- http://127.0.0.1:8101/js/sunlight-worker.js
- http://127.0.0.1:8101/js/utils.js
- http://127.0.0.1:8101/js/viewer.js
- http://127.0.0.1:8101/vendor/three-r128/OrbitControls.js
- http://127.0.0.1:8101/vendor/three-r128/three.min.js

## DOM e acessibilidade
- Nós DOM: 481 · nós de acessibilidade: 234

## Console
- [log]  (viewer.js:2574)

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 5 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 10/10 · parse ok 10 · nós AST 181026
- Chunks: 10 (arestas 0) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- endpoint_candidate: ANGLE_instanced_arrays (low)
- endpoint_candidate: EXT_blend_minmax (low)
- endpoint_candidate: OES_texture_half_float (low)
- endpoint_candidate: WEBGL_compressed_texture_s3tc (low)
- endpoint_candidate: WEBGL_compressed_texture_pvrtc (low)
- endpoint_candidate: OES_vertex_array_object (low)
- endpoint_candidate: EXT_texture_filter_anisotropic (low)
- endpoint_candidate: EXT_color_buffer_float (low)
- endpoint_candidate: WEBGL_compressed_texture_etc1 (low)
- endpoint_candidate: WEBGL_compressed_texture_etc (low)
- endpoint_candidate: WEBGL_compressed_texture_astc (low)
- endpoint_candidate: EXT_texture_compression_bptc (low)
- endpoint_candidate: WEBGL_depth_texture (low)
- endpoint_candidate: WEBGL_lose_context (low)
- endpoint_candidate: OES_texture_float (low)
- endpoint_candidate: OES_standard_derivatives (low)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
