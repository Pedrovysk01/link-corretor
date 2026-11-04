import { MATERIALS as M } from '../materials'
import { Block, Cylinder, type PieceProps } from './primitives'

/** Bed with its headboard at -z. `size` is [width, length]. */
export function Bed({ size = [1.8, 2.1] }: PieceProps) {
  const [width, length] = size
  const pillowWidth = width / 2 - 0.12
  return (
    <group>
      <Block size={[width + 0.1, 0.3, length]} at={[0, 0.05, 0]} material={M.woodDark} />
      <Block size={[width, 0.22, length - 0.06]} at={[0, 0.35, 0.02]} material={M.linen} radius={0.06} />
      <Block size={[width + 0.04, 0.07, length * 0.62]} at={[0, 0.53, length * 0.18]} material={M.linen} radius={0.035} />
      <Block size={[width + 0.08, 0.08, 0.5]} at={[0, 0.55, length / 2 - 0.4]} material={M.throw} radius={0.04} />
      <Block size={[pillowWidth, 0.16, 0.42]} at={[-width / 4, 0.55, -length / 2 + 0.32]} rotation={[-0.25, 0, 0]} material={M.linen} radius={0.07} />
      <Block size={[pillowWidth, 0.16, 0.42]} at={[width / 4, 0.55, -length / 2 + 0.32]} rotation={[-0.25, 0, 0]} material={M.linen} radius={0.07} />
      <Block size={[width / 3, 0.14, 0.14]} at={[0, 0.58, -length / 2 + 0.55]} material={M.cushion} radius={0.06} />
      <Block size={[width + 0.3, 1.15, 0.1]} at={[0, 0, -length / 2 - 0.05]} material={M.fabric} radius={0.04} />
    </group>
  )
}

export function Nightstand() {
  return (
    <group>
      <Block size={[0.5, 0.48, 0.4]} at={[0, 0.02, 0]} material={M.oak} radius={0.015} />
      <Cylinder radius={0.07} height={0.25} at={[0, 0.5, 0]} material={M.brass} />
      <Cylinder radius={0.16} radiusTop={0.12} height={0.2} at={[0, 0.75, 0]} material={M.lampShade} />
    </group>
  )
}

/** Full-height storage with its back at -z. */
export function Wardrobe({ size = [1.8, 0.6] }: PieceProps) {
  const [length, depth] = size
  const doors = Math.max(2, Math.round(length / 0.5))
  return (
    <group>
      <Block size={[length, 2.3, depth]} at={[0, 0, 0]} material={M.oak} />
      {Array.from({ length: doors - 1 }, (_, i) => (
        <Block key={i} size={[0.01, 2.2, 0.01]} at={[-length / 2 + ((i + 1) * length) / doors, 0.05, depth / 2]} material={M.woodDark} />
      ))}
    </group>
  )
}

/** Desk with its back at -z and a chair on the +z side. */
export function Desk() {
  return (
    <group>
      <Block size={[1.2, 0.04, 0.6]} at={[0, 0.72, 0]} material={M.oak} radius={0.01} />
      <Block size={[0.04, 0.72, 0.55]} at={[-0.56, 0, 0]} material={M.black} />
      <Block size={[0.04, 0.72, 0.55]} at={[0.56, 0, 0]} material={M.black} />
      <Block size={[0.34, 0.01, 0.24]} at={[-0.2, 0.76, 0]} material={M.metal} />
      <Cylinder radius={0.06} radiusTop={0.1} height={0.3} at={[0.4, 0.76, -0.12]} material={M.lampShade} />
      <group position={[0, 0, 0.55]}>
        <Block size={[0.48, 0.08, 0.46]} at={[0, 0.46, 0]} material={M.fabric} radius={0.03} />
        <Block size={[0.46, 0.45, 0.07]} at={[0, 0.53, 0.22]} material={M.fabric} radius={0.03} />
        <Cylinder radius={0.03} height={0.46} at={[0, 0, 0]} material={M.black} />
        <Cylinder radius={0.25} height={0.03} at={[0, 0, 0]} material={M.black} />
      </group>
    </group>
  )
}
