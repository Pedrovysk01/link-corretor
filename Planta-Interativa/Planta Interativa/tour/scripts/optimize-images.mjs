#!/usr/bin/env node
/**
 * Converte renders/fotos (JPG/PNG de qualquer tamanho) em WebP leves para o tour.
 *
 *   npm run imagens -- "C:/caminho/da/pasta/com/renders"
 *
 * - Largura máxima 1600 px, qualidade 80 (≈100–250 KB por imagem, boas para web e celular).
 * - O nome do arquivo vira o "slug": "Living Estar - A - 01.jpg" → public/img/living-estar.webp
 *   (remove o sufixo " - A - 01", acentos e espaços).
 * - Roda de novo sem medo: o que já existe é pulado. Use --force para refazer.
 * - Depois de converter, referencie no arquivo de dados: image: 'img/living-estar.webp'.
 */
import { execFileSync } from 'node:child_process'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import staticFfmpeg from 'ffmpeg-static'

// Usa o ffmpeg embutido no npm; se não tiver sido baixado, cai para o `ffmpeg` instalado no sistema.
const ffmpegPath = staticFfmpeg && existsSync(staticFfmpeg) ? staticFfmpeg : 'ffmpeg'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'img')
const WIDTH = 1600
const QUALITY = 80
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const input = process.argv.slice(2).find((a) => !a.startsWith('--'))
const force = process.argv.includes('--force')
if (!input) {
  console.error('Uso: npm run imagens -- "<pasta com as imagens>" [--force]')
  process.exit(1)
}

const slug = (file) =>
  file
    .slice(0, file.length - extname(file).length)
    .replace(/\s+-\s+[A-Z]\s+-\s+\d+\s*$/i, '') // " - A - 01"
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const exists = async (p) => {
  try {
    return (await stat(p)).size > 0
  } catch {
    return false
  }
}

await mkdir(OUT, { recursive: true })
let done = 0
let skipped = 0
for (const file of (await readdir(resolve(input))).sort()) {
  if (!EXT.has(extname(file).toLowerCase())) continue
  const target = join(OUT, `${slug(file)}.webp`)
  if (!force && (await exists(target))) {
    skipped++
    continue
  }
  execFileSync(
    ffmpegPath,
    ['-y', '-v', 'error', '-i', join(resolve(input), file), '-vf', `scale='min(${WIDTH},iw)':-2`, '-quality', String(QUALITY), target],
    { stdio: 'inherit' },
  )
  const kb = Math.round((await stat(target)).size / 1024)
  console.log(`✔ ${file}  →  img/${slug(file)}.webp  (${kb} KB)`)
  done++
}
console.log(`\n${done} convertida(s), ${skipped} já existiam. Arquivos em public/img/.`)
