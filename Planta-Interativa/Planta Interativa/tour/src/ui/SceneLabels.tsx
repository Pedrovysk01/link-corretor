import { ChevronRight } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { getRoom } from '../data/properties'
import type { Property } from '../data/types'
import { doorLinks, linksFrom, roomArea, roomCenter } from '../lib/geometry'
import { CUTAWAY_SCALE } from '../scene/constants'
import { tourStore, useTour } from '../state/store'

const LABEL_LIFT = 0.6
const HOTSPOT_HEIGHT = 1.25

interface AnchoredProps {
  readonly at: readonly [number, number, number]
  readonly className: string
  readonly onClick: () => void
  readonly children: ReactNode
  readonly label?: string
}

/** A button pinned to a point in the 3D scene; LabelProjector positions it every frame. */
function Anchored({ at, className, onClick, children, label }: AnchoredProps) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      data-anchor=""
      data-x={at[0]}
      data-y={at[1]}
      data-z={at[2]}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/** Room names floating over the dollhouse; clicking one steps inside. */
function OverviewLabels({ property }: { readonly property: Property }) {
  const height = property.wallHeight * CUTAWAY_SCALE + LABEL_LIFT
  const f = property.focus
  return property.rooms.map((room) => {
    const [x, z] = roomCenter(room)
    // Pavimento com dois apartamentos: rotula só o que está em foco (o vizinho fica como volume mudo).
    if (f && (x < f.x || x > f.x + f.w || z < f.z || z > f.z + f.d)) return null
    return (
      <Anchored key={room.id} at={[x, height, z]} className="room-label" onClick={() => tourStore.getState().enterRoom(room.id)}>
        <span className="room-label__name">{room.name}</span>
        <span className="room-label__area">{roomArea(room).toFixed(0)} m²</span>
      </Anchored>
    )
  })
}

/** Doorway buttons inside a room that walk the visitor into the room next door. */
function DoorwayHotspots({ property, roomId }: { readonly property: Property; readonly roomId: string }) {
  const links = useMemo(() => linksFrom(doorLinks(property), roomId), [property, roomId])
  return links.map(({ roomId: target, at }) => (
    <Anchored
      key={`${target}@${at.join(',')}`}
      at={[at[0], HOTSPOT_HEIGHT, at[1]]}
      className="hotspot"
      label={`Ir para ${getRoom(property, target).name}`}
      onClick={() => tourStore.getState().enterRoom(target)}
    >
      {getRoom(property, target).name}
      <ChevronRight size={16} aria-hidden="true" />
    </Anchored>
  ))
}

export function SceneLabels({ property }: { readonly property: Property }) {
  const activeRoomId = useTour((s) => s.activeRoomId)
  return (
    <div className="scene-labels" aria-label={activeRoomId ? 'Doorways' : 'Rooms'} role="group">
      {activeRoomId ? <DoorwayHotspots property={property} roomId={activeRoomId} /> : <OverviewLabels property={property} />}
    </div>
  )
}
