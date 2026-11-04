# Linha de base (Fase 0)

Medido em 02/11/2026, servidor local (`python -m http.server`), sem throttling, painel do navegador do app. Em rede real os tempos sobem; o peso não muda.

## Carga inicial (abre direto no 3D)
- 27 requisições, **6,6 MB** transferidos. JPG 6,2 MB, JS 0,26 MB, PNG 0,13 MB.
- `DOMContentLoaded` 390 ms, `load` 730 ms (local, não representa rede).
- Mensagem "Montando o relevo…" ainda visível no momento da leitura (`v3msg`).

## Maiores itens no boot
| Arquivo | KB |
|---|---|
| media/render-tex.jpg (textura do 3D) | 2384 |
| media/render-2x.jpg | 1597 |
| media/render.jpg | 593 |
| three.module.js (CDN jsDelivr) | 255 |
| media/hi/m-bm-sauna.jpg | 217 |
| media/relief/height.png | 125 |

## Achados
- No boot o 2D baixa `render.jpg` e `render-2x.jpg` mesmo com o 3D ativo. O 3D baixa `render-tex.jpg` por cima. São 3 imagens do mesmo render (~4,6 MB).
- Cerca de 20 miniaturas de fichas e experiências (`x-*`, `t-*`, `fac/*`, `hi/m-*`) carregam no boot sem estar visíveis (~1,6 MB).
- Three.js e OrbitControls vêm do CDN; a fonte vem do Google Fonts.
- Os tiles `render-4x-*` (4,6 MB) só carregam com zoom. Vídeos só carregam ao abrir.

## Não medido (pendente)
- FPS do 3D parado e em movimento, tempo de long tasks, memória. O painel do navegador oculto pausa o `requestAnimationFrame`; precisa de janela visível.
- Testes com throttling (4G) e em celular real.
- Tempo até o 3D ficar pronto em aparelho fraco.

## Tamanho total dos assets
233 MB, 373 arquivos. Vídeos ~120 MB.

## Depois da Fase 1 (02/11/2026)
Medido no mesmo painel (usa `render-tex`, não `render-full`). A segunda leitura veio em parte do cache do navegador, então só a primeira vale como comparação.
- Boot a frio: 31 requisições, **3,1 MB** (antes 6,6 MB), com Three.js ainda no CDN.
- Abre no 2D com placeholder embutido (508 bytes) e `render.webp` (502 KB). O 3D sobe em segundo plano e troca quando está pronto.
- `render-2x` não carrega mais enquanto o 3D vai subir. Ao voltar ao 2D, ele carrega.
- Zero requisições externas (fontes e Three.js agora em `vendor/`). O Three.js min tem 670 KB sem compressão; o host comprime.
- Em desktop com GPU forte o 3D usa `render-full.webp` (2,7 MB, antes 4,6 MB em JPG).
- Pendente: FPS e teste com throttling.

## Depois da Fase 2 (02/11/2026)
- Mapa de sombras (4096² no desktop) deixa de ser refeito todo frame: só quando o sol muda (`light3D`). Verificado: a flag liga ao trocar a luz e desliga após o render.
- Câmera parada: 30 fps (pulso e mar). Em movimento, tween ou seleção: frame completo. Pins só são reposicionados quando a câmera se move, a janela muda ou a seleção muda.
- `declutter` lê todos os tamanhos antes de escrever (sem reflow por pin).
- Pixel ratio no celular 1,75 → 1,5.
- Renderização conferida por screenshot (3D, pins, sombras, troca de luz, voo até a casa).
- Não medido: FPS e tempo de frame. O painel de teste não entrega `requestAnimationFrame` de forma contínua; medir em janela/celular real.
