import { useMemo } from 'react'
import type { Rect } from '../data/types'
import { seededRandom } from '../lib/random'
import { Cypress, OliveTree } from './garden/Trees'
import { MATERIALS } from './materials'
import { ModelBoundary, ModelPiece } from './models/ModelPiece'
import { preloadModels } from './models/preload'

preloadModels(['shrub_02', 'shrub_04'])

const GROUND_SIZE = 400
/** The lawn runs far enough that its edge sits inside the haze rather than against the sky. */
const LAWN_SIZE = 2400
const SHRUB_SPACING = 1.6
const TOWER_FLOORS = 12
const STOREY = 3
const TOWER_DROP = TOWER_FLOORS * STOREY
const CITY_BLOCKS = 80

/** A planted border of real scanned shrubs between two points on the plan. */
function ShrubBed({ from, to }: { readonly from: readonly [number, number]; readonly to: readonly [number, number] }) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const count = Math.max(2, Math.round(length / SHRUB_SPACING))
  const plants = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    return { x: from[0] + (to[0] - from[0]) * t, z: from[1] + (to[1] - from[1]) * t, id: i % 2 === 0 ? 'shrub_02' : 'shrub_04', turn: i * 1.7 } as const
  })
  return (
    <ModelBoundary fallback={null}>
      {plants.map((p) => (
        <group key={`${p.x.toFixed(2)}:${p.z.toFixed(2)}`} position={[p.x, 0, p.z]} rotation={[0, p.turn, 0]}>
          <ModelPiece id={p.id} fitLength={1.3} />
        </group>
      ))}
    </ModelBoundary>
  )
}

/** Lawn, gravel drive, clipped hedges, planted borders, a cypress avenue and olive trees around the villa plot. */
function Garden({ bounds }: { readonly bounds: Rect }) {
  const right = bounds.x + bounds.w
  const bottom = bounds.z + bounds.d
  const cypresses = useMemo(() => {
    const random = seededRandom(42)
    const avenue = Array.from({ length: 6 }, (_, i) => ({ x: right + 7.5, z: bounds.z - 2 + i * 3.4, scale: 0.9 + random() * 0.2, seed: 100 + i }))
    const back = Array.from({ length: 4 }, (_, i) => ({ x: bounds.x - 4 + i * 2.6, z: bounds.z - 7, scale: 0.85 + random() * 0.3, seed: 200 + i }))
    return [...avenue, ...back]
  }, [bounds, right])
  const olives = useMemo(() => {
    const random = seededRandom(9)
    return [
      { x: bounds.x - 6, z: bottom - 3 },
      { x: bounds.x - 7, z: bounds.z + 6 },
      { x: right + 3, z: bottom + 1 },
      { x: bounds.x + bounds.w / 2 + 9, z: bottom + 6 },
      { x: bounds.x + 3, z: bottom + 6.5 },
    ].map((p, i) => ({ ...p, scale: 0.9 + random() * 0.4, seed: 300 + i }))
  }, [bounds, right, bottom])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={MATERIALS.grass} receiveShadow>
        <planeGeometry args={[LAWN_SIZE, LAWN_SIZE]} />
      </mesh>
      <ShrubBed from={[bounds.x + 0.8, bottom + 2.3]} to={[right - 0.8, bottom + 2.3]} />
      <ShrubBed from={[right + 0.9, bounds.z + 0.5]} to={[right + 0.9, bounds.z + 4.4]} />
      <ShrubBed from={[right + 0.9, bounds.z + 7.6]} to={[right + 0.9, bounds.z + bounds.d - 6]} />
      <mesh position={[right + 4, 0.004, bounds.z + 6]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.gravel} receiveShadow>
        <planeGeometry args={[6, 26]} />
      </mesh>
      <mesh position={[right + 1, 0.006, 6]} rotation={[-Math.PI / 2, 0, 0]} material={MATERIALS.paving} receiveShadow>
        <planeGeometry args={[2, 2.4]} />
      </mesh>
      <mesh position={[bounds.x + bounds.w / 2, 0.45, bottom + 3]} material={MATERIALS.hedge} castShadow receiveShadow>
        <boxGeometry args={[bounds.w + 8, 0.9, 0.7]} />
      </mesh>
      <mesh position={[bounds.x - 3.5, 0.45, bounds.z + bounds.d / 2]} material={MATERIALS.hedge} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.9, bounds.d + 6]} />
      </mesh>
      {cypresses.map((t) => (
        <Cypress key={`c${t.x.toFixed(1)}:${t.z.toFixed(1)}`} {...t} />
      ))}
      {olives.map((t) => (
        <OliveTree key={`o${t.x.toFixed(1)}:${t.z.toFixed(1)}`} {...t} />
      ))}
    </group>
  )
}

/** The glass tower beneath the apartment, a harbour and a ring of city towers far below. */
function Skyline({ bounds }: { readonly bounds: Rect }) {
  const cx = bounds.x + bounds.w / 2
  const cz = bounds.z + bounds.d / 2
  const blocks = useMemo(() => {
    const random = seededRandom(7)
    return Array.from({ length: CITY_BLOCKS }, () => {
      const angle = random() * Math.PI * 2
      const radius = 70 + random() * 120
      return {
        x: cx + Math.cos(angle) * radius,
        z: cz + Math.sin(angle) * radius * 0.6 - 40,
        w: 10 + random() * 16,
        d: 10 + random() * 16,
        height: 25 + random() * 95,
        isGlass: random() > 0.45,
      }
    })
  }, [cx, cz])
  const bands = Array.from({ length: TOWER_FLOORS }, (_, i) => -STOREY * (i + 1) + 1.2)

  return (
    <group>
      <mesh position={[cx, -TOWER_DROP / 2 - 0.35, cz - 0.5]} material={MATERIALS.towerGlass} receiveShadow>
        <boxGeometry args={[bounds.w + 0.6, TOWER_DROP - 0.7, bounds.d + 1.6]} />
      </mesh>
      {bands.map((y) => (
        <mesh key={y} position={[cx, y + 1.65, cz - 0.5]} material={MATERIALS.tower}>
          <boxGeometry args={[bounds.w + 0.9, 0.35, bounds.d + 1.9]} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -TOWER_DROP, cz]} material={MATERIALS.street}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -TOWER_DROP + 0.05, cz + 120]} material={MATERIALS.water}>
        <planeGeometry args={[GROUND_SIZE, 160]} />
      </mesh>
      {blocks.map((b) => (
        <mesh
          key={`${b.x.toFixed(1)}:${b.z.toFixed(1)}`}
          position={[b.x, -TOWER_DROP + b.height / 2, b.z]}
          material={b.isGlass ? MATERIALS.towerGlass : MATERIALS.tower}
        >
          <boxGeometry args={[b.w, b.height, b.d]} />
        </mesh>
      ))}
    </group>
  )
}

export function Surroundings({ kind, bounds }: { readonly kind: 'garden' | 'skyline'; readonly bounds: Rect }) {
  return kind === 'garden' ? <Garden bounds={bounds} /> : <Skyline bounds={bounds} />
}
