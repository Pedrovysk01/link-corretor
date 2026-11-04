/** The cinematic intro film, or the interactive 3D tour. */
export type View = 'film' | 'tour'

export interface TourLocation {
  readonly propertyId: string
  readonly roomId: string | null
  readonly view: View
}

/** Maps each property id to its room ids; the first key is the default property. */
export type KnownRooms = Readonly<Record<string, readonly string[]>>

export const parseTourUrl = (search: string, known: KnownRooms): TourLocation => {
  const params = new URLSearchParams(search)
  const requested = params.get('property') ?? ''
  // Own keys only: `in` would accept prototype names such as "constructor" from a crafted link.
  const propertyId = Object.hasOwn(known, requested) ? requested : Object.keys(known)[0]
  const room = params.get('room')
  const roomId = room && requested === propertyId && known[propertyId].includes(room) ? room : null
  // A room link always means the tour; otherwise the film plays unless the link asks for the tour.
  const view: View = roomId || params.get('view') === 'tour' ? 'tour' : 'film'
  return { propertyId, roomId, view }
}

export const tourSearch = ({ propertyId, roomId, view }: TourLocation): string => {
  const params = new URLSearchParams({ property: propertyId })
  if (roomId) params.set('room', roomId)
  else if (view === 'tour') params.set('view', 'tour')
  return `?${params.toString()}`
}
