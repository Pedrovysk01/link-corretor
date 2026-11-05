import { ArrowRight } from 'lucide-react'
import type { Property } from '../data/types'
import { formatArea, formatPrice } from '../lib/format'
import { interiorArea } from '../lib/geometry'
import { tourStore } from '../state/store'
import { RoomImage } from './RoomImage'
import { falarComCorretor } from '../lib/embed'

/** Overview panel: the headline facts and a way into the guided tour. */
export function PropertyCard({ property }: { readonly property: Property }) {
  const facts = [
    { label: 'Suítes', value: property.bedrooms },
    { label: 'Banheiros', value: property.bathrooms },
    { label: 'Área interna', value: formatArea(property.area ?? interiorArea(property.rooms)) },
    { label: 'Entrega', value: property.completion },
  ].filter((f) => f.value !== 0)
  return (
    <section className="glass panel" aria-labelledby="property-name">
      <RoomImage src={property.cover} alt={`Render ilustrativo: ${property.name}`} />
      <p className="eyebrow">Na planta · {property.location}</p>
      <h1 id="property-name" className="panel__title">
        {property.name}
      </h1>
      <p className="panel__lead">{property.tagline}</p>
      <dl className="facts">
        {facts.map((f) => (
          <div key={f.label} className="facts__item">
            <dt>{f.label}</dt>
            <dd className={typeof f.value === 'number' || /^\d/.test(String(f.value)) ? undefined : 'txt'}>{f.value}</dd>
          </div>
        ))}
      </dl>
      {property.priceFrom > 0 && (
        <p className="price">
          <span className="price__label">A partir de</span> {formatPrice(property.priceFrom, property.currency)}
        </p>
      )}
      <div className="panel__actions">
        <button type="button" className="button button--primary" onClick={() => tourStore.getState().enterRoom(property.tour[0])}>
          Iniciar tour guiado <ArrowRight size={18} aria-hidden="true" />
        </button>
        <button type="button" className="button button--ghost" onClick={() => falarComCorretor(tourStore.getState().openInquiry)}>
          Solicitar catálogo
        </button>
      </div>
    </section>
  )
}
