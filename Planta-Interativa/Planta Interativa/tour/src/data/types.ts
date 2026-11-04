/** A point on the floor plan in metres: [x, z]. +x is east, +z is south. */
export type Vec2 = readonly [number, number]

export type OpeningKind = 'door' | 'window' | 'slider'

export interface Opening {
  readonly kind: OpeningKind
  /** Distance in metres from the wall's `from` point to the opening's near edge. */
  readonly offset: number
  readonly width: number
}

export interface Wall {
  readonly from: Vec2
  readonly to: Vec2
  readonly exterior?: boolean
  readonly openings?: readonly Opening[]
}

export interface Rect {
  readonly x: number
  readonly z: number
  readonly w: number
  readonly d: number
}

export type RoomKind = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'hall' | 'study' | 'outdoor'

export type FloorFinish = 'oak' | 'stone' | 'tile' | 'deck' | 'grass'

export type FurnitureKind =
  | 'sofa'
  | 'armchair'
  | 'coffeeTable'
  | 'rug'
  | 'diningTable'
  | 'kitchenRun'
  | 'island'
  | 'bed'
  | 'nightstand'
  | 'wardrobe'
  | 'desk'
  | 'bathtub'
  | 'vanity'
  | 'shower'
  | 'toilet'
  | 'plant'
  | 'lounger'
  | 'outdoorTable'
  | 'pool'
  | 'glassRailing'
  | 'floorLamp'
  | 'artwork'
  | 'pendant'
  | 'pergola'
  | 'loungeChair'
  | 'roundCoffeeTable'
  | 'sideboard'
  | 'succulent'
  | 'slatPanel'
  | 'accentWall'
  | 'glassCloset'

export interface FurnitureItem {
  readonly kind: FurnitureKind
  readonly at: Vec2
  /** Degrees around the vertical axis. At 0 the piece faces +z (south). */
  readonly rotation?: number
  /** [length, depth] in metres for pieces that scale (rugs, counters, pools). */
  readonly size?: Vec2
}

export interface RoomView {
  readonly eye: Vec2
  readonly look: Vec2
}

export interface Room {
  readonly id: string
  readonly name: string
  readonly kind: RoomKind
  readonly rect: Rect
  readonly floor: FloorFinish
  /** Render ilustrativo do ambiente, relativo a public/ (ex.: 'img/living-estar.webp'). Opcional. */
  readonly image?: string
  /** Vários renders do MESMO ambiente (carrossel no painel). Se existir, vale no lugar de `image`. */
  readonly images?: readonly string[]
  readonly description: string
  readonly features: readonly string[]
  readonly furniture: readonly FurnitureItem[]
  readonly view?: RoomView
}

export type Surroundings = 'garden' | 'skyline' | 'cidade'

export interface Property {
  readonly id: string
  readonly name: string
  readonly shortName: string
  readonly type: 'Villa' | 'Apartment' | 'Lazer'
  readonly tagline: string
  readonly location: string
  readonly priceFrom: number
  readonly currency: string
  readonly completion: string
  readonly bedrooms: number
  readonly bathrooms: number
  readonly wallHeight: number
  readonly surroundings: Surroundings
  /** Com `cidade`: pavimentos entre o piso mostrado e o pódio (torre real com a fachada). */
  readonly floorsBelow?: number
  /** Imagem de capa do empreendimento, relativa a public/. Opcional. */
  readonly cover?: string
  readonly rooms: readonly Room[]
  readonly walls: readonly Wall[]
  /** Room ids in guided-tour order. The inquiry form follows the last stop. */
  readonly tour: readonly string[]
}
