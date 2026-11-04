import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { MathUtils, type Group } from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import type { Property, Rect, Room } from '../../data/types'
import { planBounds } from '../../lib/geometry'
import { useActiveRoom, useTour } from '../../state/store'
import { CUTAWAY_SCALE, DAMPING } from '../constants'
import { MATERIALS } from '../materials'
import { WallMesh } from './WallMesh'

RectAreaLightUniformsLib.init()

const ROOF_THICKNESS = 0.32
const DOWNLIGHT_SPACING = 1.8
const DOWNLIGHT_RADIUS = 0.055
/** Warm 3000K-ish fill so interiors read as lit, not just sun-lit. */
const INTERIOR_LIGHT = '#ffe2bf'
const INTERIOR_LUX_PER_M2 = 0.035
const INTERIOR_MIN = 1.2
const INTERIOR_MAX = 2.6

const indoorRooms = (rooms: readonly Room[]) => rooms.filter((r) => r.kind !== 'outdoor')

/** Evenly spaced downlight positions across a room's ceiling. */
const downlightsFor = ({ rect }: Room): [number, number][] => {
  const nx = Math.max(1, Math.round(rect.w / DOWNLIGHT_SPACING))
  const nz = Math.max(1, Math.round(rect.d / DOWNLIGHT_SPACING))
  return Array.from({ length: nx * nz }, (_, i) => [
    rect.x + (rect.w * ((i % nx) + 0.5)) / nx,
    rect.z + (rect.d * (Math.floor(i / nx) + 0.5)) / nz,
  ])
}

function Ceilings({ rooms, height }: { readonly rooms: readonly Room[]; readonly height: number }) {
  const lights = useMemo(() => rooms.flatMap(downlightsFor), [rooms])
  return (
    <group>
      {rooms.map(({ id, rect }) => (
        <mesh key={id} position={[rect.x + rect.w / 2, height - 0.002, rect.z + rect.d / 2]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.ceiling}>
          <planeGeometry args={[rect.w, rect.d]} />
        </mesh>
      ))}
      <Instances limit={lights.length} material={MATERIALS.downlight}>
        <circleGeometry args={[DOWNLIGHT_RADIUS, 20]} />
        {lights.map(([x, z]) => (
          <Instance key={`${x}:${z}`} position={[x, height - 0.006, z]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
      </Instances>
    </group>
  )
}

/** The slab above: it shades the interior so sunlight falls through the windows as real patches. */
function Roof({ bounds, height }: { readonly bounds: Rect; readonly height: number }) {
  return (
    <mesh position={[bounds.x + bounds.w / 2, height + ROOF_THICKNESS / 2, bounds.z + bounds.d / 2]} material={MATERIALS.facade} castShadow receiveShadow>
      <boxGeometry args={[bounds.w, ROOF_THICKNESS, bounds.d]} />
    </mesh>
  )
}

/**
 * A soft ceiling-sized light in the room the visitor is standing in. It stays mounted (at zero
 * intensity in the overview) because adding or removing a light recompiles every lit shader.
 */
function InteriorLight({ height }: { readonly height: number }) {
  const room = useActiveRoom()
  const isLit = room !== null && room.kind !== 'outdoor'
  const { x, z, w, d } = room?.rect ?? { x: 0, z: 0, w: 1, d: 1 }
  return (
    <rectAreaLight
      position={[x + w / 2, height - 0.05, z + d / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      width={w * 0.85}
      height={d * 0.85}
      color={INTERIOR_LIGHT}
      intensity={isLit ? MathUtils.clamp(w * d * INTERIOR_LUX_PER_M2, INTERIOR_MIN, INTERIOR_MAX) : 0}
    />
  )
}

const roofBounds = (property: Property): Rect => {
  const covered = property.surroundings === 'skyline' ? property.rooms : indoorRooms(property.rooms)
  const b = planBounds(covered)
  const eave = property.surroundings === 'skyline' ? 0.25 : 0.5
  const southEave = property.surroundings === 'skyline' ? 0.25 : 1.4
  return { x: b.x - eave, z: b.z - eave, w: b.w + eave * 2, d: b.d + eave + southEave }
}

/**
 * Walls, ceilings and roof. In the overview everything drops to a dollhouse cutaway with the lid off;
 * stepping inside raises the walls and closes the ceiling.
 */
export function Structure({ property }: { readonly property: Property }) {
  const groupRef = useRef<Group>(null)
  const isInside = useTour((s) => s.mode === 'room')
  const indoor = useMemo(() => indoorRooms(property.rooms), [property])
  const roof = useMemo(() => roofBounds(property), [property])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    group.scale.y = MathUtils.damp(group.scale.y, isInside ? 1 : CUTAWAY_SCALE, DAMPING, delta)
  })

  return (
    <>
      <group ref={groupRef} scale={[1, CUTAWAY_SCALE, 1]}>
        {property.walls.map((wall) => (
          <WallMesh key={`${wall.from.join(',')}>${wall.to.join(',')}`} wall={wall} height={property.wallHeight} />
        ))}
        {isInside && <Ceilings rooms={indoor} height={property.wallHeight} />}
        {isInside && <Roof bounds={roof} height={property.wallHeight} />}
      </group>
      <InteriorLight height={property.wallHeight} />
    </>
  )
}
