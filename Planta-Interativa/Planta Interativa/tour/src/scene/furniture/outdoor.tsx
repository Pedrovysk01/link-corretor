import { useFrame } from '@react-three/fiber'
import { MATERIALS as M, WATER_NORMALS } from '../materials'
import { Block, Cylinder, type PieceProps } from './primitives'

const BACKREST_TILT = -0.6

/** Sun lounger, its backrest raised at -z. */
export function Lounger() {
  return (
    <group>
      <Block size={[0.7, 0.26, 1.9]} at={[0, 0.06, 0]} material={M.oak} radius={0.02} />
      <Block size={[0.64, 0.09, 1.3]} at={[0, 0.32, 0.27]} material={M.boucle} radius={0.04} />
      <Block size={[0.64, 0.09, 0.62]} at={[0, 0.42, -0.62]} rotation={[BACKREST_TILT, 0, 0]} material={M.boucle} radius={0.04} />
      <Block size={[0.06, 0.06, 0.06]} at={[-0.3, 0, -0.85]} material={M.oak} />
      <Block size={[0.06, 0.06, 0.06]} at={[0.3, 0, -0.85]} material={M.oak} />
      <Block size={[0.06, 0.06, 0.06]} at={[-0.3, 0, 0.85]} material={M.oak} />
      <Block size={[0.06, 0.06, 0.06]} at={[0.3, 0, 0.85]} material={M.oak} />
    </group>
  )
}

export function OutdoorTable() {
  const seats = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
  return (
    <group>
      <Cylinder radius={0.6} height={0.04} at={[0, 0.72, 0]} material={M.travertine} />
      <Cylinder radius={0.05} height={0.72} at={[0, 0, 0]} material={M.black} />
      {seats.map((angle) => (
        <group key={angle} position={[Math.sin(angle) * 0.85, 0, Math.cos(angle) * 0.85]} rotation={[0, angle + Math.PI, 0]}>
          <Block size={[0.48, 0.07, 0.48]} at={[0, 0.43, 0]} material={M.boucle} radius={0.03} />
          <Block size={[0.48, 0.4, 0.04]} at={[0, 0.49, -0.22]} material={M.oak} radius={0.015} />
          <Block size={[0.05, 0.44, 0.05]} at={[0, 0, 0]} material={M.black} />
        </group>
      ))}
    </group>
  )
}

const COPING = 0.3

/** Pool water with stone coping. `size` is the water's [length, width]. */
const RIPPLE_SPEED = 0.015

export function Pool({ size = [8, 3] }: PieceProps) {
  const [length, width] = size
  useFrame((_, delta) => {
    WATER_NORMALS.offset.x += delta * RIPPLE_SPEED
    WATER_NORMALS.offset.y += delta * RIPPLE_SPEED * 0.6
  })
  return (
    <group>
      <Block size={[length, 0.02, width]} at={[0, 0.002, 0]} material={M.water} />
      <Block size={[length + COPING * 2, 0.04, COPING]} at={[0, 0, -width / 2 - COPING / 2]} material={M.travertine} />
      <Block size={[length + COPING * 2, 0.04, COPING]} at={[0, 0, width / 2 + COPING / 2]} material={M.travertine} />
      <Block size={[COPING, 0.04, width]} at={[-length / 2 - COPING / 2, 0, 0]} material={M.travertine} />
      <Block size={[COPING, 0.04, width]} at={[length / 2 + COPING / 2, 0, 0]} material={M.travertine} />
    </group>
  )
}

export function GlassRailing({ size = [4, 0.05] }: PieceProps) {
  const [length] = size
  return (
    <group>
      <Block size={[length, 1.05, 0.02]} at={[0, 0, 0]} material={M.glass} />
      <Block size={[length, 0.04, 0.06]} at={[0, 1.05, 0]} material={M.metal} />
    </group>
  )
}

const PERGOLA_HEIGHT = 2.6
const SLAT_PITCH = 0.22

/** Timber pergola whose slats throw striped shade. `size` is [length, depth]. */
export function Pergola({ size = [4, 3] }: PieceProps) {
  const [length, depth] = size
  const slats = Math.floor(length / SLAT_PITCH)
  const posts = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => [(sx * (length - 0.12)) / 2, (sz * (depth - 0.12)) / 2] as const))
  return (
    <group>
      {posts.map(([x, z]) => (
        <Block key={`${x}${z}`} size={[0.12, PERGOLA_HEIGHT, 0.12]} at={[x, 0, z]} material={M.woodDark} />
      ))}
      <Block size={[length, 0.18, 0.1]} at={[0, PERGOLA_HEIGHT, -depth / 2 + 0.06]} material={M.woodDark} />
      <Block size={[length, 0.18, 0.1]} at={[0, PERGOLA_HEIGHT, depth / 2 - 0.06]} material={M.woodDark} />
      {Array.from({ length: slats }, (_, i) => (
        <Block key={i} size={[0.05, 0.14, depth]} at={[-length / 2 + SLAT_PITCH * (i + 0.5), PERGOLA_HEIGHT + 0.18, 0]} material={M.oak} />
      ))}
    </group>
  )
}
