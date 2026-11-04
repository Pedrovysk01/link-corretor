import { MATERIALS as M } from '../materials'
import { Block, Cylinder, type PieceProps } from './primitives'

const COUNTER = 0.9
const WORKTOP = 0.04

/** Base units against a wall. The back of the run is at -z. */
export function KitchenRun({ size = [4, 0.65] }: PieceProps) {
  const [length, depth] = size
  return (
    <group>
      <Block size={[length, 0.1, depth - 0.06]} at={[0, 0, 0.03]} material={M.black} />
      <Block size={[length, COUNTER - WORKTOP - 0.1, depth]} at={[0, 0.1, 0]} material={M.cabinet} />
      <Block size={[length + 0.02, WORKTOP, depth + 0.02]} at={[0, COUNTER - WORKTOP, 0]} material={M.stone} />
      <Block size={[0.7, 0.01, 0.4]} at={[-length / 4, COUNTER, 0]} material={M.metal} radius={0.004} />
      <Block size={[0.75, 0.01, 0.5]} at={[length / 4, COUNTER, 0]} material={M.black} />
      <Cylinder radius={0.015} height={0.35} at={[-length / 4, COUNTER, -depth / 2 + 0.08]} material={M.brass} />
    </group>
  )
}

/** Waterfall-edge island with three bar stools along its +z side. */
export function Island({ size = [3, 1] }: PieceProps) {
  const [length, depth] = size
  const stools = [-length / 3, 0, length / 3]
  return (
    <group>
      <Block size={[length - 0.1, COUNTER - WORKTOP, depth - 0.15]} at={[0, 0, -0.05]} material={M.cabinet} />
      <Block size={[length, WORKTOP, depth]} at={[0, COUNTER - WORKTOP, 0]} material={M.stone} />
      <Block size={[0.04, COUNTER, depth]} at={[-length / 2 + 0.02, 0, 0]} material={M.stone} />
      <Block size={[0.04, COUNTER, depth]} at={[length / 2 - 0.02, 0, 0]} material={M.stone} />
      {stools.map((x) => (
        <group key={x} position={[x, 0, depth / 2 + 0.35]}>
          <Cylinder radius={0.2} height={0.06} at={[0, 0.68, 0]} material={M.fabricLight} />
          <Cylinder radius={0.02} height={0.68} at={[0, 0, 0]} material={M.brass} />
          <Cylinder radius={0.18} height={0.02} at={[0, 0, 0]} material={M.brass} />
        </group>
      ))}
    </group>
  )
}
