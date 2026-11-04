import { describe, expect, test } from 'vitest'
import type { Property, Room, Wall } from '../data/types'
import {
  DOOR_HEAD,
  WINDOW_HEAD,
  WINDOW_SILL,
  doorLinks,
  findRoomAt,
  interiorArea,
  linksFrom,
  planBounds,
  roomArea,
  roomCenter,
  viewFor,
  wallLength,
  wallSegments,
} from './geometry'

const room = (id: string, x: number, z: number, w: number, d: number, kind: Room['kind'] = 'living'): Room => ({
  id,
  name: id,
  kind,
  rect: { x, z, w, d },
  floor: 'oak',
  description: '',
  features: [],
  furniture: [],
})

describe('wallLength', () => {
  test('measures diagonal walls', () => {
    expect(wallLength({ from: [0, 0], to: [3, 4] })).toBe(5)
  })
})

describe('wallSegments', () => {
  const HEIGHT = 3

  test('returns one full-height solid for a wall without openings', () => {
    const { solids, glass } = wallSegments({ from: [0, 0], to: [4, 0] }, HEIGHT)

    expect(solids).toEqual([{ start: 0, end: 4, bottom: 0, top: HEIGHT }])
    expect(glass).toEqual([])
  })

  test('leaves a gap below the door head', () => {
    const wall: Wall = { from: [0, 0], to: [4, 0], openings: [{ kind: 'door', offset: 1, width: 1 }] }

    const { solids, glass } = wallSegments(wall, HEIGHT)

    expect(solids).toEqual([
      { start: 0, end: 1, bottom: 0, top: HEIGHT },
      { start: 1, end: 2, bottom: DOOR_HEAD, top: HEIGHT },
      { start: 2, end: 4, bottom: 0, top: HEIGHT },
    ])
    expect(glass).toEqual([])
  })

  test('fills a window with a sill, a lintel and glass', () => {
    const wall: Wall = { from: [0, 0], to: [4, 0], openings: [{ kind: 'window', offset: 1, width: 2 }] }

    const { solids, glass } = wallSegments(wall, HEIGHT)

    expect(solids).toContainEqual({ start: 1, end: 3, bottom: 0, top: WINDOW_SILL })
    expect(solids).toContainEqual({ start: 1, end: 3, bottom: WINDOW_HEAD, top: HEIGHT })
    expect(glass).toEqual([{ start: 1, end: 3, bottom: WINDOW_SILL, top: WINDOW_HEAD }])
  })

  test('sorts openings before splitting', () => {
    const wall: Wall = {
      from: [0, 0],
      to: [6, 0],
      openings: [
        { kind: 'door', offset: 4, width: 1 },
        { kind: 'door', offset: 1, width: 1 },
      ],
    }

    const fullHeight = wallSegments(wall, HEIGHT).solids.filter((s) => s.bottom === 0)

    expect(fullHeight.map((s) => [s.start, s.end])).toEqual([
      [0, 1],
      [2, 4],
      [5, 6],
    ])
  })

  test('throws when an opening runs past the end of the wall', () => {
    const wall: Wall = { from: [0, 0], to: [2, 0], openings: [{ kind: 'door', offset: 1.5, width: 1 }] }

    expect(() => wallSegments(wall, HEIGHT)).toThrow(/outside the wall/)
  })

  test('throws when openings overlap', () => {
    const wall: Wall = {
      from: [0, 0],
      to: [5, 0],
      openings: [
        { kind: 'door', offset: 1, width: 1.5 },
        { kind: 'window', offset: 2, width: 1 },
      ],
    }

    expect(() => wallSegments(wall, HEIGHT)).toThrow(/overlap/)
  })
})

describe('rooms', () => {
  test('roomArea multiplies the footprint', () => {
    expect(roomArea(room('a', 0, 0, 4, 2.5))).toBe(10)
  })

  test('roomCenter finds the middle of the rect', () => {
    expect(roomCenter(room('a', 2, 4, 4, 2))).toEqual([4, 5])
  })

  test('interiorArea ignores outdoor rooms', () => {
    const rooms = [room('a', 0, 0, 4, 4), room('t', 0, 4, 4, 2, 'outdoor')]

    expect(interiorArea(rooms)).toBe(16)
  })

  test('findRoomAt returns the room containing a point, or undefined', () => {
    const rooms = [room('a', 0, 0, 4, 4), room('b', 4, 0, 4, 4)]

    expect(findRoomAt(rooms, [5, 1])?.id).toBe('b')
    expect(findRoomAt(rooms, [9, 1])).toBeUndefined()
  })

  test('planBounds spans every room', () => {
    const rooms = [room('a', 0, 0, 4, 4), room('b', 4, 2, 6, 5)]

    expect(planBounds(rooms)).toEqual({ x: 0, z: 0, w: 10, d: 7 })
  })
})

describe('doorLinks', () => {
  const property = {
    rooms: [room('a', 0, 0, 4, 4), room('b', 4, 0, 4, 4)],
    walls: [
      { from: [4, 0], to: [4, 4], openings: [{ kind: 'door', offset: 1, width: 1 }] },
      { from: [8, 0], to: [8, 4], openings: [{ kind: 'door', offset: 1, width: 1 }] },
      { from: [0, 0], to: [8, 0], openings: [{ kind: 'window', offset: 1, width: 1 }] },
    ],
  } as unknown as Property

  test('links the two rooms on either side of a door', () => {
    expect(doorLinks(property)).toEqual([{ a: 'a', b: 'b', at: [4, 1.5] }])
  })

  test('linksFrom lists neighbours from one side', () => {
    const links = doorLinks(property)

    expect(linksFrom(links, 'b')).toEqual([{ roomId: 'a', at: [4, 1.5] }])
    expect(linksFrom(links, 'a')).toEqual([{ roomId: 'b', at: [4, 1.5] }])
  })
})

describe('viewFor', () => {
  test('uses the authored view when there is one', () => {
    const authored = { ...room('a', 0, 0, 4, 4), view: { eye: [1, 1] as const, look: [3, 3] as const } }

    expect(viewFor(authored)).toEqual(authored.view)
  })

  test('defaults to a corner looking at the centre', () => {
    const view = viewFor(room('a', 0, 0, 4, 4))

    expect(view.look).toEqual([2, 2])
    expect(view.eye[0]).toBeLessThan(2)
    expect(view.eye[1]).toBeGreaterThan(2)
  })
})
