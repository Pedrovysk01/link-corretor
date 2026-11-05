# REA · navegador · montemerano-360

URL observada: `http://127.0.0.1:8116/360/index.html`

## Recursos carregados pela página
- 36 recursos (5989 KB declarados) · hosts: 127.0.0.1:8116 ×36
- Tipos: Image ×35, Script ×1
- Pedidos de rede durante a observação (depois do carregamento): 0

### Assets 3D/mídia/dados
- http://127.0.0.1:8116/360/externa/externa-1.webp?width=150
- http://127.0.0.1:8116/360/externa/externa-56.webp
- http://127.0.0.1:8116/360/externa/externa-57.webp
- http://127.0.0.1:8116/360/externa/externa-58.webp
- http://127.0.0.1:8116/360/externa/externa-59.webp
- http://127.0.0.1:8116/360/externa/externa-60.webp
- http://127.0.0.1:8116/360/externa/externa-61.webp
- http://127.0.0.1:8116/360/externa/externa-62.webp
- http://127.0.0.1:8116/360/externa/externa-63.webp
- http://127.0.0.1:8116/360/externa/externa-64.webp
- http://127.0.0.1:8116/360/externa/externa-65.webp
- http://127.0.0.1:8116/360/externa/externa-66.webp
- http://127.0.0.1:8116/360/externa/externa-67.webp
- http://127.0.0.1:8116/360/externa/externa-68.webp
- http://127.0.0.1:8116/360/externa/externa-69.webp
- http://127.0.0.1:8116/360/externa/externa-70.webp
- http://127.0.0.1:8116/360/externa/externa-71.webp
- http://127.0.0.1:8116/360/externa/externa-72.webp
- http://127.0.0.1:8116/img/academia.webp
- http://127.0.0.1:8116/img/brinquedoteca.webp
- http://127.0.0.1:8116/img/externa-01.webp
- http://127.0.0.1:8116/img/externa-aerea.webp
- http://127.0.0.1:8116/img/externa-noturna.webp
- http://127.0.0.1:8116/img/fireplace.webp
- http://127.0.0.1:8116/img/gourmet-externo.webp
- http://127.0.0.1:8116/img/living-estar.webp
- http://127.0.0.1:8116/img/living-jantar.webp
- http://127.0.0.1:8116/img/petplace.webp
- http://127.0.0.1:8116/img/piscina.webp
- http://127.0.0.1:8116/img/playground.webp
- http://127.0.0.1:8116/img/sacada.webp
- http://127.0.0.1:8116/img/sala-de-jogos.webp
- http://127.0.0.1:8116/img/salao-de-festas.webp
- http://127.0.0.1:8116/img/suite.webp
- http://127.0.0.1:8116/logo-branca.svg

## Scripts carregados
- 2 scripts (0 módulos ES, 0 com source map)
- http://127.0.0.1:8116/360/360-view.min.js
- http://127.0.0.1:8116/360/index.html

## DOM e acessibilidade
- Nós DOM: 262 · nós de acessibilidade: 159

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 8 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 2/2 · parse ok 2 · nós AST 30350
- Chunks: 2 (arestas 0) · rotas candidatas: 0 · endpoints candidatos: 1
### Inferências do REA (bibliotecas, bundler, padrões)

### Endpoints candidatos
- {"value": "cenas.json", "mechanism": "call:fetch", "location": {"script_key": "scr_7018ff4f67e0c4ed6b3dac4327a6b576ee06329d145c24085435f4f363d7db49", "line": 3,

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
