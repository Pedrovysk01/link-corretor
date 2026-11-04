/** O filme de abertura: um take real do empreendimento por capítulo, controlado pela rolagem. */
export const FILM_BASE = `${import.meta.env.BASE_URL}film`

export interface FilmChapter {
  /** Nome do arquivo (sem extensão) em public/film/. */
  readonly shot: string
  readonly eyebrow: string
  readonly title: string
  readonly body: string
}

export const FILM_CHAPTERS: readonly FilmChapter[] = [
  {
    shot: 'shot-1-chegada',
    eyebrow: 'Villa Montemerano · Meia Praia, Itapema',
    title: 'Um novo jeito de viver em frente ao mar.',
    body: 'Apartamentos de até 128 m² com três suítes e um lazer completo no mesmo endereço.',
  },
  {
    shot: 'shot-2-noturna',
    eyebrow: 'Fachada',
    title: 'Chegue ao entardecer.',
    body: 'Uma arquitetura que acende com a cidade e recebe você com elegância.',
  },
  {
    shot: 'shot-3-lazer',
    eyebrow: 'Lazer completo',
    title: 'Luz sobre a água.',
    body: 'Piscina adulto e infantil, área gourmet, fire place, quadra, playground e pet place.',
  },
  {
    shot: 'shot-4-living',
    eyebrow: 'Por dentro',
    title: 'Espaço para respirar.',
    body: 'Living de 50 m² integrado à cozinha, painel ripado em madeira e vidro de piso a teto.',
  },
  {
    shot: 'shot-5-sacada',
    eyebrow: 'Vista para o mar',
    title: 'Caminhe por ele hoje.',
    body: 'Entre em cada ambiente em 3D e fale com a gente para receber o catálogo e a disponibilidade.',
  },
]

/** Exibido junto ao filme: imagens ilustrativas, sujeitas a alterações no projeto final. */
export const FILM_CREDIT = 'Imagens ilustrativas. Medidas e acabamentos sujeitos a confirmação do memorial descritivo.'
