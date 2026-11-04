import { MATERIALS as M } from '../materials'
import { Block, Cylinder, type PieceProps } from './primitives'

export function Bathtub() {
  return (
    <group>
      <Block size={[1.7, 0.56, 0.8]} at={[0, 0, 0]} material={M.ceramic} radius={0.12} />
      <Block size={[1.5, 0.012, 0.6]} at={[0, 0.55, 0]} material={M.water} radius={0.005} />
      <Cylinder radius={0.018} height={0.9} at={[0.95, 0, -0.25]} material={M.brass} />
    </group>
  )
}

/** Floating vanity with its back (and mirror) at -z. */
export function Vanity({ size = [1.4, 0.5] }: PieceProps) {
  const [length, depth] = size
  return (
    <group>
      <Block size={[length, 0.45, depth]} at={[0, 0.4, 0]} material={M.oak} />
      <Block size={[length, 0.04, depth]} at={[0, 0.85, 0]} material={M.stone} />
      <Block size={[0.45, 0.12, 0.35]} at={[0, 0.89, 0.02]} material={M.ceramic} radius={0.05} />
      <Cylinder radius={0.012} height={0.22} at={[0, 0.89, -depth / 2 + 0.07]} material={M.brass} />
      <Block size={[length * 0.9, 0.8, 0.02]} at={[0, 1.15, -depth / 2 + 0.02]} material={M.mirror} />
    </group>
  )
}

/** Shower tray with a glass screen on its +z side and an overhead rain head. */
export function Shower() {
  return (
    <group>
      <Block size={[0.9, 0.04, 0.9]} at={[0, 0, 0]} material={M.travertine} />
      <Block size={[0.9, 2, 0.01]} at={[0, 0.04, 0.45]} material={M.glass} />
      <Block size={[0.02, 2, 0.02]} at={[0.44, 0.04, 0.45]} material={M.brass} />
      <Cylinder radius={0.15} height={0.02} at={[0, 2.1, 0]} material={M.brass} />
    </group>
  )
}

/** Toilet with its cistern at -z. */
export function Toilet() {
  return (
    <group>
      <Block size={[0.38, 0.4, 0.52]} at={[0, 0, 0.05]} material={M.ceramic} radius={0.12} />
      <Block size={[0.4, 0.34, 0.16]} at={[0, 0.4, -0.2]} material={M.ceramic} radius={0.04} />
    </group>
  )
}
