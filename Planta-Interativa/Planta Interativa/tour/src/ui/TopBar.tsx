import { Building2, Mail, Play, RotateCw } from 'lucide-react'
import { PROPERTIES } from '../data/properties'
import { tourStore, useTour } from '../state/store'

export const BRAND = 'Villa Montemerano'

const TYPE_LABEL = { Villa: 'Casa', Apartment: 'Apartamento', Lazer: 'Lazer' } as const

/** Logotipo oficial (branco, SVG vetorizado da pasta Artes). */
export function BrandLogo() {
  return (
    <div className="brand" aria-label={BRAND}>
      <img className="brand__logo" src={`${import.meta.env.BASE_URL}logo-branca.svg`} alt="" />
    </div>
  )
}

export function TopBar() {
  const propertyId = useTour((s) => s.propertyId)
  return (
    <header className="topbar">
      <BrandLogo />
      <nav className="glass switcher" aria-label="Escolha o ambiente">
        {PROPERTIES.filter((p) => p.id.startsWith('montemerano')).map((p) => (
          <button
            key={p.id}
            type="button"
            className="switcher__option"
            aria-pressed={p.id === propertyId}
            onClick={() => p.id !== propertyId && tourStore.getState().selectProperty(p.id)}
          >
            <span className="switcher__type">{TYPE_LABEL[p.type]}</span>
            {p.shortName}
          </button>
        ))}
      </nav>
      <div className="topbar__actions">
        <a className="button button--ghost topbar__film" href={`${import.meta.env.BASE_URL}fachada/index.html`} aria-label="Escolher pelo andar">
          <Building2 size={16} aria-hidden="true" />
          <span>Andares</span>
        </a>
        <a className="button button--ghost topbar__film" href={`${import.meta.env.BASE_URL}360/index.html`} aria-label="Ver em 360°">
          <RotateCw size={16} aria-hidden="true" />
          <span>360°</span>
        </a>
        <button type="button" className="button button--ghost topbar__film" onClick={() => tourStore.getState().showFilm()} aria-label="Assistir ao filme">
          <Play size={16} aria-hidden="true" />
          <span>Filme</span>
        </button>
        <button type="button" className="button button--primary topbar__cta" aria-label="Fale conosco" onClick={() => tourStore.getState().openInquiry()}>
          <Mail size={18} aria-hidden="true" />
          <span>Fale conosco</span>
        </button>
      </div>
    </header>
  )
}
