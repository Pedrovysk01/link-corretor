export interface TourStep {
  /** Position of the room in the tour, or -1 when the room is not a tour stop. */
  readonly index: number
  readonly total: number
  readonly prev: string | null
  readonly next: string | null
}

export const tourStep = (tour: readonly string[], roomId: string): TourStep => {
  const index = tour.indexOf(roomId)
  return {
    index,
    total: tour.length,
    prev: index > 0 ? tour[index - 1] : null,
    next: tour[index + 1] ?? null,
  }
}
