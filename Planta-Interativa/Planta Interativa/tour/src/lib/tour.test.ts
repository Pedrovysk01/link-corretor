import { describe, expect, test } from 'vitest'
import { tourStep } from './tour'

describe('tourStep', () => {
  const tour = ['hall', 'living', 'kitchen'] as const

  test('reports neighbours in the middle of the tour', () => {
    expect(tourStep(tour, 'living')).toEqual({ index: 1, total: 3, prev: 'hall', next: 'kitchen' })
  })

  test('has no previous stop at the start and no next stop at the end', () => {
    expect(tourStep(tour, 'hall').prev).toBeNull()
    expect(tourStep(tour, 'kitchen').next).toBeNull()
  })

  test('starts the tour from the beginning for rooms outside it', () => {
    expect(tourStep(tour, 'garage')).toEqual({ index: -1, total: 3, prev: null, next: 'hall' })
  })
})
