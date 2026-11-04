import { BRAND } from './TopBar'

interface LoadingScreenProps {
  readonly propertyName: string
  readonly isDone: boolean
  /** 0–100 while textures, the sky and furniture download. */
  readonly progress?: number
}

/** Branded cover shown until the scene and its assets are ready, then faded away. */
export function LoadingScreen({ propertyName, isDone, progress = 0 }: LoadingScreenProps) {
  return (
    <div className={`loader${isDone ? ' is-done' : ''}`} role="status" aria-live="polite" aria-hidden={isDone}>
      <div className="loader__inner">
        <p className="eyebrow">{BRAND} · Tour virtual</p>
        <h1 className="loader__title">{propertyName}</h1>
        <div className="loader__bar" aria-hidden="true">
          <span className="loader__fill" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <span className="visually-hidden">{isDone ? 'Tour pronto' : `Preparando o tour 3D, ${Math.round(progress)}%`}</span>
      </div>
    </div>
  )
}
