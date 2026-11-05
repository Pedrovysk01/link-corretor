import { ArrowLeft, ArrowRight, Box, LayoutGrid, Mail, RotateCw } from 'lucide-react'
import type { Property, Room } from '../data/types'
import { formatArea } from '../lib/format'
import { roomArea } from '../lib/geometry'
import { tourStep } from '../lib/tour'
import { tourStore, useTour } from '../state/store'
import { RoomImage } from './RoomImage'
import { falarComCorretor } from '../lib/embed'

/** Inside a room: what you are looking at, and the guided-tour controls that end at the inquiry form. */
export function RoomPanel({ property, room }: { readonly property: Property; readonly room: Room }) {
  const step = tourStep(property.tour, room.id)
  const { enterRoom, showOverview, openInquiry } = tourStore.getState()
  const isLastStop = step.index === step.total - 1
  const pano360 = useTour((s) => s.pano360)

  return (
    <section className="glass panel panel--room" aria-labelledby="room-name">
      <RoomImage src={room.image} srcs={room.images} alt={`Render ilustrativo: ${room.name}`} />
      <p className="visually-hidden" aria-live="polite">
        Você está em {room.name}
      </p>
      <p className="eyebrow">
        {step.index >= 0 ? `Parada ${step.index + 1} de ${step.total}` : 'Explorando'} · {formatArea(roomArea(room))}
      </p>
      <h1 id="room-name" className="panel__title">
        {room.name}
      </h1>
      {room.pano && (
        <div className="seg360" role="group" aria-label="Modo de visualização">
          <button type="button" className="seg360__opt" aria-pressed={pano360} onClick={() => tourStore.getState().setPano360(true)}>
            <RotateCw size={14} aria-hidden="true" /> 360°
          </button>
          <button type="button" className="seg360__opt" aria-pressed={!pano360} onClick={() => tourStore.getState().setPano360(false)}>
            <Box size={14} aria-hidden="true" /> 3D
          </button>
        </div>
      )}
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
          <button type="button" className="button button--primary" onClick={() => falarComCorretor(openInquiry)}>
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
