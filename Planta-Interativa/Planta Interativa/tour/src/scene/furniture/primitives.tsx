import { RoundedBox } from '@react-three/drei'
import type { Material } from 'three'
import type { Vec2 } from '../../data/types'

export type Vec3 = readonly [number, number, number]

/** Props every furniture piece receives. `size` is [length, depth] where the piece scales. */
export interface PieceProps {
  readonly size?: Vec2
  /** Ceiling height of the room, for pieces that hang. */
  readonly ceiling?: number
}

interface BlockProps {
  readonly size: Vec3
  /** [x, bottom, z]: the block's footprint centre and the height of its underside. */
  readonly at: Vec3
  readonly material: Material
  readonly rotation?: Vec3
  /** Corner radius in metres; upholstery and mattresses read as soft with a few centimetres. */
  readonly radius?: number
}

const ROUNDED_SEGMENTS = 3

/** A box positioned by its bottom face, which keeps furniture authoring in floor-relative terms. */
export function Block({ size, at, material, rotation, radius = 0 }: BlockProps) {
  const position: [number, number, number] = [at[0], at[1] + size[1] / 2, at[2]]
  if (radius > 0) {
    const safeRadius = Math.min(radius, size[0] / 2, size[1] / 2, size[2] / 2)
    return (
      <RoundedBox
        args={[size[0], size[1], size[2]]}
        radius={safeRadius}
        smoothness={ROUNDED_SEGMENTS}
        position={position}
        rotation={rotation}
        material={material}
        castShadow
        receiveShadow
      />
    )
  }
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  )
}

interface CylinderProps {
  readonly radius: number
  readonly height: number
  readonly at: Vec3
  readonly material: Material
  readonly radiusTop?: number
}

export function Cylinder({ radius, height, at, material, radiusTop = radius }: CylinderProps) {
  return (
    <mesh position={[at[0], at[1] + height / 2, at[2]]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[radiusTop, radius, height, 32]} />
    </mesh>
  )
}
