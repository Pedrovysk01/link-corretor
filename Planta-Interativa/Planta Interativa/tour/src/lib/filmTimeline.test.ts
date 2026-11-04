import { describe, expect, test } from 'vitest'
import { CROSSFADE, chapterAt, shotOpacity, textReveal } from './filmTimeline'

describe('chapterAt', () => {
  test('splits overall progress evenly across chapters', () => {
    expect(chapterAt(0, 5)).toEqual({ index: 0, local: 0 })
    expect(chapterAt(0.3, 5)).toEqual({ index: 1, local: expect.closeTo(0.5, 5) })
    expect(chapterAt(0.99, 5).index).toBe(4)
  })

  test('clamps progress outside 0..1 to the first and last chapter', () => {
    expect(chapterAt(-0.2, 5)).toEqual({ index: 0, local: 0 })
    expect(chapterAt(1.4, 5)).toEqual({ index: 4, local: 1 })
  })
})

describe('shotOpacity', () => {
  test('shows only the current shot in the middle of a chapter', () => {
    const at = { index: 1, local: 0.5 }

    expect(shotOpacity(at, 1)).toBe(1)
    expect(shotOpacity(at, 0)).toBe(0)
    expect(shotOpacity(at, 2)).toBe(0)
  })

  test('fades the next shot in over the end of a chapter', () => {
    const late = { index: 1, local: 1 - CROSSFADE / 2 }

    expect(shotOpacity(late, 2)).toBeGreaterThan(0)
    expect(shotOpacity(late, 2)).toBeLessThan(1)
    expect(shotOpacity(late, 1)).toBe(1)
  })

  test('never fades past the last shot', () => {
    expect(shotOpacity({ index: 4, local: 1 }, 4)).toBe(1)
    expect(shotOpacity({ index: 4, local: 1 }, 5)).toBe(0)
  })
})

describe('textReveal', () => {
  test('is hidden at the edges of a chapter and fully shown in the middle', () => {
    expect(textReveal(0, false).opacity).toBe(0)
    expect(textReveal(0.5, false)).toEqual({ opacity: 1, offset: 0 })
    expect(textReveal(1, false).opacity).toBe(0)
  })

  test('shows the opening chapter from the very first frame', () => {
    expect(textReveal(0, false, true)).toEqual({ opacity: 1, offset: 0 })
    expect(textReveal(0.95, false, true).opacity).toBe(0)
  })

  test('keeps the final chapter on screen once revealed', () => {
    expect(textReveal(1, true)).toEqual({ opacity: 1, offset: 0 })
  })

  test('slides text up as it appears', () => {
    expect(textReveal(0.12, false).offset).toBeGreaterThan(0)
  })
})
