import { MATERIALS as M } from '../materials'
import { Block, type PieceProps } from './primitives'

const SLAT = 0.04
const PITCH = 0.075

/** Painel ripado em madeira (parede da TV), do piso ao teto. `size` = [comprimento, profundidade]. */
export function SlatPanel({ size = [3, 0.1], ceiling = 2.7 }: PieceProps) {
  const [length, depth] = size
  const count = Math.floor(length / PITCH)
  const x0 = -((count - 1) * PITCH) / 2
  return (
    <group>
      <Block size={[length, ceiling, 0.02]} at={[0, 0, -depth / 2 + 0.01]} material={M.black} />
      {Array.from({ length: count }, (_, i) => (
        <Block key={i} size={[SLAT, ceiling, depth - 0.02]} at={[x0 + i * PITCH, 0, 0.01]} material={M.slat} />
      ))}
    </group>
  )
}

/** Parede de destaque: pintura verde sobre boiserie lateral baixa (suíte master). */
export function AccentWall({ size = [3.2, 0.04], ceiling = 2.7 }: PieceProps) {
  const [length, depth] = size
  const lower = 1.05
  const panels = Math.floor(length / 0.4)
  const w = length / panels
  return (
    <group>
      <Block size={[length, ceiling - lower, depth]} at={[0, lower, 0]} material={M.paintGreen} />
      {Array.from({ length: panels }, (_, i) => (
        <Block key={i} size={[w - 0.015, lower, depth + 0.012]} at={[-length / 2 + w * (i + 0.5), 0, 0]} material={M.boiserie} />
      ))}
    </group>
  )
}

/** Closet em vidro bronze com portas de correr e nichos internos. `size` = [comprimento, profundidade]. */
export function GlassCloset({ size = [2.6, 0.6], ceiling = 2.7 }: PieceProps) {
  const [length, depth] = size
  const h = ceiling - 0.25
  return (
    <group>
      <Block size={[length, h, depth]} at={[0, 0, 0]} material={M.bronzeGlass} />
      <Block size={[length - 0.1, 0.03, depth - 0.1]} at={[0, 0.9, 0]} material={M.woodDark} />
      <Block size={[length - 0.1, 0.03, depth - 0.1]} at={[0, 1.5, 0]} material={M.woodDark} />
      <Block size={[length - 0.1, 0.03, depth - 0.1]} at={[0, 2.1, 0]} material={M.woodDark} />
      <Block size={[0.04, h, depth + 0.02]} at={[-length / 2, 0, 0]} material={M.metal} />
      <Block size={[0.04, h, depth + 0.02]} at={[length / 2, 0, 0]} material={M.metal} />
      <Block size={[0.04, h, depth + 0.02]} at={[0, 0, 0]} material={M.metal} />
    </group>
  )
}
