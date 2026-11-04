#!/usr/bin/env node
/**
 * Gera as sequências de quadros do "360°" a partir dos vídeos do empreendimento (padrão Cloudimage 360 View).
 *
 *   npm run 360 -- "C:/caminho/Montemerano/Videos/Takes soltos"
 *
 * Para cada take listado em CENAS, extrai N quadros (WebP, 1400 px) em public/360/<id>/<id>-<n>.webp e grava
 * public/360/cenas.json, que a página public/360/index.html lê. Arrastar o quadro = "girar" o take.
 * Rode de novo à vontade: cenas já extraídas são puladas (--force refaz).
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import staticFfmpeg from 'ffmpeg-static'

const ffmpeg = staticFfmpeg && existsSync(staticFfmpeg) ? staticFfmpeg : 'ffmpeg'
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', '360')
const WIDTH = 1400
const QUALITY = 78

/** Takes que viram cenas: arquivo (sem .mp4), id da pasta, título, grupo e quantos quadros. */
const CENAS = [
  { file: 'Externa Giro', id: 'externa', titulo: 'Fachada · giro aéreo', grupo: 'Empreendimento', frames: 72, capa: 'img/externa-01.webp' },
  { file: 'Externa Noturna', id: 'noturna', titulo: 'Fachada · noturna', grupo: 'Empreendimento', frames: 40, capa: 'img/externa-noturna.webp' },
  { file: 'Subida', id: 'subida', titulo: 'Subida pela torre', grupo: 'Empreendimento', frames: 48, capa: 'img/externa-aerea.webp' },
  { file: 'Living Estar', id: 'living', titulo: 'Living · estar', grupo: 'Apartamento', frames: 36, capa: 'img/living-estar.webp' },
  { file: 'Living Jantar', id: 'jantar', titulo: 'Living · jantar', grupo: 'Apartamento', frames: 36, capa: 'img/living-jantar.webp' },
  { file: 'Sacada', id: 'sacada', titulo: 'Sacada gourmet', grupo: 'Apartamento', frames: 36, capa: 'img/sacada.webp' },
  { file: 'Suite - TK 01', id: 'suite', titulo: 'Suíte master', grupo: 'Apartamento', frames: 36, capa: 'img/suite.webp' },
  { file: 'Piscina TK 01', id: 'piscina', titulo: 'Piscinas', grupo: 'Lazer', frames: 36, capa: 'img/piscina.webp' },
  { file: 'Gourmet Externo', id: 'gourmet', titulo: 'Área gourmet', grupo: 'Lazer', frames: 36, capa: 'img/gourmet-externo.webp' },
  { file: 'Fireplace', id: 'fireplace', titulo: 'Fire place', grupo: 'Lazer', frames: 36, capa: 'img/fireplace.webp' },
  { file: 'Salao de festas', id: 'salao', titulo: 'Salão de festas', grupo: 'Lazer', frames: 36, capa: 'img/salao-de-festas.webp' },
  { file: 'Sala de jogos', id: 'jogos', titulo: 'Sala de jogos & pub', grupo: 'Lazer', frames: 36, capa: 'img/sala-de-jogos.webp' },
  { file: 'Academia', id: 'academia', titulo: 'Academia', grupo: 'Lazer', frames: 36, capa: 'img/academia.webp' },
  { file: 'Brinquedoteca', id: 'brinquedoteca', titulo: 'Brinquedoteca', grupo: 'Lazer', frames: 30, capa: 'img/brinquedoteca.webp' },
  { file: 'Playground', id: 'playground', titulo: 'Playground', grupo: 'Lazer', frames: 36, capa: 'img/playground.webp' },
  { file: 'Petplace e Quadra', id: 'pet', titulo: 'Pet place e quadra', grupo: 'Lazer', frames: 36, capa: 'img/petplace.webp' },
]

const input = process.argv.slice(2).find((a) => !a.startsWith('--'))
const force = process.argv.includes('--force')
if (!input) {
  console.error('Uso: npm run 360 -- "<pasta com os takes .mp4>" [--force]')
  process.exit(1)
}

const duracao = (file) => {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim()
  return parseFloat(out) || 5
}

const existentes = new Set(await readdir(resolve(input)))
const cenas = []
for (const c of CENAS) {
  const src = join(resolve(input), `${c.file}.mp4`)
  if (!existentes.has(`${c.file}.mp4`)) {
    console.warn(`— ${c.file}.mp4 não encontrado; cena pulada`)
    continue
  }
  const dir = join(OUT, c.id)
  await mkdir(dir, { recursive: true })
  const pronto = await stat(join(dir, `${c.id}-${c.frames}.webp`)).then((s) => s.size > 0).catch(() => false)
  if (!pronto || force) {
    const d = duracao(src)
    const fps = (c.frames / d).toFixed(4)
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', src, '-vf', `fps=${fps},scale='min(${WIDTH},iw)':-2`, '-frames:v', String(c.frames), '-quality', String(QUALITY), join(dir, `${c.id}-%d.webp`)], { stdio: 'inherit' })
    console.log(`✔ ${c.titulo}: ${c.frames} quadros de ${d.toFixed(1)} s`)
  } else console.log(`· ${c.titulo}: já existia`)
  cenas.push({ id: c.id, titulo: c.titulo, grupo: c.grupo, frames: c.frames, capa: c.capa })
}
await writeFile(join(OUT, 'cenas.json'), JSON.stringify(cenas, null, 1))
console.log(`\n${cenas.length} cenas em public/360/ (cenas.json atualizado).`)
