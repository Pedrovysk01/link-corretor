import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { BackSide, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import type { Rect } from '../data/types'
import { MATERIALS } from './materials'

/** Entorno real do empreendimento: a torre com o render da fachada, o pódio, o chão em imagem de satélite e um
 *  panorama cilíndrico feito dos quadros do drone. Sem prédios genéricos: o que se vê é Itapema. */

const STOREY = 3
/** Pavimentos que a textura da fachada mostra (render "Externa 01"); a repetição vertical mantém 3 m por andar. */
const FACADE_FLOORS = 22
const PODIUM_FLOORS = 3
/** Lado do mosaico de satélite (m) — ver scripts: 5×5 tiles Esri z16 em Itapema ≈ 2 721 m. */
const SAT_SIZE = 2721
const PANO_RADIUS = 1150
/** entorno-pano.jpg tem 4096×345: a altura do cilindro segue a proporção para não esticar. */
const PANO_HEIGHT = (2 * Math.PI * PANO_RADIUS * 345) / 4096

const BASE = import.meta.env.BASE_URL

const prep = (t: Texture, repeat?: readonly [number, number]) => {
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}

interface CidadeProps {
  readonly bounds: Rect
  /** Pavimentos entre o piso mostrado e o pódio (o apartamento tipo fica alto; o lazer, logo acima do pódio). */
  readonly floorsBelow: number
}

export function Cidade({ bounds, floorsBelow }: CidadeProps) {
  const [facade, podium, sat, pano] = useTexture([`${BASE}img/fachada.webp`, `${BASE}img/podio.webp`, `${BASE}img/entorno-satelite.jpg`, `${BASE}img/entorno-pano.jpg`])
  const cx = bounds.x + bounds.w / 2
  const cz = bounds.z + bounds.d / 2
  const drop = Math.max(1, floorsBelow) * STOREY
  const podiumH = PODIUM_FLOORS * STOREY
  const groundY = -drop - podiumH

  const mats = useMemo(() => {
    const f = prep(facade.clone(), [1, floorsBelow / FACADE_FLOORS])
    const side = new MeshStandardMaterial({ map: f, roughness: 0.55, metalness: 0.1 })
    const cap = MATERIALS.tower
    const p = new MeshStandardMaterial({ map: prep(podium.clone(), [2, 1]), roughness: 0.6 })
    return { sides: [side, side, cap, cap, side, side], podium: [p, p, cap, cap, p, p], ground: new MeshStandardMaterial({ map: prep(sat), roughness: 1 }), pano: new MeshBasicMaterial({ map: prep(pano), side: BackSide, fog: false }) }
  }, [facade, podium, sat, pano, floorsBelow])

  return (
    <group>
      {/* torre: planta encaixada no topo, fachada real nos lados */}
      <mesh position={[cx, -drop / 2 - 0.3, cz]} material={mats.sides} receiveShadow>
        <boxGeometry args={[bounds.w + 0.6, drop - 0.6, bounds.d + 0.6]} />
      </mesh>
      {/* pódio comercial, mais largo que a torre */}
      <mesh position={[cx, -drop - podiumH / 2, cz]} material={mats.podium}>
        <boxGeometry args={[bounds.w + 12, podiumH, bounds.d + 10]} />
      </mesh>
      {/* chão: imagem de satélite centrada no lote aproximado */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, groundY, cz]} material={mats.ground}>
        <planeGeometry args={[SAT_SIZE, SAT_SIZE]} />
      </mesh>
      {/* horizonte: faixa do drone (morros, cidade, mar) em volta de tudo; o céu acima é o HDRI */}
      <mesh position={[cx, groundY + PANO_HEIGHT / 2 - 40, cz]} material={mats.pano}>
        <cylinderGeometry args={[PANO_RADIUS, PANO_RADIUS, PANO_HEIGHT, 96, 1, true]} />
      </mesh>
    </group>
  )
}
