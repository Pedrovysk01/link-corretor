#!/usr/bin/env node
/**
 * Compila o tour 3D com caminhos RELATIVOS, para abrir dentro do painel (/p/<código>/ e /pre/<id>/).
 *
 *   npm run build:painel      → gera dist/, que o link-server registra como "Villa Montemerano"
 *
 * (Para o GitHub Pages o workflow usa outra base; este script não o afeta.)
 */
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, PAGES_BASE: './' } })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
run('npx', ['tsc', '-b'])
run('npx', ['vite', 'build'])
console.log('\nPronto: dist/ gerado. Reinicie o painel (Iniciar painel.bat) para ele registrar o Villa Montemerano.')
