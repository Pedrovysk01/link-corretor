import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { KNOWN_ROOMS, getProperty, getRoom } from '../data/properties'
import type { Property, Room } from '../data/types'
import { createTourStore, type TourState } from './tourStore'
import { parseTourUrl, tourSearch } from './urlState'

/** The app's single tour store, seeded from the deep link in the URL. */
export const tourStore = createTourStore(parseTourUrl(window.location.search, KNOWN_ROOMS))

export const useTour = <T>(selector: (state: TourState) => T): T => useStore(tourStore, selector)

export const useProperty = (): Property => getProperty(useTour((s) => s.propertyId))

export const useActiveRoom = (): Room | null => {
  const property = useProperty()
  const roomId = useTour((s) => s.activeRoomId)
  return roomId ? getRoom(property, roomId) : null
}

/** Keeps the address bar in step with the tour so any view can be shared as a link. */
export const startUrlSync = (): (() => void) =>
  tourStore.subscribe((state, prev) => {
    const isSame = state.propertyId === prev.propertyId && state.activeRoomId === prev.activeRoomId && state.view === prev.view
    if (isSame) return
    window.history.replaceState(null, '', tourSearch({ propertyId: state.propertyId, roomId: state.activeRoomId, view: state.view }))
  })

export interface ViewerPose {
  readonly x: number
  readonly z: number
  /** Radians; 0 looks towards +z (south on the plan). */
  readonly heading: number
}

/** Where the camera stands, published a few times a second for the floor-plan marker. */
export const viewerStore = createStore<ViewerPose>()(() => ({ x: 0, z: 0, heading: 0 }))

export const useViewer = <T>(selector: (pose: ViewerPose) => T): T => useStore(viewerStore, selector)
