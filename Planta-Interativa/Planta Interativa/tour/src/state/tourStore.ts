import { createStore } from 'zustand/vanilla'
import type { TourLocation, View } from './urlState'

export type TourMode = 'overview' | 'room'

export interface TourState {
  readonly view: View
  readonly propertyId: string
  readonly mode: TourMode
  readonly activeRoomId: string | null
  readonly visitedRoomIds: readonly string[]
  readonly isInquiryOpen: boolean
  /** Leave the film for the 3D tour, starting at the dollhouse overview. */
  enterTour: () => void
  /** Go back to the cinematic film. */
  showFilm: () => void
  selectProperty: (propertyId: string) => void
  enterRoom: (roomId: string) => void
  showOverview: () => void
  openInquiry: () => void
  closeInquiry: () => void
}

export const createTourStore = ({ propertyId, roomId, view }: TourLocation) =>
  createStore<TourState>()((set) => ({
    view,
    propertyId,
    mode: roomId ? 'room' : 'overview',
    activeRoomId: roomId,
    visitedRoomIds: roomId ? [roomId] : [],
    isInquiryOpen: false,

    enterTour: () => set({ view: 'tour', mode: 'overview', activeRoomId: null }),
    showFilm: () => set({ view: 'film', mode: 'overview', activeRoomId: null }),

    selectProperty: (id) =>
      set({ propertyId: id, mode: 'overview', activeRoomId: null, visitedRoomIds: [], isInquiryOpen: false }),

    enterRoom: (id) =>
      set((state) => ({
        view: 'tour',
        mode: 'room',
        activeRoomId: id,
        visitedRoomIds: state.visitedRoomIds.includes(id) ? state.visitedRoomIds : [...state.visitedRoomIds, id],
      })),

    showOverview: () => set({ mode: 'overview', activeRoomId: null }),
    openInquiry: () => set({ isInquiryOpen: true }),
    closeInquiry: () => set({ isInquiryOpen: false }),
  }))

export type TourStore = ReturnType<typeof createTourStore>
