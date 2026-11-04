import { Environment } from '@react-three/drei'
import type { Rect, Surroundings } from '../data/types'
import type { Quality } from '../lib/quality'
import { HDRI_HORIZON, HDRI_SUN, HDRI_URL } from './assets'

const SUN_DISTANCE = 40
/** Shadow-map resolution per quality tier; software rendering can't afford the 4K map. */
const SHADOW_MAP: Record<Quality, number> = { high: 4096, low: 2048, minimal: 1024 }
const GARDEN_HAZE: [number, number] = [160, 900]
const SKYLINE_HAZE: [number, number] = [140, 700]
const CIDADE_HAZE: [number, number] = [1800, 7000]

interface SceneLightingProps {
  readonly bounds: Rect
  readonly surroundings: Surroundings
  readonly quality: Quality
}

/** Unit vector towards the sun as it appears in the HDRI, in three.js world space. */
const sunDirection = (): [number, number, number] => {
  const { azimuth, elevation } = HDRI_SUN
  return [Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation)]
}

/**
 * A real photographed sky (Poly Haven HDRI) provides the background, reflections and soft fill.
 * A directional light placed exactly where that sky's sun is adds crisp shadows that agree with it.
 */
export function SceneLighting({ bounds, surroundings, quality }: SceneLightingProps) {
  const cx = bounds.x + bounds.w / 2
  const cz = bounds.z + bounds.d / 2
  const [dx, dy, dz] = sunDirection()
  const sun: [number, number, number] = [cx + dx * SUN_DISTANCE, dy * SUN_DISTANCE, cz + dz * SUN_DISTANCE]
  const extent = Math.max(bounds.w, bounds.d) * 0.85
  const [near, far] = surroundings === 'cidade' ? CIDADE_HAZE : surroundings === 'skyline' ? SKYLINE_HAZE : GARDEN_HAZE

  return (
    <>
      <Environment files={HDRI_URL} background environmentIntensity={0.9} backgroundIntensity={1} />
      <fog attach="fog" args={[HDRI_HORIZON, near, far]} />
      <directionalLight
        position={sun}
        color="#fff4e6"
        intensity={2.6}
        castShadow
        shadow-mapSize={[SHADOW_MAP[quality], SHADOW_MAP[quality]]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={100}
      >
        <object3D attach="target" position={[cx, 0, cz]} />
      </directionalLight>
    </>
  )
}
