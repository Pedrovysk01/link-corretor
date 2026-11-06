# Imagens dos cartões de métrica (painel → Resumo)

Cada cartão do Resumo tem uma foto horizontal no topo, em cinza, que acende em cores ao passar o mouse.
Sem o arquivo, o cartão aparece normal, sem foto (nada quebra).

**Onde colocar:** `painel/img/kpi/<nome>.jpg`
**Formato:** JPG, proporção **5:1**, **1600 × 320 px**, até ~150 KB (qualidade 80). O cartão mostra ~435 × 87 px no computador; 1600 px cobre telas retina.
**Composição:** o assunto principal na faixa do meio (a foto é cortada em tira), sem texto, sem logos, sem rostos conhecidos. Luz natural suave. Como aparece em cinza, precisa ter bom contraste.

| Arquivo | Cartão | Cena |
|---|---|---|
| `aberturas.jpg` | Aberturas da apresentação | Dedo tocando a tela de um celular, que mostra (desfocada) a apresentação de um prédio. |
| `voltaram.jpg` | Voltaram a abrir | Mão escrevendo num papel, calculadora e celular ao lado, como quem faz contas. |
| `atender.jpg` | Novos para atender | Corretor ao telefone, sorrindo, em mesa de escritório de imobiliária. |
| `clientes-novos.jpg` | Clientes novos | Aperto de mãos sobre a mesa com a maquete de um prédio ao fundo (cliente novo fechando contato). |

## Prompts (inglês, para Nano Banana / Midjourney / qualquer gerador)

Base: *wide panoramic 5:1 crop, candid editorial photograph, soft natural window light, shallow depth of field, warm neutral tones, Brazilian real estate office context, no text, no logos, subject centered in the middle horizontal band.*

- **aberturas:** `Close-up of a finger tapping a smartphone screen showing a blurred modern high-rise building presentation, hand and phone centered, soft daylight, shallow depth of field, ` + base
- **voltaram:** `Top-down view of a hand writing figures on a sheet of paper next to a calculator and a smartphone on a wooden desk, as if doing calculations, ` + base
- **atender:** `A smiling real estate agent on a phone call at an office desk, laptop and a small building model nearby, friendly and professional, ` + base
- **clientes-novos:** `Two hands shaking across a table with a small architectural building model in soft focus behind, welcoming new client, ` + base

Depois de colocar os arquivos, troque o `?v=1` por `?v=2` na linha `img/kpi/` do `painel.js` (cache).
