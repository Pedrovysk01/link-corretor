# REA no navegador — o que cada projeto faz em execução

Segunda rodada do [REA](https://github.com/morluto/rea) (a primeira, estática, está em [`../README.md`](../README.md)).
Aqui o REA se conectou por CDP a um **Chrome headless** (porta 9222, perfil temporário) com cada app **rodando**, e para
cada um fez duas coisas, sem clicar em nada:

- `inspect-web-page`: o que a página de fato carregou (scripts, imagens, mídia), DOM e acessibilidade, console, storage.
- `analyze-web-bundle`: parse inerte dos scripts **realmente entregues ao navegador** (chunks, arestas, inferências de
  bundler/biblioteca, candidatos a rota/endpoint).

Resumo por app em `docs/rea/web/<id>.md`; bruto em `.ds-audit/rea/web/` (fora do git). Reproduzir:
`python .ds-audit/rea/run-rea-web.py [id…]` com o Chrome aberto em `--remote-debugging-port=9222` e os apps no ar.

## Índice comparativo (18 alvos)

| Alvo | Recursos (KB declarados) | Scripts | Nós DOM / a11y | Bundler · libs (inferência REA) |
| --- | --- | --- | --- | --- |
| **montemerano-tour** (nosso) | 24 (**30 293**) | 63 módulos ES | 228 / 346 | Vite · React |
| **montemerano-360** (nosso) | 36 (5 989) | 2 | 262 / 159 | vanilla (cloudimage) |
| **montemerano-fachada** (nosso) | 3 (391) | 1 | 201 / 185 | vanilla |
| **bossa** (nosso) | 37 (2 143) | 16 módulos ES | 1 142 / 427 | vanilla (three vendorizado) |
| **felicita** (nosso) | 15 (4 016) | 8 (1 c/ source map) | 521 / 56 | vanilla (MapLibre) |
| **painel** (nosso) | 10 (307) | 4 | 71 / 32 | vanilla |
| wilsouza | 24 (**31 769**) | 52 módulos ES | 1 007 / 1 252 | Vite · React |
| real-estate-virtual-tour | 23 (30 218) | 57 módulos ES | 226 / 347 | Vite · React |
| scrollspire | 19 (9 118) | 54 (19 c/ source map) | 1 079 / 646 | Vite · React |
| 3d-real-estate-viewer | 20 (9 390) | 38 (12 c/ source map) | 713 / 212 | Vite · React (+ react-router avisos) |
| roam-3d | 30 (6 111) | 8 módulos ES | 419 / 87 | vanilla (three) |
| arven | 24 (2 000) | 24 (5 c/ source map) | 1 784 / 1 657 | Vite |
| serica | 4 (1 753) | 8 (3 c/ source map) | 291 / 303 | Vite · **10 erros GLTFLoader + RGBELoader** |
| sunlight-simulator | 13 (854) | 10 | 481 / 234 | vanilla + worker |
| reflexion | 3 (291) | 4 | 34 / 4 | Vite · React (tela branca sem chave) |
| easy-house | 26 (152) | 26 | 1 134 / 1 212 | vanilla |
| apartment3d | 2 (75) | 1 | 263 / 108 | vanilla |
| sims-builder | 2 (71) | 28 | 824 / 407 | **webpack · Next.js** · React |

"Recursos" são os itens da árvore de recursos da página no momento da observação (scripts, imagens, documentos). Os três
apps grandes (tour, wilsouza, virtual-tour) estavam em **modo dev do Vite**: módulos individuais em vez de um bundle;
em produção viram 2–3 chunks (o `dist/` do tour que o painel serve).

## O que isso diz que a análise estática não dizia

1. **Peso real.** Tour do Montemerano, wilsouza e virtual-tour carregam ~30 MB cada — a mesma ordem de grandeza, porque
   os três trazem three.js + drei + postprocessing inteiros. Os vanilla (Bossa 2 MB, 360 6 MB, fachada 0,4 MB, easy-house
   0,15 MB) carregam 5–200× menos. **Para o cliente no celular, a fachada por andar e o 360 abrem na hora; o tour 3D não.**
   Vale manter o tour como aprofundamento, não como porta de entrada.
2. **O que o Bossa carrega de verdade:** 6 JPG + 1 WebP — o render aéreo e as fotos; nada de modelo 3D. A "Visão 3D"
   dele é o render inclinado com relevo. Este é o motivo de ele parecer mais nítido que o satélite do Montemerano.
3. **O Felicità carrega 3 renders da torre (manhã/tarde/noite), 2 heróis e a planta do lazer** — o "sol" é troca de imagem,
   não iluminação calculada; o cálculo solar só move o texto e a sombra desenhada.
4. **serica está quebrado em execução:** 10 erros do GLTFLoader e aviso do RGBELoader — os modelos e o HDRI não
   carregam (caminhos relativos errados ou assets ausentes no clone). A análise estática não via isso.
5. **3d-real-estate-viewer** emite avisos do react-router em carga; **reflexion** renderiza 34 nós DOM (tela branca sem a
   chave do Gemini), confirmando a triagem anterior.
6. **Storage:** só apartment3d, easy-house e sims-builder gravam no `localStorage` (estado do editor). Nenhum app de
   referência tem rede após o carregamento (0 pedidos na janela observada): são estáticos; o nosso painel é a exceção,
   com `/api/*` (fora deste recorte, que mediu só a tela de login).
7. **Candidatos a endpoint:** quase todos de confiança baixa e são nomes de *uniforms* de shader (`uColor`,
   `noiseScale`…), não URLs — foram omitidos dos resumos. Não há API externa escondida em nenhum dos 13 de referência.

## Limites desta rodada

- A rede só é observada **depois** do carregamento (o REA avisa `prior_activity_available: false`), então modelos `.glb`
  e HDRI pedidos durante o load aparecem apenas quando ficam na árvore de recursos; a lista de "assets 3D" é incompleta.
- `--include-json-body-shapes` trava em páginas com canvas contínuo; ficou fora. `--allowed-origins` não aceita
  `127.0.0.1:porta` pelo `npx.cmd`; o REA usou a origem do próprio alvo, o que dá no mesmo.
- Bossa e Felicità foram observados servidos direto das pastas (8117/8118), porque `/pre/<id>/` do painel exige login
  e o Chrome headless caía na tela de login (401). Isso também significa que o widget do painel (`embed.js`, `casca.js`)
  **não** estava injetado nessa observação.
- Headless com SwiftShader: WebGL funciona, mas sem GPU; tempos e qualidade de render não valem como medida.
