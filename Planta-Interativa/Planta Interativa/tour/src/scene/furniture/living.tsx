import { MATERIALS as M } from '../materials'
import { Block, Cylinder, type PieceProps } from './primitives'

const LEG = 0.1
const SEAT = 0.42
const SOFT = 0.06

/** Low modern sofa with deep seat cushions and scatter cushions. Its back is at -z. */
export function Sofa({ size = [2.2, 0.9] }: PieceProps) {
  const [length, depth] = size
  const seats = Math.max(1, Math.round((length - 0.3) / 0.9))
  const seatWidth = (length - 0.3) / seats
  return (
    <group>
      <Block size={[length, SEAT - LEG - 0.12, depth]} at={[0, LEG, 0]} material={M.fabric} radius={0.03} />
      {Array.from({ length: seats }, (_, i) => (
        <Block
          key={i}
          size={[seatWidth - 0.02, 0.16, depth - 0.24]}
          at={[-length / 2 + 0.15 + seatWidth * (i + 0.5), SEAT - 0.14, 0.1]}
          material={M.fabric}
          radius={SOFT}
        />
      ))}
      <Block size={[length, 0.48, 0.22]} at={[0, SEAT - 0.14, -depth / 2 + 0.11]} material={M.fabric} radius={SOFT} />
      <Block size={[0.15, 0.3, depth]} at={[-length / 2 + 0.075, SEAT - 0.14, 0]} material={M.fabric} radius={SOFT} />
      <Block size={[0.15, 0.3, depth]} at={[length / 2 - 0.075, SEAT - 0.14, 0]} material={M.fabric} radius={SOFT} />
      <Block size={[0.42, 0.38, 0.14]} at={[-length / 2 + 0.45, SEAT + 0.02, -depth / 2 + 0.3]} rotation={[-0.2, 0, 0]} material={M.cushion} radius={0.06} />
      <Block size={[0.42, 0.38, 0.14]} at={[length / 2 - 0.45, SEAT + 0.02, -depth / 2 + 0.3]} rotation={[-0.2, 0, 0]} material={M.boucle} radius={0.06} />
      <Block size={[length - 0.12, LEG, depth - 0.12]} at={[0, 0, 0]} material={M.woodDark} />
    </group>
  )
}

/** Boucle lounge chair. */
export function Armchair() {
  return (
    <group>
      <Block size={[0.85, 0.32, 0.85]} at={[0, 0.08, 0]} material={M.boucle} radius={0.1} />
      <Block size={[0.85, 0.42, 0.22]} at={[0, 0.34, -0.31]} material={M.boucle} radius={0.1} />
      <Block size={[0.16, 0.24, 0.85]} at={[-0.345, 0.34, 0]} material={M.boucle} radius={0.08} />
      <Block size={[0.16, 0.24, 0.85]} at={[0.345, 0.34, 0]} material={M.boucle} radius={0.08} />
      <Block size={[0.7, 0.08, 0.7]} at={[0, 0, 0]} material={M.woodDark} />
    </group>
  )
}

/** Travertine block coffee table with a sculptural vase. */
export function CoffeeTable() {
  return (
    <group>
      <Block size={[1.3, 0.06, 0.7]} at={[0, 0.34, 0]} material={M.travertine} radius={0.02} />
      <Block size={[0.9, 0.34, 0.45]} at={[0, 0, 0]} material={M.travertine} radius={0.02} />
      <Cylinder radius={0.07} radiusTop={0.04} height={0.24} at={[0.32, 0.4, 0.08]} material={M.ceramic} />
      <Block size={[0.3, 0.04, 0.22]} at={[-0.25, 0.4, -0.05]} material={M.woodDark} radius={0.01} />
    </group>
  )
}

export function Rug({ size = [3, 2] }: PieceProps) {
  return <Block size={[size[0], 0.012, size[1]]} at={[0, 0.001, 0]} material={M.rug} radius={0.005} />
}

/** Fiddle-leaf style plant in a stone planter. */
export function Plant() {
  return (
    <group>
      <Cylinder radius={0.2} radiusTop={0.24} height={0.48} at={[0, 0, 0]} material={M.pot} />
      <Cylinder radius={0.02} height={0.8} at={[0, 0.45, 0]} material={M.woodDark} />
      {[
        [0, 1.05, 0, 0.34],
        [0.16, 1.38, -0.06, 0.24],
        [-0.14, 1.28, 0.1, 0.22],
        [0.05, 1.62, 0.04, 0.17],
      ].map(([x, y, z, r]) => (
        <mesh key={`${x}${y}`} position={[x, y, z]} material={y > 1.3 ? M.foliage : M.foliageDark} castShadow>
          <icosahedronGeometry args={[r, 2]} />
        </mesh>
      ))}
    </group>
  )
}

/** Arc floor lamp with a warm glowing shade. */
export function FloorLamp() {
  return (
    <group>
      <Cylinder radius={0.16} height={0.03} at={[0, 0, 0]} material={M.brass} />
      <Cylinder radius={0.012} height={1.55} at={[0, 0.03, 0]} material={M.brass} />
      <Cylinder radius={0.2} radiusTop={0.12} height={0.24} at={[0, 1.5, 0]} material={M.lampShade} />
    </group>
  )
}

/** Framed abstract canvas hung with its back at -z. `size` is [width, height]. */
export function Artwork({ size = [1.2, 0.9] }: PieceProps) {
  const [width, height] = size
  return (
    <group position={[0, 1.55 - height / 2, -0.03]}>
      <Block size={[width + 0.06, height + 0.06, 0.04]} at={[0, -0.03, 0]} material={M.woodDark} />
      <mesh position={[0, height / 2, 0.021]} material={M.artwork}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  )
}

/** Pendant light hanging from the ceiling over islands and tables. */
export function Pendant() {
  return (
    <group>
      <Cylinder radius={0.004} height={0.9} at={[0, 2.1, 0]} material={M.black} />
      <mesh position={[0, 2.05, 0]} material={M.brass} castShadow>
        <sphereGeometry args={[0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 2.02, 0]} material={M.lampShade}>
        <sphereGeometry args={[0.06, 16, 8]} />
      </mesh>
    </group>
  )
}
