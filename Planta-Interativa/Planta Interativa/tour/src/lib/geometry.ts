import type { Opening, Property, Rect, Room, RoomView, Vec2, Wall } from '../data/types'

export const DOOR_HEAD = 2.1
export const WINDOW_SILL = 0.9
export const WINDOW_HEAD = 2.2
export const SLIDER_HEAD = 2.4

/** How far either side of a doorway we probe to find the rooms it joins. */
const DOOR_PROBE = 0.4
/** How far in from the walls the default camera stands. */
const VIEW_INSET = 0.7
const EPSILON = 1e-6

/** A rectangle on the wall's face, measured along the wall (start/end) and up from the floor. */
export interface Span {
  readonly start: number
  readonly end: number
  readonly bottom: number
  readonly top: number
}

export interface WallSegments {
  readonly solids: readonly Span[]
  readonly glass: readonly Span[]
}

export interface DoorLink {
  readonly a: string
  readonly b: string
  readonly at: Vec2
}

export const wallLength = ({ from, to }: Wall): number => Math.hypot(to[0] - from[0], to[1] - from[1])

const openingSpans = (opening: Opening, height: number): WallSegments => {
  const start = opening.offset
  const end = opening.offset + opening.width
  switch (opening.kind) {
    case 'door':
      return { solids: [{ start, end, bottom: DOOR_HEAD, top: height }], glass: [] }
    case 'slider':
      return {
        solids: [{ start, end, bottom: SLIDER_HEAD, top: height }],
        glass: [{ start, end, bottom: 0, top: SLIDER_HEAD }],
      }
    case 'window':
      return {
        solids: [
          { start, end, bottom: 0, top: WINDOW_SILL },
          { start, end, bottom: WINDOW_HEAD, top: height },
        ],
        glass: [{ start, end, bottom: WINDOW_SILL, top: WINDOW_HEAD }],
      }
  }
}

const assertOpeningsFit = (openings: readonly Opening[], length: number): void => {
  openings.forEach((opening, i) => {
    if (opening.offset < 0 || opening.offset + opening.width > length + EPSILON) {
      throw new Error(`Opening ${i} (${opening.kind} at ${opening.offset}m) is outside the wall (${length}m long)`)
    }
    const next = openings[i + 1]
    if (next && opening.offset + opening.width > next.offset + EPSILON) {
      throw new Error(`Openings at ${opening.offset}m and ${next.offset}m overlap`)
    }
  })
}

/** Splits a wall into solid blocks and glass panes around its doors and windows. */
export const wallSegments = (wall: Wall, height: number): WallSegments => {
  const length = wallLength(wall)
  const openings = [...(wall.openings ?? [])].sort((a, b) => a.offset - b.offset)
  assertOpeningsFit(openings, length)

  const edges = [0, ...openings.flatMap((o) => [o.offset, o.offset + o.width]), length]
  const fullHeight: Span[] = []
  for (let i = 0; i < edges.length; i += 2) {
    const [start, end] = [edges[i], edges[i + 1]]
    if (end - start > EPSILON) fullHeight.push({ start, end, bottom: 0, top: height })
  }

  const around = openings.map((o) => openingSpans(o, height))
  return {
    solids: [...fullHeight, ...around.flatMap((s) => s.solids)].sort((a, b) => a.start - b.start || a.bottom - b.bottom),
    glass: around.flatMap((s) => s.glass),
  }
}

export const roomArea = (room: Room): number => room.rect.w * room.rect.d

export const interiorArea = (rooms: readonly Room[]): number =>
  rooms.filter((r) => r.kind !== 'outdoor').reduce((sum, r) => sum + roomArea(r), 0)

export const roomCenter = (room: Room): Vec2 => [room.rect.x + room.rect.w / 2, room.rect.z + room.rect.d / 2]

const rectContains = (rect: Rect, [x, z]: Vec2): boolean =>
  x >= rect.x && x <= rect.x + rect.w && z >= rect.z && z <= rect.z + rect.d

export const findRoomAt = (rooms: readonly Room[], point: Vec2): Room | undefined =>
  rooms.find((room) => rectContains(room.rect, point))

export const planBounds = (rooms: readonly Room[]): Rect => {
  const minX = Math.min(...rooms.map((r) => r.rect.x))
  const minZ = Math.min(...rooms.map((r) => r.rect.z))
  const maxX = Math.max(...rooms.map((r) => r.rect.x + r.rect.w))
  const maxZ = Math.max(...rooms.map((r) => r.rect.z + r.rect.d))
  return { x: minX, z: minZ, w: maxX - minX, d: maxZ - minZ }
}

/** Finds which rooms each door or slider connects by probing either side of it. */
export const doorLinks = ({ rooms, walls }: Pick<Property, 'rooms' | 'walls'>): DoorLink[] =>
  walls.flatMap((wall) => {
    const length = wallLength(wall)
    const dir: Vec2 = [(wall.to[0] - wall.from[0]) / length, (wall.to[1] - wall.from[1]) / length]
    const normal: Vec2 = [-dir[1], dir[0]]
    return (wall.openings ?? [])
      .filter((o) => o.kind !== 'window')
      .flatMap((o) => {
        const along = o.offset + o.width / 2
        const at: Vec2 = [wall.from[0] + dir[0] * along, wall.from[1] + dir[1] * along]
        const sideA = findRoomAt(rooms, [at[0] - normal[0] * DOOR_PROBE, at[1] - normal[1] * DOOR_PROBE])
        const sideB = findRoomAt(rooms, [at[0] + normal[0] * DOOR_PROBE, at[1] + normal[1] * DOOR_PROBE])
        if (!sideA || !sideB || sideA.id === sideB.id) return []
        const [a, b] = [sideA.id, sideB.id].sort()
        return [{ a, b, at }]
      })
  })

export const linksFrom = (links: readonly DoorLink[], roomId: string): { roomId: string; at: Vec2 }[] =>
  links.flatMap((link) => {
    if (link.a === roomId) return [{ roomId: link.b, at: link.at }]
    if (link.b === roomId) return [{ roomId: link.a, at: link.at }]
    return []
  })

/** The camera spot for a room: the authored one, or the south-west corner looking at the centre. */
export const viewFor = (room: Room): RoomView => {
  if (room.view) return room.view
  const { x, z, w, d } = room.rect
  const inset = Math.min(VIEW_INSET, w / 4, d / 4)
  return { eye: [x + inset, z + d - inset], look: roomCenter(room) }
}
