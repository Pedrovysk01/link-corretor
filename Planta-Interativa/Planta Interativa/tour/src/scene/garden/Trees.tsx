import { useMemo } from 'react'
import type { BufferGeometry, Material } from 'three'
import { seededRandom } from '../../lib/random'
import { MATERIALS } from '../materials'
import { CYPRESS_LEAVES, OLIVE_LEAVES, canopyGeometry, leafMaterial, type CanopyShape } from './foliage'

/** Olive canopy: a few overlapping clumps for a broad, broken crown. */
const OLIVE_CANOPY: readonly CanopyShape[] = [
  { cards: 260, cardSize: 0.9, radii: [1.7, 0.95, 1.6], centre: [0, 3, 0] },
  { cards: 120, cardSize: 0.8, radii: [1, 0.7, 1], centre: [0.9, 3.4, 0.4] },
  { cards: 120, cardSize: 0.8, radii: [1, 0.7, 0.9], centre: [-0.8, 3.3, -0.5] },
]

/** Cypress: one tall, tight column. */
const CYPRESS_CANOPY: readonly CanopyShape[] = [{ cards: 420, cardSize: 0.55, radii: [0.62, 3, 0.62], centre: [0, 3.9, 0] }]

interface TreeKit {
  readonly canopies: readonly BufferGeometry[]
  readonly leaves: Material
}

const OLIVE_VARIANTS = 2
let oliveKit: TreeKit | null = null
let cypressKit: TreeKit | null = null

/** Canopies are expensive to build, so each tree type is generated once and shared. */
const olive = (): TreeKit => {
  oliveKit ??= {
    canopies: Array.from({ length: OLIVE_VARIANTS }, (_, i) => canopyGeometry(OLIVE_CANOPY, 40 + i)),
    leaves: leafMaterial(OLIVE_LEAVES, 5),
  }
  return oliveKit
}

const cypress = (): TreeKit => {
  cypressKit ??= { canopies: [canopyGeometry(CYPRESS_CANOPY, 77)], leaves: leafMaterial(CYPRESS_LEAVES, 9) }
  return cypressKit
}

interface TreeProps {
  readonly x: number
  readonly z: number
  readonly scale: number
  readonly seed: number
}

/** A spreading olive tree: a leaning trunk, a few limbs and an airy silver-green crown. */
export function OliveTree({ x, z, scale, seed }: TreeProps) {
  const kit = olive()
  const { limbs, turn, variant } = useMemo(() => {
    const random = seededRandom(seed)
    const limbCount = 4
    return {
      turn: random() * Math.PI * 2,
      variant: Math.floor(random() * OLIVE_VARIANTS),
      limbs: Array.from({ length: limbCount }, (_, i) => ({
        angle: (i / limbCount) * Math.PI * 2 + random() * 0.6,
        tilt: 0.5 + random() * 0.35,
        length: 1.4 + random() * 0.5,
      })),
    }
  }, [seed])

  return (
    <group position={[x, 0, z]} scale={scale} rotation={[0, turn, 0]}>
      <mesh position={[0, 1, 0]} rotation={[0, 0, 0.08]} material={MATERIALS.bark} castShadow>
        <cylinderGeometry args={[0.13, 0.22, 2, 10]} />
      </mesh>
      {limbs.map((limb) => (
        <mesh
          key={limb.angle}
          position={[Math.cos(limb.angle) * 0.35, 2.3, Math.sin(limb.angle) * 0.35]}
          rotation={[Math.sin(limb.angle) * limb.tilt, 0, -Math.cos(limb.angle) * limb.tilt]}
          material={MATERIALS.bark}
          castShadow
        >
          <cylinderGeometry args={[0.05, 0.1, limb.length, 8]} />
        </mesh>
      ))}
      <mesh geometry={kit.canopies[variant]} material={kit.leaves} castShadow receiveShadow />
    </group>
  )
}

/** A tall Italian cypress. */
export function Cypress({ x, z, scale, seed }: TreeProps) {
  const kit = cypress()
  const turn = useMemo(() => seededRandom(seed)() * Math.PI * 2, [seed])
  return (
    <group position={[x, 0, z]} scale={scale} rotation={[0, turn, 0]}>
      <mesh position={[0, 0.5, 0]} material={MATERIALS.bark}>
        <cylinderGeometry args={[0.07, 0.1, 1, 8]} />
      </mesh>
      {/* A dark core keeps the column dense where light would otherwise show straight through. */}
      <mesh position={[0, 3.9, 0]} scale={[0.42, 2.7, 0.42]} material={MATERIALS.foliageDark}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <mesh geometry={kit.canopies[0]} material={kit.leaves} castShadow receiveShadow />
    </group>
  )
}
