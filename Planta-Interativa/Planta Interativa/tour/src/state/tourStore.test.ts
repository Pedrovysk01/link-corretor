import { describe, expect, test } from 'vitest'
import { createTourStore } from './tourStore'

const fresh = () => createTourStore({ propertyId: 'villa-serena', roomId: null, view: 'film' })

describe('tourStore', () => {
  test('starts in overview when no room is given', () => {
    const state = fresh().getState()

    expect(state.mode).toBe('overview')
    expect(state.activeRoomId).toBeNull()
  })

  test('starts inside a room from a deep link and counts it as visited', () => {
    const state = createTourStore({ propertyId: 'villa-serena', roomId: 'kitchen', view: 'tour' }).getState()

    expect(state.mode).toBe('room')
    expect(state.visitedRoomIds).toEqual(['kitchen'])
  })

  test('entering rooms records each visit once, in order', () => {
    const store = fresh()

    store.getState().enterRoom('living')
    store.getState().enterRoom('kitchen')
    store.getState().enterRoom('living')

    expect(store.getState().activeRoomId).toBe('living')
    expect(store.getState().visitedRoomIds).toEqual(['living', 'kitchen'])
  })

  test('does not mutate earlier state snapshots', () => {
    const store = fresh()
    store.getState().enterRoom('living')
    const before = store.getState().visitedRoomIds

    store.getState().enterRoom('kitchen')

    expect(before).toEqual(['living'])
  })

  test('showOverview leaves the room but keeps the visit history', () => {
    const store = fresh()
    store.getState().enterRoom('living')

    store.getState().showOverview()

    expect(store.getState().mode).toBe('overview')
    expect(store.getState().activeRoomId).toBeNull()
    expect(store.getState().visitedRoomIds).toEqual(['living'])
  })

  test('switching property resets the tour', () => {
    const store = fresh()
    store.getState().enterRoom('living')
    store.getState().openInquiry()

    store.getState().selectProperty('skyline-12b')

    const state = store.getState()
    expect(state.propertyId).toBe('skyline-12b')
    expect(state.mode).toBe('overview')
    expect(state.visitedRoomIds).toEqual([])
    expect(state.isInquiryOpen).toBe(false)
  })

  test('starts on the film and moves into the tour', () => {
    const store = fresh()
    expect(store.getState().view).toBe('film')

    store.getState().enterTour()
    expect(store.getState().view).toBe('tour')
    expect(store.getState().mode).toBe('overview')

    store.getState().showFilm()
    expect(store.getState().view).toBe('film')
    expect(store.getState().activeRoomId).toBeNull()
  })

  test('entering a room always switches to the tour', () => {
    const store = fresh()

    store.getState().enterRoom('living')

    expect(store.getState().view).toBe('tour')
  })

  test('opens and closes the inquiry form', () => {
    const store = fresh()

    store.getState().openInquiry()
    expect(store.getState().isInquiryOpen).toBe(true)

    store.getState().closeInquiry()
    expect(store.getState().isInquiryOpen).toBe(false)
  })
})
