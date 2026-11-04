import { useTour } from '../state/store'

const HINTS = {
  overview: 'Clique em um ambiente para entrar · Arraste para girar · Role para aproximar',
  room: 'Arraste (ou use ← →) para olhar ao redor · Toque no rótulo de uma porta para atravessar',
} as const

export function HintBar() {
  const mode = useTour((s) => s.mode)
  return (
    <p className="hint" role="status">
      {HINTS[mode]}
    </p>
  )
}
