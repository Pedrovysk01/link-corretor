#!/usr/bin/env node
/**
 * Compila o tour 3D com caminhos RELATIVOS, para abrir dentro do painel (/p/<código>/ e /pre/<id>/).
 *
 *   npm run build:painel      → gera ../../../apresentacao-montemerano/tour/ (o mapa abre o tour por cima, em iframe)
 *
 * (Para o GitHub Pages o workflow usa outra base; este script não o afeta.)
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, PAGES_BASE: './' } })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
run('npx', ['tsc', '-b'])
// v2: o tour compilado vai para dentro da apresentação (apresentacao-montemerano/tour), onde o mapa o abre por cima.
run('npx', ['vite', 'build', '--outDir', '"' + resolve(root, '../../../apresentacao-montemerano/tour') + '"', '--emptyOutDir'])
// O mapa abre o tour em modo embutido (?embed=1): o filme de abertura não é usado, então não vai na entrega.
const saida = resolve(root, '../../../apresentacao-montemerano/tour')
rmSync(resolve(saida, 'film'), { recursive: true, force: true })
// Lista do que o mapa pode baixar em segundo plano (código do tour + iluminação) enquanto o cliente olha o prédio.
const lista = ['index.html']
const assets = resolve(saida, 'assets')
for (const f of readdirSync(assets)) if (/\.(js|css)$/.test(f)) lista.push('assets/' + f)
const hdri = resolve(assets, 'hdri')
if (existsSync(hdri)) for (const f of readdirSync(hdri)) lista.push('assets/hdri/' + f)
writeFileSync(resolve(saida, 'prefetch.json'), JSON.stringify(lista))
console.log('\nPronto: apresentacao-montemerano/tour/ gerado. Abra o painel (Iniciar painel.bat).')
