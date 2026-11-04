import { NoColorSpace, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2, type Texture } from 'three'
import { textureUrl, type ScannedTextureId, type TextureMap } from './assets'

const ANISOTROPY = 8

interface Source {
  readonly base: Texture
  readonly copies: Set<Texture>
  isLoaded: boolean
}

const loader = new TextureLoader()
const sources = new Map<string, Source>()

/** Loads each image once; every per-surface copy is flagged for upload when the image arrives. */
const sourceFor = (url: string, isColour: boolean): Source => {
  const existing = sources.get(url)
  if (existing) return existing
  const base = loader.load(
    url,
    () => markLoaded(url),
    undefined,
    (error) => console.error(`Texture failed to load: ${url}`, error),
  )
  const source: Source = { base, copies: new Set(), isLoaded: false }
  source.base.colorSpace = isColour ? SRGBColorSpace : NoColorSpace
  sources.set(url, source)
  return source
}

const markLoaded = (url: string) => {
  const source = sources.get(url)
  if (!source) return
  source.isLoaded = true
  for (const copy of source.copies) copy.needsUpdate = true
}

/** A tiling copy of one scanned map. Copies share the image but can each have their own repeat. */
export const scannedMap = (id: ScannedTextureId, map: TextureMap, repeat: readonly [number, number]): Texture => {
  const source = sourceFor(textureUrl(id, map), map === 'diffuse')
  const copy = source.base.clone()
  copy.wrapS = RepeatWrapping
  copy.wrapT = RepeatWrapping
  copy.anisotropy = ANISOTROPY
  copy.repeat.set(repeat[0], repeat[1])
  copy.addEventListener('dispose', () => source.copies.delete(copy))
  source.copies.add(copy)
  if (source.isLoaded) copy.needsUpdate = true
  return copy
}

export interface ScannedSurface {
  map?: Texture
  normalMap: Texture
  roughnessMap: Texture
  normalScale: Vector2
}

interface SurfaceOptions {
  readonly repeat?: readonly [number, number]
  /** Use the scan's colour map. Off for fabrics and plaster, whose colour comes from our palette. */
  readonly withColour?: boolean
  readonly normalStrength?: number
}

/** Material parameters for a scanned surface: colour (optional), normal and roughness maps. */
export const scannedSurface = (id: ScannedTextureId, options: SurfaceOptions = {}): ScannedSurface => {
  const { repeat = [1, 1], withColour = true, normalStrength = 1 } = options
  return {
    ...(withColour ? { map: scannedMap(id, 'diffuse', repeat) } : {}),
    normalMap: scannedMap(id, 'nor_gl', repeat),
    roughnessMap: scannedMap(id, 'rough', repeat),
    normalScale: new Vector2(normalStrength, normalStrength),
  }
}
