import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, Vector2, type Texture } from 'three'
import type { FloorFinish } from '../data/types'
import type { ScannedTextureId } from './assets'
import { scannedMap, scannedSurface } from './scannedTextures'
import { artworkTexture, waterNormalTexture } from './textures'

const standard = (color: string, roughness = 0.8, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })

/** Upholstery: our colour, the scanned weave as surface detail, and a soft sheen. */
const fabric = (color: string, weave: ScannedTextureId, repeat: number) =>
  new MeshPhysicalMaterial({
    color,
    sheen: 0.6,
    sheenColor: '#ffffff',
    sheenRoughness: 0.7,
    ...scannedSurface(weave, { repeat: [repeat, repeat], withColour: false, normalStrength: 0.8 }),
  })

/** Timber veneer from a scan; `tint` multiplies the scan's own colour. */
const veneer = (id: ScannedTextureId, tint = '#ffffff') =>
  new MeshStandardMaterial({ color: tint, ...scannedSurface(id, { repeat: [1, 1] }) })

const tiled = (texture: Texture, repeat: number): Texture => {
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeat, repeat)
  return texture
}

export const WATER_NORMALS = tiled(waterNormalTexture(), 4)

/** Shared materials. Created once and reused by every mesh that needs them. */
export const MATERIALS = {
  plaster: new MeshStandardMaterial({
    color: '#f1eee8',
    ...scannedSurface('plastered_wall_04', { repeat: [2, 2], withColour: false, normalStrength: 0.35 }),
  }),
  facade: new MeshStandardMaterial({
    color: '#efe9df',
    ...scannedSurface('painted_plaster_wall', { repeat: [3, 3], withColour: false, normalStrength: 0.6 }),
  }),
  // A touch of emission stands in for the light a real ceiling receives bounced off the floor.
  ceiling: new MeshStandardMaterial({ color: '#fbf8f3', roughness: 1, emissive: '#f6eee2', emissiveIntensity: 0.32 }),
  skirting: standard('#f7f5f0', 0.45),
  glass: new MeshPhysicalMaterial({
    color: '#eef5f7',
    roughness: 0.02,
    metalness: 0,
    transparent: true,
    opacity: 0.12,
    envMapIntensity: 1,
    specularIntensity: 1,
    depthWrite: false,
    side: DoubleSide,
  }),
  frame: standard('#2a2c2d', 0.45, 0.6),
  fabric: fabric('#6b7672', 'poly_wool_herringbone', 3),
  fabricLight: fabric('#ddd5c7', 'rough_linen', 3),
  boucle: fabric('#ece6db', 'wool_boucle', 4),
  cushion: fabric('#b4865a', 'rough_linen', 2),
  linen: fabric('#f4f1ec', 'rough_linen', 3),
  throw: fabric('#8a6a52', 'wool_boucle', 3),
  slat: veneer('white_oak_veneer', '#d6a46c'),
  paintGreen: standard('#2f4a3a', 0.9),
  boiserie: standard('#bdae9d', 0.65),
  bronzeGlass: new MeshPhysicalMaterial({ color: '#7a5a46', roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1, side: DoubleSide, depthWrite: false }),
  woodDark: veneer('natural_walnut_veneer'),
  woodLight: veneer('white_oak_veneer'),
  oak: veneer('white_oak_veneer'),
  cabinet: standard('#2a3431', 0.4),
  stone: new MeshPhysicalMaterial({ color: '#efece7', roughness: 0.22, clearcoat: 0.5, clearcoatRoughness: 0.15 }),
  travertine: new MeshStandardMaterial({ ...scannedSurface('marble_01', { repeat: [1, 1] }) }),
  ceramic: new MeshPhysicalMaterial({ color: '#fbfbfa', roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 }),
  metal: standard('#a3a39f', 0.25, 1),
  brass: standard('#a88a5c', 0.35, 1),
  mirror: standard('#e4eaec', 0.02, 1),
  black: standard('#1b1d1e', 0.4),
  rug: new MeshStandardMaterial({
    color: '#cbbfab',
    ...scannedSurface('wool_boucle', { repeat: [6, 6], withColour: false, normalStrength: 1.2 }),
  }),
  foliage: new MeshStandardMaterial({
    color: '#6d8a55',
    ...scannedSurface('leafy_grass', { repeat: [1.5, 1.5], normalStrength: 2 }),
  }),
  foliageDark: new MeshStandardMaterial({
    color: '#4c6a3e',
    ...scannedSurface('leafy_grass', { repeat: [2, 2], normalStrength: 2 }),
  }),
  bark: veneer('natural_walnut_veneer', '#8c7a68'),
  pot: standard('#cfc6b8', 0.8),
  water: new MeshPhysicalMaterial({
    color: '#1f8fa4',
    roughness: 0.06,
    metalness: 0,
    normalMap: WATER_NORMALS,
    normalScale: new Vector2(0.18, 0.18),
    envMapIntensity: 1.4,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  }),
  lampShade: new MeshStandardMaterial({ color: '#fff6ea', emissive: '#ffe6c4', emissiveIntensity: 1, roughness: 1 }),
  downlight: new MeshStandardMaterial({ color: '#ffffff', emissive: '#fff1dc', emissiveIntensity: 3, toneMapped: false }),
  // The scan reads late-summer brown from height; a green multiply makes it an irrigated lawn.
  grass: new MeshStandardMaterial({ color: '#b4d58f', ...scannedSurface('leafy_grass', { repeat: [180, 180] }) }),
  hedge: new MeshStandardMaterial({
    color: '#5d7a4b',
    ...scannedSurface('leafy_grass', { repeat: [3, 1], normalStrength: 2.5 }),
  }),
  paving: new MeshStandardMaterial({ ...scannedSurface('marble_01', { repeat: [2, 2] }) }),
  gravel: new MeshStandardMaterial({ ...scannedSurface('gravel_floor_02', { repeat: [2, 9] }) }),
  street: standard('#8d969a', 1),
  artwork: new MeshStandardMaterial({ map: artworkTexture(['#e9e1d3', '#c27c4e', '#2f4b4a', '#d8b47a', '#8a9a8b'], 31), roughness: 0.95 }),
  tower: standard('#dfe1e2', 0.5, 0.1),
  towerGlass: standard('#a9bcc8', 0.15, 0.4),
} as const

/** Scanned floor per finish; one texture tile covers `tileMetres` of floor. */
const FLOORS: Record<FloorFinish, { readonly id: ScannedTextureId; readonly tileMetres: number }> = {
  oak: { id: 'laminate_floor_02', tileMetres: 2.2 },
  deck: { id: 'wood_floor_deck', tileMetres: 2.4 },
  stone: { id: 'grey_cartago_01', tileMetres: 1.2 }, // porcelanato grande formato
  grass: { id: 'leafy_grass', tileMetres: 2.5 },
  tile: { id: 'long_white_tiles', tileMetres: 1.2 },
}

/** Floor maps sized so the boards and tiles keep their real-world scale across a `width` × `depth` room. */
export const floorSurface = (finish: FloorFinish, width: number, depth: number) => {
  const { id, tileMetres } = FLOORS[finish]
  const repeat: [number, number] = [width / tileMetres, depth / tileMetres]
  return {
    map: scannedMap(id, 'diffuse', repeat),
    normalMap: scannedMap(id, 'nor_gl', repeat),
    roughnessMap: scannedMap(id, 'rough', repeat),
  }
}
