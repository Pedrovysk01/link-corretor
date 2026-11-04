#!/usr/bin/env node
/**
 * Builds the cinematic intro film from free Pexels stock footage (https://www.pexels.com/license/).
 * Downloads each approved clip, then encodes it for scroll scrubbing: no audio, 30 fps, a keyframe
 * every few frames so seeking is instant, and a poster image of the first frame.
 *
 *   node scripts/build-film.mjs
 *
 * Sources are cached in .cache/film-src/ (git-ignored); outputs go to public/film/.
 */
import { execFileSync } from 'node:child_process'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.cache', 'film-src')
const OUT = join(ROOT, 'public', 'film')
const ALLOWED_HOST = 'videos.pexels.com'
const USER_AGENT = 'AureliaEstatesVirtualTour/1.0 (film build script)'

const WIDTH = 1600
const FPS = 30
/** Keyframe interval in frames. Small values make scroll-driven seeking smooth at a modest size cost. */
const GOP = 6
const CRF = 27
const MAX_SECONDS = 8

/** The approved shots, in story order. */
const SHOTS = [
  {
    name: 'shot-1-arrival',
    id: 39024321,
    title: 'Aerial View of Luxury Coastal Property at Dusk',
    author: 'Alef Morais',
    source: 'https://videos.pexels.com/video-files/39024321/16605493_1920_1080_30fps.mp4',
  },
  {
    name: 'shot-2-twilight',
    id: 39024336,
    title: 'Aerial View of Modern Luxury Home at Twilight',
    author: 'Alef Morais',
    source: 'https://videos.pexels.com/video-files/39024336/16605551_1920_1080_30fps.mp4',
  },
  {
    name: 'shot-3-courtyard',
    id: 18531289,
    title: 'The Swimming Pool at or near Villa del Mar',
    author: 'Abdullah | 4K',
    source: 'https://videos.pexels.com/video-files/18531289/18531289-hd_1920_1080_60fps.mp4',
  },
  {
    name: 'shot-4-living',
    id: 18531410,
    title: 'The Living Room Has a Large Flat Screen TV and a Pool',
    author: 'Abdullah | 4K',
    source: 'https://videos.pexels.com/video-files/18531410/18531410-hd_1920_1080_60fps.mp4',
  },
  {
    name: 'shot-5-dusk',
    id: 39105099,
    title: 'Luxury Modern Home with Tropical Touches',
    author: 'Alef Morais',
    source: 'https://videos.pexels.com/video-files/39105099/16638012_1920_1080_30fps.mp4',
  },
]

const exists = async (path) => {
  try {
    return (await stat(path)).size > 0
  } catch {
    return false
  }
}

const download = async (url, target) => {
  if (new URL(url).hostname !== ALLOWED_HOST) throw new Error(`Refusing to download from unexpected host: ${url}`)
  if (await exists(target)) return
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, Buffer.from(await response.arrayBuffer()))
}

const ffmpeg = (args) => execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })

const encode = (source, shot) => {
  ffmpeg([
    '-i', source,
    '-t', String(MAX_SECONDS),
    '-an',
    '-vf', `fps=${FPS},scale=${WIDTH}:-2:flags=lanczos`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p',
    '-g', String(GOP), '-keyint_min', String(GOP), '-sc_threshold', '0',
    '-movflags', '+faststart',
    join(OUT, `${shot.name}.mp4`),
  ])
  ffmpeg(['-i', source, '-frames:v', '1', '-vf', `scale=${WIDTH}:-2`, '-q:v', '4', join(OUT, `${shot.name}.jpg`)])
}

const main = async () => {
  if (!ffmpegPath) throw new Error('ffmpeg-static has no binary for this platform')
  await mkdir(OUT, { recursive: true })
  for (const shot of SHOTS) {
    const source = join(CACHE, `${shot.id}.mp4`)
    console.log(`• ${shot.name}: downloading`)
    await download(shot.source, source)
    console.log(`• ${shot.name}: encoding`)
    encode(source, shot)
  }
  const credits = SHOTS.map(({ name, id, title, author }) => ({
    file: `${name}.mp4`,
    title,
    author,
    license: 'Pexels License (free to use, no attribution required)',
    url: `https://www.pexels.com/video/${id}/`,
  }))
  await writeFile(join(OUT, 'credits.json'), `${JSON.stringify(credits, null, 2)}\n`)
  console.log('Done: public/film/')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
