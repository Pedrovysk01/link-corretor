import type { FurnitureItem, Property, Room, Wall } from '../types'
import { planBounds } from '../../lib/geometry'
import { apto01 } from './montemerano'

/**
 * Pavimento tipo do Villa Montemerano: duas plantas opostas por andar, espelhadas em torno do núcleo (escada e elevadores).
 * O Apto 01 (128,60 m²) é o desenho de `montemerano.ts`; o Apto 02 (116,57 m²) é o espelho dele, 9,4 % mais estreito
 * (116,57 ÷ 128,60), com os ambientes renomeados (prefixo `b-`). Os dois aparecem juntos no corte; o tour guiado segue o apartamento escolhido.
 */
const S = 116.57 / 128.6
const r3 = (n: number) => Math.round(n * 16) / 16 // múltiplos de 1/16 m (6 cm): somas exatas em ponto flutuante, ambientes vizinhos encostam sem "se sobrepor"
const mx = (x: number) => r3(-x * S)

const isZero = (n: number) => Math.abs(n) < 1e-9

// Valores de área que mudam do Apto 01 para o Apto 02 (planta "Tipo - A - 01"): troca em uma só passada.
const AREAS: Record<string, string> = {
  '14,75': '13,50', // suíte master
  '13,40': '11,20', // suíte 02
  '13,50': '11,60', // suíte 01
  '50,20': '45,56', // living
  '3,73': '3,46', // banhos da master e da suíte 02
  '3,30': '3,40', // banho da suíte 01
  '2,86': '2,80', // área de serviço
  '128,60': '116,57',
}
const trocaAreas = (s: string) => s.replace(new RegExp(Object.keys(AREAS).join('|'), 'g'), (m) => AREAS[m])

const espelhaMovel = (f: FurnitureItem): FurnitureItem => ({
  ...f,
  at: [mx(f.at[0]), f.at[1]],
  ...(f.rotation != null ? { rotation: -f.rotation } : {}),
})

const espelhaSala = (r: Room): Room => ({
  ...r,
  id: `b-${r.id}`,
  rect: { x: r3(-(r.rect.x + r.rect.w) * S), z: r.rect.z, w: r3(-r.rect.x * S) - r3(-(r.rect.x + r.rect.w) * S), d: r.rect.d },
  description: trocaAreas(r.description),
  features: r.features.map(trocaAreas),
  furniture: r.furniture.map(espelhaMovel),
  ...(r.view ? { view: { eye: [mx(r.view.eye[0]), r.view.eye[1]] as const, look: [mx(r.view.look[0]), r.view.look[1]] as const } } : {}),
})

const espelhaParede = (w: Wall): Wall => {
  const horizontal = w.from[1] === w.to[1]
  return {
    ...w,
    from: [mx(w.from[0]), w.from[1]],
    to: [mx(w.to[0]), w.to[1]],
    ...(w.openings ? { openings: w.openings.map((o) => (horizontal ? { ...o, offset: r3(o.offset * S), width: r3(o.width * S) } : o)) } : {}),
  }
}

// Apto 01: a parede x = 0 (sem janelas) e o recorte do núcleo viram paredes internas do pavimento.
const paredesApto01: Wall[] = apto01.walls.map((w) => {
  const noEixo = isZero(w.from[0]) && isZero(w.to[0])
  const nucleo = w.exterior && ((w.from[1] === 4.4 && w.to[1] === 4.4) || (w.from[0] === 1.9 && w.to[0] === 1.9) || (w.from[1] === 12 && w.to[1] === 12))
  if (noEixo) return { from: w.from, to: w.to }
  if (nucleo) return { ...w, exterior: false }
  return w
})
const paredesApto02: Wall[] = apto01.walls.map(espelhaParede).filter((w) => !(isZero(w.from[0]) && isZero(w.to[0])))

const nucleo: Room = {
  id: 'nucleo',
  name: 'Escada e elevadores',
  kind: 'hall',
  rect: { x: r3(-1.9 * S), z: 4.4, w: 1.9 - r3(-1.9 * S) - 0.001, d: 7.6 }, // termina 1 mm antes da circulação do Apto 01
  floor: 'stone',
  description: 'Núcleo do pavimento: escada e dois elevadores, entre os dois apartamentos.',
  features: ['Escada', 'Elevadores'],
  furniture: [],
}

const espelhadas = apto01.rooms.map(espelhaSala)
const focoApto01 = planBounds(apto01.rooms)
const focoApto02 = planBounds(espelhadas)
const salas: Room[] = [...apto01.rooms, nucleo, ...espelhadas]
const paredes: Wall[] = [...paredesApto01, ...paredesApto02]

const base: Omit<Property, 'id' | 'name' | 'shortName' | 'tagline' | 'tour' | 'area'> = {
  type: 'Apartment',
  location: apto01.location,
  priceFrom: 0,
  currency: 'BRL',
  completion: 'A confirmar',
  bedrooms: 3,
  bathrooms: 4,
  wallHeight: apto01.wallHeight,
  surroundings: 'cidade',
  floorsBelow: 14,
  cover: apto01.cover,
  rooms: salas,
  walls: paredes,
}

const passagensEspelhadas = (apto01.passages ?? []).map((p) => ({ a: `b-${p.a}`, b: `b-${p.b}`, at: [mx(p.at[0]), p.at[1]] as const }))

export const montemerano01: Property = {
  ...base,
  id: 'montemerano-01',
  name: 'Villa Montemerano · Apto 01',
  shortName: 'Apto 01',
  tagline: 'Três suítes, living integrado de 50 m² e sacada gourmet de canto com vista para o mar.',
  tour: apto01.tour,
  area: 128.6,
  focus: focoApto01,
  passages: apto01.passages,
}

export const montemerano02: Property = {
  ...base,
  id: 'montemerano-02',
  name: 'Villa Montemerano · Apto 02',
  shortName: 'Apto 02',
  tagline: 'Três suítes e living integrado de 45 m², na planta oposta do pavimento, com o mesmo padrão do Apto 01.',
  tour: apto01.tour.map((id) => `b-${id}`),
  area: 116.57,
  focus: focoApto02,
  passages: passagensEspelhadas,
}
