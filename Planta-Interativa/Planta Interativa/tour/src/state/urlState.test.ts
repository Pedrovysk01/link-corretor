import { describe, expect, test } from 'vitest'
import { parseTourUrl, tourSearch } from './urlState'

const known = { 'villa-serena': ['living', 'kitchen'], 'skyline-12b': ['lounge'] }

describe('parseTourUrl', () => {
  test('opens the film by default', () => {
    expect(parseTourUrl('', known)).toEqual({ propertyId: 'villa-serena', roomId: null, view: 'film' })
  })

  test('opens the tour overview when asked', () => {
    expect(parseTourUrl('?property=skyline-12b&view=tour', known)).toEqual({
      propertyId: 'skyline-12b',
      roomId: null,
      view: 'tour',
    })
  })

  test('reads a property and room from the query string and goes straight to the tour', () => {
    expect(parseTourUrl('?property=villa-serena&room=kitchen', known)).toEqual({
      propertyId: 'villa-serena',
      roomId: 'kitchen',
      view: 'tour',
    })
  })

  test('falls back to the first property when the id is unknown', () => {
    expect(parseTourUrl('?property=castle&room=kitchen', known)).toEqual({ propertyId: 'villa-serena', roomId: null, view: 'film' })
  })

  test.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])('ignores the prototype key "%s"', (key) => {
    expect(parseTourUrl(`?property=${key}&room=x`, known)).toEqual({ propertyId: 'villa-serena', roomId: null, view: 'film' })
  })

  test('drops a room that does not belong to the property', () => {
    expect(parseTourUrl('?property=skyline-12b&room=kitchen', known)).toEqual({ propertyId: 'skyline-12b', roomId: null, view: 'film' })
  })
})

describe('tourSearch', () => {
  test('serialises property and room', () => {
    expect(tourSearch({ propertyId: 'villa-serena', roomId: 'kitchen', view: 'tour' })).toBe('?property=villa-serena&room=kitchen')
  })

  test('marks the tour overview', () => {
    expect(tourSearch({ propertyId: 'villa-serena', roomId: null, view: 'tour' })).toBe('?property=villa-serena&view=tour')
  })

  test('leaves the film as the plain link', () => {
    expect(tourSearch({ propertyId: 'villa-serena', roomId: null, view: 'film' })).toBe('?property=villa-serena')
  })
})
