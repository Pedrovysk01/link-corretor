import { describe, expect, test } from 'vitest'
import { getProperty, getRoom } from '../data/properties'
import { startUrlSync, tourStore } from '../state/store'
import { formatArea, formatPrice } from './format'
import { seededRandom } from './random'

describe('format', () => {
  test('formats prices without cents and areas in square metres', () => {
    expect(formatPrice(1_850_000, 'USD')).toBe('$1,850,000')
    expect(formatArea(69.6)).toBe('70 m²')
  })
})

describe('seededRandom', () => {
  test('repeats the same sequence for the same seed and stays in [0, 1)', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    const values = Array.from({ length: 50 }, () => a())

    expect(values).toEqual(Array.from({ length: 50 }, () => b()))
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
  })
})

describe('getRoom', () => {
  test('finds a room and rejects unknown ids', () => {
    const villa = getProperty('villa-serena')

    expect(getRoom(villa, 'kitchen').name).toBe('Kitchen & Dining')
    expect(() => getRoom(villa, 'garage')).toThrow(/Unknown room "garage"/)
  })
})

describe('startUrlSync', () => {
  test('mirrors property and room changes into the address bar', () => {
    tourStore.getState().selectProperty('villa-serena')
    const stop = startUrlSync()

    tourStore.getState().enterRoom('terrace')
    expect(window.location.search).toBe('?property=villa-serena&room=terrace')

    tourStore.getState().selectProperty('skyline-12b')
    expect(window.location.search).toBe('?property=skyline-12b&view=tour')

    tourStore.getState().showFilm()
    expect(window.location.search).toBe('?property=skyline-12b')

    stop()
  })
})
