import type { ComponentType } from 'react'
import { MathUtils } from 'three'
import type { FurnitureItem, FurnitureKind } from '../../data/types'
import { Bathtub, Shower, Toilet, Vanity } from './bath'
import { Bed, Desk, Wardrobe } from './bedroom'
import { Island, KitchenRun } from './kitchen'
import { DiningTable } from './dining'
import { Artwork, FloorLamp, Rug, Sofa } from './living'
import { Armchair, CoffeeTable, LoungeChair, Nightstand, Pendant, Plant, RoundCoffeeTable, Sideboard, Succulent } from './modelled'
import { GlassRailing, Lounger, OutdoorTable, Pergola, Pool } from './outdoor'
import { AccentWall, GlassCloset, SlatPanel } from './finishes'
import type { PieceProps } from './primitives'

const PIECES: Record<FurnitureKind, ComponentType<PieceProps>> = {
  sofa: Sofa,
  armchair: Armchair,
  coffeeTable: CoffeeTable,
  rug: Rug,
  diningTable: DiningTable,
  kitchenRun: KitchenRun,
  island: Island,
  bed: Bed,
  nightstand: Nightstand,
  wardrobe: Wardrobe,
  desk: Desk,
  bathtub: Bathtub,
  vanity: Vanity,
  shower: Shower,
  toilet: Toilet,
  plant: Plant,
  lounger: Lounger,
  outdoorTable: OutdoorTable,
  pool: Pool,
  glassRailing: GlassRailing,
  floorLamp: FloorLamp,
  artwork: Artwork,
  pendant: Pendant,
  pergola: Pergola,
  loungeChair: LoungeChair,
  roundCoffeeTable: RoundCoffeeTable,
  sideboard: Sideboard,
  succulent: Succulent,
  slatPanel: SlatPanel,
  accentWall: AccentWall,
  glassCloset: GlassCloset,
}

export function Furniture({ item, ceiling }: { readonly item: FurnitureItem; readonly ceiling: number }) {
  const Piece = PIECES[item.kind]
  return (
    <group position={[item.at[0], 0, item.at[1]]} rotation={[0, MathUtils.degToRad(item.rotation ?? 0), 0]}>
      <Piece size={item.size} ceiling={ceiling} />
    </group>
  )
}
