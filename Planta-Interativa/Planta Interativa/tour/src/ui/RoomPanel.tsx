import { ArrowLeft, ArrowRight, LayoutGrid, Mail } from 'lucide-react'
import type { Property, Room } from '../data/types'
import { formatArea } from '../lib/format'
import { roomArea } from '../lib/geometry'
import { tourStep } from '../lib/tour'
import { tourStore } from '../state/store'
import { RoomImage } from './RoomImage'

/** Inside a room: what you are looking at, and the guided-tour controls that end at the inquiry form. */
export function RoomPanel({ property, room }: { readonly property: Property; readonly room: Room }) {
  const step = tourStep(property.tour, room.id)
  const { enterRoom, showOverview, openInquiry } = tourStore.getState()
  const isLastStop = step.index === step.total - 1

  return (
    <section className="glass panel panel--room" aria-labelledby="room-name">
      <RoomImage src={room.image} alt={`Render ilustrativo: ${room.name}`} />
      <p className="visually-hidden" aria-live="polite">
        Você está em {room.name}
      </p>
      <p className="eyebrow">
        {step.index >= 0 ? `Parada ${step.index + 1} de ${step.total}` : 'Explorando'} · {formatArea(roomArea(room))}
      </p>
      <h1 id="room-name" className="panel__title">
        {room.name}
      </h1>
      <p className="panel__lead">{room.description}</p>
      <ul className="chips" aria-label="Destaques">
        {room.features.map((f) => (
          <li key={f} className="chip">
            {f}
          </li>
        ))}
      </ul>
      <div className="tour-nav">
        <button type="button" className="icon-button icon-button--bordered" onClick={showOverview} aria-label="Voltar à visão geral">
          <LayoutGrid size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => step.prev && enterRoom(step.prev)}
          disabled={!step.prev}
        >
          <ArrowLeft size={18} aria-hidden="true" /> Anterior
        </button>
        {isLastStop ? (
          <button type="button" className="button button--primary" onClick={openInquiry}>
            Pedir informações <Mail size={18} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="button button--primary" onClick={() => step.next && enterRoom(step.next)}>
            Próximo <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  )
}
