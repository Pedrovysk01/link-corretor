import type { ReactNode } from 'react'
import type { ModelId } from '../assets'
import { MATERIALS as M } from '../materials'
import { ModelBoundary, ModelPiece, type Anchor } from '../models/ModelPiece'
import { preloadModels } from '../models/preload'
import { Armchair as SoftArmchair, CoffeeTable as BlockCoffeeTable, Pendant as SimplePendant, Plant as SimplePlant } from './living'
import { Nightstand as SimpleNightstand } from './bedroom'
import { Block, Cylinder, type PieceProps } from './primitives'

const VASE_SCALE = 0.8
const PENDANT_DIAMETER = 0.32

preloadModels([
  'mid_century_lounge_chair',
  'modern_arm_chair_01',
  'modern_coffee_table_01',
  'coffee_table_round_01',
  'dining_chair_02',
  'modern_wooden_cabinet',
  'modern_ceiling_lamp_01',
  'potted_plant_02',
  'potted_plant_04',
  'ceramic_vase_01',
  'side_table_01',
])

interface ModelledProps {
  readonly id: ModelId
  readonly fallback: ReactNode
  readonly fitLength?: number
  readonly anchor?: Anchor
  readonly ceiling?: number
  readonly children?: ReactNode
}

function Modelled({ fallback, ...model }: ModelledProps) {
  return (
    <ModelBoundary fallback={fallback}>
      <ModelPiece {...model} />
    </ModelBoundary>
  )
}

function Vase() {
  return (
    <group scale={VASE_SCALE}>
      <Modelled id="ceramic_vase_01" fallback={<Cylinder radius={0.07} radiusTop={0.04} height={0.24} at={[0, 0, 0]} material={M.ceramic} />} />
    </group>
  )
}

export function LoungeChair() {
  return <Modelled id="mid_century_lounge_chair" fallback={<SoftArmchair />} />
}

export function Armchair() {
  return <Modelled id="modern_arm_chair_01" fallback={<SoftArmchair />} />
}

export function CoffeeTable() {
  return (
    <Modelled id="modern_coffee_table_01" fitLength={1.3} fallback={<BlockCoffeeTable />}>
      <group position={[0.3, 0, 0.05]}>
        <Vase />
      </group>
    </Modelled>
  )
}

export function RoundCoffeeTable() {
  return (
    <Modelled id="coffee_table_round_01" fitLength={0.95} fallback={<BlockCoffeeTable />}>
      <Vase />
    </Modelled>
  )
}

/** Walnut sideboard with its back at -z and a vase on top. */
export function Sideboard({ size }: PieceProps) {
  const length = size?.[0] ?? 1.8
  return (
    <Modelled id="modern_wooden_cabinet" fitLength={length} fallback={<Block size={[length, 0.6, 0.45]} at={[0, 0, 0]} material={M.woodDark} />}>
      <group position={[length * 0.3, 0, 0]}>
        <Vase />
      </group>
    </Modelled>
  )
}

export function Plant() {
  return <Modelled id="potted_plant_02" fallback={<SimplePlant />} />
}

export function Succulent() {
  return <Modelled id="potted_plant_04" fallback={<SimplePlant />} />
}

/** Glass globe pendant hung from the ceiling. */
export function Pendant({ ceiling }: PieceProps) {
  return <Modelled id="modern_ceiling_lamp_01" fitLength={PENDANT_DIAMETER} anchor="ceiling" ceiling={ceiling} fallback={<SimplePendant />} />
}

/** Oak side table with a brass lamp on top. */
export function Nightstand() {
  return (
    <Modelled id="side_table_01" fitLength={0.5} fallback={<SimpleNightstand />}>
      <Cylinder radius={0.06} height={0.24} at={[0, 0, 0]} material={M.brass} />
      <Cylinder radius={0.15} radiusTop={0.11} height={0.2} at={[0, 0.24, 0]} material={M.lampShade} />
    </Modelled>
  )
}

/** Upholstered dining chair; its back is at -z. */
export function DiningChairModel({ fallback }: { readonly fallback: ReactNode }) {
  return <Modelled id="dining_chair_02" fallback={fallback} />
}
