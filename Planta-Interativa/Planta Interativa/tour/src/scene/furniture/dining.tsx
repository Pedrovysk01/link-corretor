import { MATERIALS as M } from '../materials'
import { DiningChairModel } from './modelled'
import { Block, Cylinder, type PieceProps } from './primitives'

function SimpleDiningChair() {
  return (
    <group>
      <Block size={[0.46, 0.07, 0.46]} at={[0, 0.44, 0]} material={M.fabricLight} radius={0.03} />
      <Block size={[0.46, 0.4, 0.05]} at={[0, 0.5, -0.2]} material={M.oak} radius={0.02} />
      {[-0.19, 0.19].flatMap((lx) =>
        [-0.19, 0.19].map((lz) => <Block key={`${lx}${lz}`} size={[0.03, 0.44, 0.03]} at={[lx, 0, lz]} material={M.oak} />),
      )}
    </group>
  )
}

function DiningChair({ x, z, turn }: { readonly x: number; readonly z: number; readonly turn: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      <DiningChairModel fallback={<SimpleDiningChair />} />
    </group>
  )
}

const CHAIR_PITCH = 0.65

/** Oak dining table with upholstered chairs down both long sides. */
export function DiningTable({ size = [2.4, 1] }: PieceProps) {
  const [length, depth] = size
  const perSide = Math.max(2, Math.floor(length / CHAIR_PITCH))
  const xs = Array.from({ length: perSide }, (_, i) => (i - (perSide - 1) / 2) * CHAIR_PITCH)
  return (
    <group>
      <Block size={[length, 0.05, depth]} at={[0, 0.72, 0]} material={M.oak} radius={0.015} />
      <Block size={[0.1, 0.72, depth - 0.3]} at={[-length / 2 + 0.3, 0, 0]} material={M.woodDark} />
      <Block size={[0.1, 0.72, depth - 0.3]} at={[length / 2 - 0.3, 0, 0]} material={M.woodDark} />
      <Cylinder radius={0.1} radiusTop={0.06} height={0.28} at={[0, 0.77, 0]} material={M.ceramic} />
      {xs.map((x) => (
        <DiningChair key={`n${x}`} x={x} z={-depth / 2 - 0.25} turn={0} />
      ))}
      {xs.map((x) => (
        <DiningChair key={`s${x}`} x={x} z={depth / 2 + 0.25} turn={Math.PI} />
      ))}
    </group>
  )
}

