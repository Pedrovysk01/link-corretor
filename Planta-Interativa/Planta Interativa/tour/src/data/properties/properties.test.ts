import { describe, expect, test } from 'vitest'
import { doorLinks, findRoomAt, wallSegments } from '../../lib/geometry'
import type { Property, Rect } from '../types'
import { PROPERTIES, getProperty } from './index'

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.z < b.z + b.d && b.z < a.z + a.d

const reachableFrom = (property: Property, startId: string): ReadonlySet<string> => {
  const links = doorLinks(property)
  const seen = new Set<string>([startId])
  const queue = [startId]
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const link of links) {
      const other = link.a === current ? link.b : link.b === current ? link.a : null
      if (other && !seen.has(other)) {
        seen.add(other)
        queue.push(other)
      }
    }
  }
  return seen
}

describe('getProperty', () => {
  test('throws a clear error for an unknown id', () => {
    expect(() => getProperty('castle')).toThrow(/Unknown property "castle"/)
  })
})

describe.each(PROPERTIES.map((p) => [p.name, p] as const))('%s', (_name, property) => {
  test('has unique room ids', () => {
    const ids = property.rooms.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('tour only visits rooms that exist, once each', () => {
    const ids = new Set(property.rooms.map((r) => r.id))
    expect(property.tour.every((id) => ids.has(id))).toBe(true)
    expect(new Set(property.tour).size).toBe(property.tour.length)
  })

  test('has no overlapping rooms', () => {
    const { rooms } = property
    const clashes = rooms.flatMap((a, i) => rooms.slice(i + 1).filter((b) => overlaps(a.rect, b.rect)).map((b) => `${a.id}/${b.id}`))
    expect(clashes).toEqual([])
  })

  test('every wall opening fits its wall', () => {
    for (const wall of property.walls) {
      expect(() => wallSegments(wall, property.wallHeight)).not.toThrow()
    }
  })

  test('every room can be reached through doorways from the first tour stop', () => {
    const reachable = reachableFrom(property, property.tour[0])
    // Só os ambientes internos precisam de caminho por portas: decks e jardins abertos se ligam sem porta; e num pavimento com duas plantas,
    // cada apartamento é um mundo à parte (o tour guiado de um não entra no outro).
    const dentro = (r: (typeof property.rooms)[number]) => !property.focus || (r.rect.x >= property.focus.x - 1e-6 && r.rect.x + r.rect.w <= property.focus.x + property.focus.w + 1e-6)
    const unreachable = property.rooms.filter((r) => r.kind !== 'outdoor' && dentro(r)).map((r) => r.id).filter((id) => !reachable.has(id))
    expect(unreachable).toEqual([])
  })

  test('furniture sits inside the room it belongs to', () => {
    const misplaced = property.rooms.flatMap((room) =>
      room.furniture.filter((item) => findRoomAt([room], item.at) === undefined).map((item) => `${room.id}:${item.kind}`),
    )
    expect(misplaced).toEqual([])
  })

  test('authored camera views stand inside their room', () => {
    const outside = property.rooms.filter((room) => room.view && !findRoomAt([room], room.view.eye)).map((r) => r.id)
    expect(outside).toEqual([])
  })
})
