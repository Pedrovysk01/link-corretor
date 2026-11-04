import {
  BufferAttribute,
  CanvasTexture,
  DoubleSide,
  Euler,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { seededRandom } from '../../lib/random'

/**
 * Real-looking trees in real time are built the way games and arch-viz do it: hundreds of small
 * alpha-cut "leaf cards" scattered through the canopy volume, with normals bent outwards so the
 * canopy shades as one soft mass while light and shadow still break through the gaps.
 */

const CARD_TEXTURE_SIZE = 512
const ALPHA_CUTOFF = 0.45

interface LeafStyle {
  readonly palette: readonly string[]
  readonly leaves: number
  readonly length: readonly [number, number]
  readonly width: readonly [number, number]
}

export const OLIVE_LEAVES: LeafStyle = {
  palette: ['#6f7f55', '#86956a', '#5b6b45', '#9aa67c', '#4f5f3d'],
  leaves: 170,
  length: [22, 36],
  width: [5, 8],
}

export const CYPRESS_LEAVES: LeafStyle = {
  palette: ['#2f4a2a', '#3d5b33', '#26402a', '#4a6b3c'],
  leaves: 260,
  length: [12, 22],
  width: [5, 9],
}

/** A square of scattered leaves on a transparent background. */
const leafCardTexture = (style: LeafStyle, seed: number): CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_TEXTURE_SIZE
  canvas.height = CARD_TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable, cannot draw foliage')
  const random = seededRandom(seed)
  const margin = style.length[1]
  for (let i = 0; i < style.leaves; i += 1) {
    const length = style.length[0] + random() * (style.length[1] - style.length[0])
    const width = style.width[0] + random() * (style.width[1] - style.width[0])
    ctx.save()
    ctx.translate(margin + random() * (CARD_TEXTURE_SIZE - margin * 2), margin + random() * (CARD_TEXTURE_SIZE - margin * 2))
    ctx.rotate(random() * Math.PI * 2)
    ctx.fillStyle = style.palette[Math.floor(random() * style.palette.length)]
    ctx.beginPath()
    ctx.ellipse(0, 0, length, width, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-length * 0.8, 0)
    ctx.lineTo(length * 0.8, 0)
    ctx.stroke()
    ctx.restore()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export const leafMaterial = (style: LeafStyle, seed: number) =>
  new MeshStandardMaterial({
    map: leafCardTexture(style, seed),
    alphaTest: ALPHA_CUTOFF,
    side: DoubleSide,
    roughness: 0.8,
  })

export interface CanopyShape {
  readonly cards: number
  readonly cardSize: number
  readonly radii: readonly [number, number, number]
  readonly centre: readonly [number, number, number]
}

/** Leaf cards scattered through an ellipsoid, merged into one geometry with outward-bent normals. */
export const canopyGeometry = (shapes: readonly CanopyShape[], seed: number): BufferGeometry => {
  const random = seededRandom(seed)
  const cards: BufferGeometry[] = []
  for (const shape of shapes) {
    const [rx, ry, rz] = shape.radii
    const centre = new Vector3(...shape.centre)
    for (let i = 0; i < shape.cards; i += 1) {
      // Bias towards the surface so the silhouette is full and the middle stays airy.
      const r = Math.cbrt(0.35 + random() * 0.65)
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      const offset = new Vector3(rx * r * Math.sin(phi) * Math.cos(theta), ry * r * Math.cos(phi), rz * r * Math.sin(phi) * Math.sin(theta))
      const card = new PlaneGeometry(shape.cardSize, shape.cardSize)
      card.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(random() * Math.PI, random() * Math.PI * 2, random() * Math.PI)))
      card.translate(centre.x + offset.x, centre.y + offset.y, centre.z + offset.z)
      bendNormals(card, centre, shape.radii)
      cards.push(card)
    }
  }
  const merged = mergeGeometries(cards)
  for (const card of cards) card.dispose()
  if (!merged) throw new Error('Could not merge foliage cards')
  return merged
}

/** Points each vertex normal away from the canopy centre, scaled to the ellipsoid, for soft shading. */
const bendNormals = (geometry: BufferGeometry, centre: Vector3, radii: readonly [number, number, number]) => {
  const position = geometry.getAttribute('position')
  const normals = new Float32Array(position.count * 3)
  const v = new Vector3()
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i).sub(centre)
    v.set(v.x / radii[0], v.y / radii[1], v.z / radii[2]).normalize()
    normals.set([v.x, v.y, v.z], i * 3)
  }
  geometry.setAttribute('normal', new BufferAttribute(normals, 3))
}
