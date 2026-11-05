import { useTexture } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { BackSide, CanvasTexture, Group, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Vector3, type Texture } from 'three'
import type { Rect } from '../data/types'
import { ENTORNO } from './entorno.generated'
import { MATERIALS } from './materials'

/** Entorno real do empreendimento: a torre com o render da fachada, o pódio, o chão em imagem de satélite (um mosaico largo
 *  e outro de detalhe ao redor do lote) e um panorama cilíndrico feito dos quadros do drone. Sem prédios genéricos.
 *  A coordenada do lote vem de scripts/build-satelite.py (entorno.generated.ts): troque por a exata e rode de novo. */

export const STOREY = 3
/** Pavimentos que a textura da fachada mostra (render "Externa 01"); a repetição vertical mantém 3 m por andar. */
const FACADE_FLOORS = 22
const PODIUM_FLOORS = 3
const PANO_RADIUS = 1150
/** entorno-pano.jpg tem 4096×345: a altura do cilindro segue a proporção para não esticar. */
const PANO_HEIGHT = (2 * Math.PI * PANO_RADIUS * 345) / 4096

/** Altura (y) do chão: abaixo do corte, descendo os pavimentos e o pódio. */
export const cidadeGroundY = (floorsBelow: number) => -Math.max(1, floorsBelow) * STOREY - PODIUM_FLOORS * STOREY

const BASE = import.meta.env.BASE_URL

/** Chão "aéreo" (como o Bossa): o render "Externa Aérea" da Justus num painel inclinado de frente para a câmera de visão
 *  geral, ancorado na base da torre. Ganha nitidez (é um render, não satélite) e perde liberdade: ao girar muito a
 *  câmera, o painel se revela como imagem. Liga/desliga por URL: ?chao=aereo | ?chao=satelite (padrão: aéreo). */
const AEREO = { w: 1600, h: 1080, u: 0.748, v: 0.9, pxPorMetro: 6.8 } // ancora = pé da torre no render; escala pela altura da torre (≈75 m em 680 px)
const chaoAereo = () => new URLSearchParams(location.search).get('chao') !== 'satelite'
/** Mesma direção da visão geral de CameraRig.overviewPose (eye − target), para o painel ficar de frente para ela. */
const DIR_VISAO = new Vector3(-0.25, 1.05, 0.8).normalize()

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

/** Máscara radial: o mosaico de detalhe some suavemente nas bordas e se funde ao mosaico largo. */
const bordaSuave = () => {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(128, 128, 60, 128, 128, 128)
  grad.addColorStop(0, '#fff')
  grad.addColorStop(0.62, '#fff')
  grad.addColorStop(1, '#000')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new CanvasTexture(c)
}

interface CidadeProps {
  readonly bounds: Rect
  /** Pavimentos entre o piso mostrado e o pódio (o apartamento tipo fica alto; o lazer, logo acima do pódio). */
  readonly floorsBelow: number
}

export function Cidade({ bounds, floorsBelow }: CidadeProps) {
  const [facade, podium, sat, satPerto, pano, aereo] = useTexture([
    `${BASE}img/fachada.webp`,
    `${BASE}img/podio.webp`,
    `${BASE}img/entorno-satelite.webp`,
    `${BASE}img/entorno-satelite-perto.webp`,
    `${BASE}img/entorno-pano.webp`,
    `${BASE}img/externa-aerea.webp`,
  ])
  const aereoOn = chaoAereo()
  const painel = useRef<Group>(null)
  const cx = bounds.x + bounds.w / 2
  const cz = bounds.z + bounds.d / 2
  const drop = Math.max(1, floorsBelow) * STOREY
  const podiumH = PODIUM_FLOORS * STOREY
  const groundY = cidadeGroundY(floorsBelow)

  const mats = useMemo(() => {
    const side = new MeshStandardMaterial({ map: prep(facade.clone(), [1, floorsBelow / FACADE_FLOORS]), roughness: 0.55, metalness: 0.1 })
    const cap = MATERIALS.tower
    const p = new MeshStandardMaterial({ map: prep(podium.clone(), [2, 1]), roughness: 0.6 })
    return {
      sides: [side, side, cap, cap, side, side],
      podium: [p, p, cap, cap, p, p],
      largo: new MeshBasicMaterial({ map: prep(sat) }),
      perto: new MeshBasicMaterial({ map: prep(satPerto), alphaMap: bordaSuave(), transparent: true, depthWrite: false }),
      pano: new MeshBasicMaterial({ map: prep(pano), side: BackSide, fog: false }),
      aereo: new MeshBasicMaterial({ map: prep(aereo), fog: false }),
    }
  }, [facade, podium, sat, satPerto, pano, aereo, floorsBelow])

  const aW = AEREO.w / AEREO.pxPorMetro
  const aH = AEREO.h / AEREO.pxPorMetro
  useLayoutEffect(() => {
    const g = painel.current
    if (!g) return
    g.lookAt(g.position.clone().add(DIR_VISAO)) // o +z do grupo (frente do plano) aponta para a câmera de visão geral
  }, [cx, cz, groundY, aereoOn])

  return (
    <group>
      {/* torre: planta encaixada no topo (corte horizontal), fachada real nos lados */}
      <mesh position={[cx, -drop / 2 - 0.3, cz]} material={mats.sides} receiveShadow>
        <boxGeometry args={[bounds.w + 0.6, drop - 0.6, bounds.d + 0.6]} />
      </mesh>
      {/* pódio comercial, mais largo que a torre */}
      <mesh position={[cx, -drop - podiumH / 2, cz]} material={mats.podium}>
        <boxGeometry args={[bounds.w + 12, podiumH, bounds.d + 10]} />
      </mesh>
      {/* chão: mosaico largo + mosaico de detalhe, centrados de modo que o lote caia sob a torre */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx + ENTORNO.largo.offX, groundY - 0.2, cz + ENTORNO.largo.offZ]} material={mats.largo}>
        <planeGeometry args={[ENTORNO.largo.size, ENTORNO.largo.size]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx + ENTORNO.perto.offX, groundY, cz + ENTORNO.perto.offZ]} material={mats.perto} renderOrder={1}>
        <planeGeometry args={[ENTORNO.perto.size, ENTORNO.perto.size]} />
      </mesh>
      {aereoOn && (
        <group ref={painel} position={[cx, groundY, cz]}>
          {/* render aéreo ancorado no pé da torre: o pixel (u, v) do render cai na origem do grupo */}
          <mesh position={[(0.5 - AEREO.u) * aW, (AEREO.v - 0.5) * aH, -1]} material={mats.aereo} renderOrder={2}>
            <planeGeometry args={[aW, aH]} />
          </mesh>
        </group>
      )}
      {/* horizonte: faixa do drone (morros, cidade, mar) em volta de tudo; o céu acima é o HDRI */}
      <mesh position={[cx, groundY + PANO_HEIGHT / 2 - 40, cz]} material={mats.pano}>
        <cylinderGeometry args={[PANO_RADIUS, PANO_RADIUS, PANO_HEIGHT, 96, 1, true]} />
      </mesh>
    </group>
  )
}
