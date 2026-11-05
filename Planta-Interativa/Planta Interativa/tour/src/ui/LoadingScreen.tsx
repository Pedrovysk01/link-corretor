import { useEffect, useState } from 'react'
import { BRAND } from './TopBar'

interface LoadingScreenProps {
  readonly propertyName: string
  readonly isDone: boolean
  /** 0–100 while textures, the sky and furniture download. */
  readonly progress?: number
}

/** Porcentagem mostrada ao cliente: nunca recua, sobe por conta própria enquanto o download real está parado
 *  (devagar, até 92 %), acompanha o real quando ele passa à frente, e chega a 100 % antes de a tela sair. */
/** Contador global, fora do React: um só relógio para a página inteira, que nunca volta atrás.
 *  Sobe por conta própria enquanto o download real está parado (devagar, até 92 %), acompanha o real quando ele passa à
 *  frente, e chega a 100 % antes de a tela sair. */
const relogio = { v: 0, real: 0, done: false, last: 0, raf: 0, ouvintes: new Set<(v: number) => void>() }
const tickRelogio = (now: number) => {
  const dt = Math.min(100, now - (relogio.last || now)); relogio.last = now
  const alvo = relogio.done ? 100 : Math.max(relogio.v, Math.min(relogio.real, 99)), teto = relogio.done ? 100 : 92
  let v = relogio.v
  if (v < alvo) v = Math.min(alvo, v + dt * (relogio.done ? 0.3 : 0.08))
  else if (v < teto) v = Math.min(teto, v + dt * 0.012)
  if (v > relogio.v) { relogio.v = v; relogio.ouvintes.forEach((f) => f(v)) }
  relogio.raf = relogio.done && v >= 100 ? 0 : requestAnimationFrame(tickRelogio)
}
function useProgressoConstante(real: number, isDone: boolean) {
  const [shown, setShown] = useState(relogio.v)
  relogio.real = Math.max(relogio.real, real); if (isDone) relogio.done = true
  useEffect(() => {
    relogio.ouvintes.add(setShown)
    if (!relogio.raf) { relogio.last = 0; relogio.raf = requestAnimationFrame(tickRelogio) }
    return () => { relogio.ouvintes.delete(setShown) }
  }, [])
  return Math.max(shown, relogio.v)
}

/** Branded cover shown until the scene and its assets are ready, then faded away. */
export function LoadingScreen({ propertyName, isDone, progress = 0 }: LoadingScreenProps) {
  const shown = useProgressoConstante(progress, isDone)
  const pronto = isDone && shown >= 100
  return (
    <div className={`loader${pronto ? ' is-done' : ''}`} role="status" aria-live="polite" aria-hidden={pronto}>
      <div className="loader__inner">
        <p className="eyebrow">{BRAND} · Tour virtual</p>
        <h1 className="loader__title">{propertyName}</h1>
        <div className="loader__bar" aria-hidden="true">
          <span className="loader__fill" style={{ transform: `scaleX(${shown / 100})` }} />
        </div>
        <p className="loader__pct" id="loader-pct" aria-hidden="true">{Math.floor(shown)}%</p>
        <span className="visually-hidden">{pronto ? 'Tour pronto' : `Preparando o tour 3D, ${Math.floor(shown)}%`}</span>
      </div>
    </div>
  )
}
