import type { Material } from 'three'
import type { Opening } from '../../data/types'
import { DOOR_HEAD, SLIDER_HEAD, WINDOW_HEAD, WINDOW_SILL } from '../../lib/geometry'
import { MATERIALS } from '../materials'

const FRAME = 0.05
const ARCHITRAVE = 0.07
/** Widest pane before a mullion splits it. */
const MAX_WINDOW_PANE = 1.4
const MAX_SLIDER_PANEL = 2.2

interface OpeningDetailProps {
  readonly opening: Opening
  readonly thickness: number
}

function Box({ size, at, material }: { readonly size: readonly [number, number, number]; readonly at: readonly [number, number, number]; readonly material: Material }) {
  return (
    <mesh position={[at[0], at[1], at[2]]} material={material} castShadow receiveShadow>
      <boxGeometry args={[size[0], size[1], size[2]]} />
    </mesh>
  )
}

/** Flush white architraves framing an internal doorway. */
function DoorFrame({ width, thickness }: { readonly width: number; readonly thickness: number }) {
  const depth = thickness + 0.03
  return (
    <>
      <Box size={[ARCHITRAVE, DOOR_HEAD, depth]} at={[ARCHITRAVE / 2, DOOR_HEAD / 2, 0]} material={MATERIALS.skirting} />
      <Box size={[ARCHITRAVE, DOOR_HEAD, depth]} at={[width - ARCHITRAVE / 2, DOOR_HEAD / 2, 0]} material={MATERIALS.skirting} />
      <Box size={[width, ARCHITRAVE, depth]} at={[width / 2, DOOR_HEAD - ARCHITRAVE / 2, 0]} material={MATERIALS.skirting} />
    </>
  )
}

/** Slim bronze frames, mullions and glass for a window or sliding door. */
function Glazing({ width, bottom, top, maxPane, thickness }: { readonly width: number; readonly bottom: number; readonly top: number; readonly maxPane: number; readonly thickness: number }) {
  const panes = Math.max(1, Math.ceil(width / maxPane))
  const height = top - bottom
  const depth = thickness * 0.5
  const mullions = Array.from({ length: panes + 1 }, (_, i) => (i * width) / panes)
  return (
    <>
      <mesh position={[width / 2, bottom + height / 2, 0]} material={MATERIALS.glass}>
        <boxGeometry args={[width, height, 0.02]} />
      </mesh>
      <Box size={[width, FRAME, depth]} at={[width / 2, top - FRAME / 2, 0]} material={MATERIALS.frame} />
      <Box size={[width, FRAME, depth]} at={[width / 2, bottom + FRAME / 2, 0]} material={MATERIALS.frame} />
      {mullions.map((x) => (
        <Box key={x} size={[FRAME, height, depth]} at={[Math.min(Math.max(x, FRAME / 2), width - FRAME / 2), bottom + height / 2, 0]} material={MATERIALS.frame} />
      ))}
    </>
  )
}

/** Frames, glass and sills for one wall opening, in the wall's local space (x along the wall). */
export function OpeningDetail({ opening, thickness }: OpeningDetailProps) {
  const { kind, offset, width } = opening
  return (
    <group position={[offset, 0, 0]}>
      {kind === 'door' && <DoorFrame width={width} thickness={thickness} />}
      {kind === 'window' && (
        <>
          <Glazing width={width} bottom={WINDOW_SILL} top={WINDOW_HEAD} maxPane={MAX_WINDOW_PANE} thickness={thickness} />
          <Box size={[width + 0.1, 0.04, thickness + 0.08]} at={[width / 2, WINDOW_SILL - 0.02, 0]} material={MATERIALS.travertine} />
        </>
      )}
      {kind === 'slider' && <Glazing width={width} bottom={0} top={SLIDER_HEAD} maxPane={MAX_SLIDER_PANEL} thickness={thickness} />}
    </group>
  )
}
