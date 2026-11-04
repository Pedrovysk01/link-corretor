# Tour 3D do Felicità — análise de adaptação do `real-estate-virtual-tour`

Origem: https://github.com/Muhsin48ahmed/real-estate-virtual-tour (demo: https://muhsin48ahmed.github.io/real-estate-virtual-tour/).
Cópia local: esta pasta (`tour/`), rodando em http://127.0.0.1:8116/?view=tour. Nada foi alterado ainda.

> **Licença:** o repositório **não tem arquivo LICENSE**. Sem licença explícita, o código é "todos os direitos reservados" do autor.
> Antes de usar em produção: pedir autorização ao autor (issue/e-mail) ou reescrever as partes copiadas. Os assets (texturas, HDRI, móveis) são CC0 do Poly Haven e podem ser usados livremente; a filmagem do intro é stock Pexels (licença Pexels, ok comercial).

## 1. Como o projeto funciona (o que importa para nós)

| Camada | Arquivo | O que faz | Reaproveitar? |
|---|---|---|---|
| **Dados da unidade** | `src/data/properties/*.ts`, `src/data/types.ts` | A planta inteira é **dados**: cômodos como retângulos (`rect` em metros), paredes (`walls` com portas/janelas/portas de correr), piso por cômodo (`oak`/`stone`/`tile`/`deck`), móveis por tipo e posição, ponto de vista de cada cômodo (`eye`/`look`), ordem do tour. | **Sim — é o coração.** Um novo arquivo `felicita-tipo-69.ts` descreve o apartamento tipo. |
| **Geometria gerada** | `src/scene/structure/*`, `lib/geometry.ts` | Paredes, vãos, vidros, tetos e pisos nascem do arquivo de dados. Não há modelo 3D do apartamento. | Sim, sem mexer. |
| **Materiais** | `scene/materials.ts`, `scene/scannedTextures.ts`, `scene/assets.ts` | PBR escaneado (albedo + normal + roughness) do Poly Haven: carvalho, mármore, reboco, azulejo, laminado, bouclé. Cor dos tecidos/reboco vem de paleta. | Sim; **trocar os IDs** pelos acabamentos do memorial do Felicità (porcelanato, laminado, pintura) — basta baixar outras texturas Poly Haven/ambientCG com o mesmo padrão de nomes. |
| **Móveis** | `scene/furniture/*`, `public/assets/models` | Mistura de modelos glTF CC0 (poltrona, mesa, luminária, plantas) e peças procedurais (cama, sofá, bancada, box). | Sim; adicionar peças que faltam (ex.: churrasqueira no terraço). |
| **Iluminação** | `scene/SceneLighting.tsx`, `scene/Effects.tsx` | HDRI real de céu + sol alinhado ao HDRI + sombras + N8AO + tone mapping Neutral. | Sim. Trocar o HDRI por um céu litorâneo e **orientar o sol conforme `PROJ.topoPlantaBearing`** (235°) para a luz bater certo nas sacadas. |
| **Entorno** | `scene/Surroundings.tsx` | `garden` (gramado + árvores) ou `skyline` (prédios genéricos ao redor). | Usar `skyline`; depois substituir pelo **satélite/relevo da cena Cidade** ou por um panorama 360 real da vista do andar. |
| **Câmera / tour** | `scene/CameraRig.tsx`, `lib/tour.ts`, `ui/FloorPlan.tsx`, `ui/SceneLabels.tsx` | Dollhouse → entra no cômodo a 1,6 m → rótulos nas portas → planta baixa clicável → tour guiado. Estado na URL (`?property=&room=`). | Sim, integral. É o que você gostou. |
| **Qualidade adaptativa** | `lib/quality.ts`, `TourCanvas.tsx` | 3 níveis (high/low/minimal), detecta celular e GPU por software. | Sim, integral. |
| **Filme de abertura** | `data/film.ts`, `ui/film/*`, `public/film/*` | Scroll "esfrega" 5 clipes com títulos editoriais. | Sim, **com os renders/vídeos do Felicità** no lugar do stock. |
| **Formulário de lead** | `inquiry/*`, `ui/inquiry/*` | POST JSON para endpoint, grava quais cômodos o visitante viu. | **Substituir** pelo lead do Link Corretor (Supabase `leads`, passando por `abuse_ok`) e pela IA que responde ao cliente. |
| **Marca** | `index.html`, `ui/TopBar.tsx`, `design-system/aurelia-estates/` | "Aurelia Estates", inglês, USD. | Trocar por Felicità/Vansin, pt-BR, BRL, tokens do nosso `design-system.html`. |

## 2. Plano de adaptação (ordem de execução)

1. **Apartamento tipo em dados** — escrever `src/data/properties/felicita-69.ts` a partir da planta cotada: sala/cozinha integrada, 2 dormitórios (1 suíte), banho, lavanderia, sacada com churrasqueira. Cada cômodo com `rect`, piso, 3–4 `features` do memorial, texto de venda e `view`.
2. **Acabamentos reais** — baixar texturas PBR equivalentes ao memorial (porcelanato do piso, laminado/porcelanato amadeirado dos quartos, revestimento dos banhos, pintura) e mapear em `assets.ts`/`materials.ts`. Se tivermos foto da amostra, gerar material via "foto → PBR" (3D AI Studio / Substance Sampler).
3. **Luz e vista** — HDRI de céu litorâneo (Poly Haven), sol orientado pelo `topoPlantaBearing`; entorno `skyline` por enquanto; depois panorama 360 da vista real do andar (drone) como fundo das janelas.
4. **Filme** — 5 capítulos com os renders existentes (`apresentacao/media/g01–g26`, `hero-dia/noite`) e, se houver, vídeo do empreendimento; textos em pt-BR.
5. **Marca e idioma** — Felicità · 402 Home Club · Vansin; BRL; preço a partir de `PROJ.precoBase`; fontes/cores do DS.
6. **Integração** — link na apresentação (`/pre/2/`) → tour; `?property=felicita&room=suite` compartilhável pelo corretor com o rastreio do Link Corretor; lead → Supabase.
7. **Peso** — `gltf-transform` (KTX2 + meshopt) nos modelos, texturas 1k; alvo < 8 MB no primeiro cômodo.
8. **Opcional / próximo nível** — lightmaps bakeados no Blender por cômodo (fotorrealismo), modo "foto 360" refinado por IA (Krea/Veras), decorado real via Gaussian splatting (Spark) quando existir.

## 3. O que a construtora precisa fornecer

Ver lista no chat (seção "O que preciso de você"). Sem os itens 1–3 o apartamento sai aproximado; sem o 4 os acabamentos ficam genéricos.
