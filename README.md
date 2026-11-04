# Link Corretor

Links rastreados por corretor para **apresentações 3D de empreendimentos**, com IA que responde ao cliente.

## Ver online (sem instalar nada)

**https://pedrovysk01.github.io/link-corretor/**

| Projeto | Link |
|---|---|
| Villa Montemerano (tour 3D + filme) | `/montemerano/` |
| Felicità · 402 Home Club | `/felicita/` |
| Bossa Eco Luxury Villas | `/bossa/` |
| Design system | `/painel/design-system.html` |

O site é publicado automaticamente a cada `push` na branch `master` (`.github/workflows/pages.yml`).

## Rodar no seu computador

- **Villa Montemerano:** dê dois cliques em `Planta-Interativa/Iniciar Montemerano.bat` (precisa do [Node.js 20+](https://nodejs.org)). Abre em http://localhost:5173/.
- **Felicità e Bossa:** `python tools/dev-server.py` → http://localhost:8090/pre/1/ (Bossa) e http://localhost:8090/pre/2/ (Felicità).

## Adicionar imagens e ambientes mantendo o padrão

Leia **[Planta-Interativa/GUIA-DE-CONTEUDO.md](Planta-Interativa/GUIA-DE-CONTEUDO.md)**: como converter renders, ligar uma imagem a um ambiente, criar um ambiente novo e quais regras de design seguir.

## Estrutura

```
Planta-Interativa/
  Planta Interativa/
    tour/           Tour 3D do Villa Montemerano (React + three.js)
    apresentacao/   Apresentação do Felicità (MapLibre + torre 3D)
    app/            Bossa (mapa interativo)
  GUIA-DE-CONTEUDO.md
painel/             Painel do corretor e design-system.html
tools/              Servidor local e utilitários
```

## Avisos

- Os renders e vídeos do Montemerano pertencem à construtora/incorporadora; use só com autorização.
- O código do tour é baseado em [real-estate-virtual-tour](https://github.com/Muhsin48ahmed/real-estate-virtual-tour) (Muhsin48ahmed), que **não declara licença**. Texturas, HDRI e móveis são CC0 do [Poly Haven](https://polyhaven.com). Antes de uso comercial, obtenha autorização do autor ou reescreva os trechos copiados.
