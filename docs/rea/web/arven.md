# REA · navegador · arven

URL observada: `http://127.0.0.1:8105/`

## Recursos carregados pela página
- 24 recursos (2000 KB declarados) · hosts: 127.0.0.1:8105 ×24
- Tipos: Script ×24
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 24 scripts (24 módulos ES, 5 com source map)
- http://127.0.0.1:8105/@vite/client
- http://127.0.0.1:8105/node_modules/.vite/deps/chunk-V6TY7KAL.js?v=63d73c28
- http://127.0.0.1:8105/node_modules/.vite/deps/gsap.js?v=63d73c28
- http://127.0.0.1:8105/node_modules/.vite/deps/gsap_ScrollTrigger.js?v=63d73c28
- http://127.0.0.1:8105/node_modules/.vite/deps/lenis.js?v=63d73c28
- http://127.0.0.1:8105/node_modules/.vite/deps/three.js?v=63d73c28
- http://127.0.0.1:8105/node_modules/vite/dist/client/env.mjs
- http://127.0.0.1:8105/src/config/images.js
- http://127.0.0.1:8105/src/data/v3.js
- http://127.0.0.1:8105/src/lib/env.js
- http://127.0.0.1:8105/src/lib/i18n.js
- http://127.0.0.1:8105/src/lib/text.js
- http://127.0.0.1:8105/src/main.js
- http://127.0.0.1:8105/src/modules/cursor.js
- http://127.0.0.1:8105/src/modules/form.js
- http://127.0.0.1:8105/src/modules/gl.js
- http://127.0.0.1:8105/src/modules/magnetic.js
- http://127.0.0.1:8105/src/modules/nav.js
- http://127.0.0.1:8105/src/modules/pointer.js
- http://127.0.0.1:8105/src/modules/preloader.js
- http://127.0.0.1:8105/src/modules/residences.js
- http://127.0.0.1:8105/src/modules/scroll.js
- http://127.0.0.1:8105/src/modules/v3-experience.js
- http://127.0.0.1:8105/src/styles/main.css

## DOM e acessibilidade
- Nós DOM: 1784 · nós de acessibilidade: 1657

## Console
- [debug]  (client:494)
- [debug]  (client:617)

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 7 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 24/24 · parse ok 24 · nós AST 242754
- Chunks: 24 (arestas 40) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- bundle_runtime: Vite (medium)
- endpoint_candidate: arven-lang (low)
- endpoint_candidate: OES_vertex_array_object (low)
- endpoint_candidate: ANGLE_instanced_arrays (low)
- endpoint_candidate: WEBGL_multi_draw (low)
- endpoint_candidate: EXT_texture_filter_anisotropic (low)
- endpoint_candidate: WEBGL_draw_buffers (low)
- endpoint_candidate: EXT_blend_minmax (low)
- endpoint_candidate: WEBGL_multisampled_render_to_texture (low)
- endpoint_candidate: EXT_color_buffer_float (low)
- endpoint_candidate: OES_texture_half_float (low)
- endpoint_candidate: EXT_sRGB (low)
- endpoint_candidate: WEBGL_compressed_texture_s3tc_srgb (low)
- endpoint_candidate: WEBGL_compressed_texture_s3tc (low)
- endpoint_candidate: WEBGL_compressed_texture_pvrtc (low)
- endpoint_candidate: WEBGL_compressed_texture_etc1 (low)
- endpoint_candidate: WEBGL_compressed_texture_etc (low)
- endpoint_candidate: WEBGL_compressed_texture_astc (low)
- endpoint_candidate: EXT_texture_compression_bptc (low)
- endpoint_candidate: EXT_texture_compression_rgtc (low)
- endpoint_candidate: WEBGL_depth_texture (low)
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
