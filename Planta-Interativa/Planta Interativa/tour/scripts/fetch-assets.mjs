#!/usr/bin/env node
/**
 * Downloads the CC0 textures, sky HDRI and furniture models the tour uses from Poly Haven
 * (https://polyhaven.com, all assets CC0) into public/assets/, and writes public/assets/credits.json.
 *
 *   node scripts/fetch-assets.mjs            download anything missing
 *   node scripts/fetch-assets.mjs --dry-run  list files and sizes without downloading
 */
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets')
const API = 'https://api.polyhaven.com'
const ALLOWED_HOSTS = new Set(['dl.polyhaven.org', 'api.polyhaven.com'])
const USER_AGENT = 'AureliaEstatesVirtualTour/1.0 (asset fetch script)'
const TEXTURE_RES = '1k'
const MODEL_RES = '1k'
const HDRI_RES = '2k'

/** Texture id -> which maps to fetch. Fabrics keep only surface detail; colour comes from our palette. */
const TEXTURES = {
  laminate_floor_02: ['Diffuse', 'nor_gl', 'Rough'],
  marble_01: ['Diffuse', 'nor_gl', 'Rough'],
  long_white_tiles: ['Diffuse', 'nor_gl', 'Rough'],
  wood_floor_deck: ['Diffuse', 'nor_gl', 'Rough'],
  plastered_wall_04: ['Diffuse', 'nor_gl', 'Rough'],
  painted_plaster_wall: ['Diffuse', 'nor_gl', 'Rough'],
  white_oak_veneer: ['Diffuse', 'nor_gl', 'Rough'],
  natural_walnut_veneer: ['Diffuse', 'nor_gl', 'Rough'],
  poly_wool_herringbone: ['nor_gl', 'Rough'],
  rough_linen: ['nor_gl', 'Rough'],
  wool_boucle: ['nor_gl', 'Rough'],
  leafy_grass: ['Diffuse', 'nor_gl', 'Rough'],
  gravel_floor_02: ['Diffuse', 'nor_gl', 'Rough'],
  grey_cartago_01: ['Diffuse', 'nor_gl', 'Rough'],
}

const MODELS = [
  'mid_century_lounge_chair',
  'modern_arm_chair_01',
  'modern_coffee_table_01',
  'coffee_table_round_01',
  'dining_chair_02',
  'modern_wooden_cabinet',
  'modern_ceiling_lamp_01',
  'potted_plant_02',
  'potted_plant_04',
  'ceramic_vase_01',
  'side_table_01',
  'shrub_02',
  'shrub_04',
]

const HDRI = 'kloofendal_48d_partly_cloudy_puresky'

const isDryRun = process.argv.includes('--dry-run')

const getJson = async (path) => {
  const response = await fetch(`${API}${path}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Poly Haven API ${path} answered ${response.status}`)
  return response.json()
}

const exists = async (path) => {
  try {
    return (await stat(path)).size > 0
  } catch {
    return false
  }
}

/** Downloads one file, refusing anything outside Poly Haven's own hosts. */
const download = async (url, target) => {
  const host = new URL(url).hostname
  if (!ALLOWED_HOSTS.has(host)) throw new Error(`Refusing to download from unexpected host ${host}`)
  if (await exists(target)) return 0
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, bytes)
  return bytes.length
}

/** Paths are built only from fixed ids and Poly Haven's file names, never from free text. */
const safeName = (name) => {
  if (!/^[\w./-]+$/.test(name) || name.includes('..')) throw new Error(`Unsafe file name from API: ${name}`)
  return name
}

const textureJobs = async () => {
  const jobs = []
  for (const [id, maps] of Object.entries(TEXTURES)) {
    const files = await getJson(`/files/${id}`)
    for (const map of maps) {
      const file = files[map]?.[TEXTURE_RES]?.jpg
      if (!file) throw new Error(`Texture ${id} has no ${map} map at ${TEXTURE_RES}`)
      jobs.push({ url: file.url, size: file.size, target: join(ROOT, 'textures', id, `${map.toLowerCase()}.jpg`) })
    }
  }
  return jobs
}

const modelJobs = async () => {
  const jobs = []
  for (const id of MODELS) {
    const gltf = (await getJson(`/files/${id}`)).gltf?.[MODEL_RES]?.gltf
    if (!gltf) throw new Error(`Model ${id} has no glTF at ${MODEL_RES}`)
    const dir = join(ROOT, 'models', id)
    jobs.push({ url: gltf.url, size: gltf.size, target: join(dir, `${id}.gltf`) })
    for (const [name, file] of Object.entries(gltf.include ?? {})) {
      jobs.push({ url: file.url, size: file.size, target: join(dir, safeName(name)) })
    }
  }
  return jobs
}

const hdriJobs = async () => {
  const file = (await getJson(`/files/${HDRI}`)).hdri?.[HDRI_RES]?.hdr
  if (!file) throw new Error(`HDRI ${HDRI} has no ${HDRI_RES} .hdr`)
  return [{ url: file.url, size: file.size, target: join(ROOT, 'hdri', `${HDRI}_${HDRI_RES}.hdr`) }]
}

const writeCredits = async () => {
  const ids = [...Object.keys(TEXTURES), ...MODELS, HDRI]
  const credits = await Promise.all(
    ids.map(async (id) => {
      const info = await getJson(`/info/${id}`)
      return { id, name: info.name, authors: Object.keys(info.authors ?? {}), license: 'CC0', url: `https://polyhaven.com/a/${id}` }
    }),
  )
  await writeFile(join(ROOT, 'credits.json'), `${JSON.stringify(credits, null, 2)}\n`)
}

const main = async () => {
  const jobs = [...(await textureJobs()), ...(await modelJobs()), ...(await hdriJobs())]
  const totalMb = jobs.reduce((sum, j) => sum + j.size, 0) / 1e6
  console.log(`${jobs.length} files, ${totalMb.toFixed(1)} MB in total`)
  if (isDryRun) {
    for (const j of jobs) console.log(`${(j.size / 1e6).toFixed(2).padStart(7)} MB  ${j.target.slice(ROOT.length + 1)}`)
    return
  }
  let downloaded = 0
  for (const job of jobs) downloaded += await download(job.url, job.target)
  await writeCredits()
  console.log(`Done: ${(downloaded / 1e6).toFixed(1)} MB downloaded into public/assets`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
