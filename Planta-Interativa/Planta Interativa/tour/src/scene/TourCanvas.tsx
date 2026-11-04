import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useState } from 'react'
import { planBounds } from '../lib/geometry'
import { chooseQuality, isSoftwareRenderer, stepDown, stepUp, type Quality } from '../lib/quality'
import { webglRendererName } from '../lib/webgl'
import type { FurnitureKind } from '../data/types'
import { useProperty, useTour } from '../state/store'
import { CameraRig } from './CameraRig'
import { FLOOR_TOP } from './constants'
import { Effects } from './Effects'
import { Furniture } from './furniture'
import { LabelProjector } from './LabelProjector'
import { RoomFloors } from './RoomFloors'
import { SceneLighting } from './SceneLighting'
import { Structure } from './structure/Structure'
import { Surroundings } from './Surroundings'

/** Wall-hung and ceiling-hung pieces would float above the cut-down walls in the dollhouse view. */
const HIDDEN_IN_CUTAWAY: ReadonlySet<FurnitureKind> = new Set(['artwork', 'pendant'])

const DPR_RANGE: Record<Quality, [number, number]> = { high: [1, 1.75], low: [0.75, 1], minimal: [0.5, 0.75] }

const initialQuality = (): Quality =>
  chooseQuality({
    isSoftware: isSoftwareRenderer(webglRendererName()),
    isCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
  })

export function TourCanvas({ onReady }: { readonly onReady: () => void }) {
  const property = useProperty()
  const bounds = useMemo(() => planBounds(property.rooms), [property])
  // The device's starting tier is also its ceiling: a recovering frame rate never climbs past it.
  const [ceiling] = useState<Quality>(initialQuality)
  const [quality, setQuality] = useState<Quality>(ceiling)
  const isInside = useTour((s) => s.mode === 'room')
  const cx = bounds.x + bounds.w / 2
  const cz = bounds.z + bounds.d / 2

  return (
    <Canvas
      className="tour-canvas"
      shadows="percentage"
      flat
      dpr={DPR_RANGE[quality]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 55, near: 0.05, far: 2000, position: [cx, 30, cz + 30] }}
      role="img"
      aria-label={`3D model of ${property.name}`}
      onCreated={onReady}
    >
      <PerformanceMonitor onDecline={() => setQuality(stepDown)} onIncline={() => setQuality((q) => stepUp(q, ceiling))} />
      {/* The sky, textures and models stream in; the loading screen covers the wait. */}
      <Suspense fallback={null}>
        <SceneLighting bounds={bounds} surroundings={property.surroundings} quality={quality} />

        <group key={property.id}>
        <Surroundings kind={property.surroundings} bounds={bounds} floorsBelow={property.floorsBelow} />
        <RoomFloors rooms={property.rooms} />
        <Structure property={property} />
        <group position={[0, FLOOR_TOP, 0]}>
          {property.rooms.flatMap((room) =>
            room.furniture
              .filter((item) => isInside || !HIDDEN_IN_CUTAWAY.has(item.kind))
              .map((item) => <Furniture key={`${room.id}-${item.kind}-${item.at.join(',')}`} item={item} ceiling={property.wallHeight - FLOOR_TOP} />),
          )}
        </group>
        </group>
      </Suspense>

      <CameraRig property={property} />
      <LabelProjector />
      <Effects quality={quality} />
    </Canvas>
  )
}
