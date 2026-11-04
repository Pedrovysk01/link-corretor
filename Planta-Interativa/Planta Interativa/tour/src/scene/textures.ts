import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace } from 'three'
import { seededRandom } from '../lib/random'

const TEXTURE_SIZE = 512

const makeTexture = (draw: (ctx: CanvasRenderingContext2D, size: number) => void): CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable, cannot draw floor textures')
  draw(ctx, TEXTURE_SIZE)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}



/** A tileable ripple normal map built from integer-frequency sine waves. */
export const waterNormalTexture = (): CanvasTexture => {
  const texture = makeTexture((ctx, size) => {
    const image = ctx.createImageData(size, size)
    const waves = [
      { fx: 3, fz: 2, amp: 1 },
      { fx: -2, fz: 5, amp: 0.6 },
      { fx: 7, fz: -3, amp: 0.35 },
      { fx: 1, fz: 9, amp: 0.25 },
    ]
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let dx = 0
        let dz = 0
        for (const w of waves) {
          const phase = ((w.fx * x + w.fz * y) / size) * Math.PI * 2
          dx += Math.cos(phase) * w.fx * w.amp
          dz += Math.cos(phase) * w.fz * w.amp
        }
        const i = (y * size + x) * 4
        image.data[i] = 128 + dx * 6
        image.data[i + 1] = 128 + dz * 6
        image.data[i + 2] = 255
        image.data[i + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  })
  texture.colorSpace = NoColorSpace
  return texture
}

/** A soft abstract canvas for gallery artwork: layered colour fields. */
export const artworkTexture = (palette: readonly string[], seed: number): CanvasTexture =>
  makeTexture((ctx, size) => {
    const random = seededRandom(seed)
    ctx.fillStyle = palette[0]
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 7; i += 1) {
      const gradient = ctx.createRadialGradient(random() * size, random() * size, 0, random() * size, random() * size, size * (0.3 + random() * 0.5))
      gradient.addColorStop(0, palette[1 + (i % (palette.length - 1))])
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = 0.55
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    }
    ctx.globalAlpha = 1
  })

