/** Fraction of each chapter, at its end, spent cross-fading into the next shot. */
export const CROSSFADE = 0.18

const TEXT_IN: readonly [number, number] = [0.06, 0.26]
const TEXT_OUT: readonly [number, number] = [0.72, 0.9]
/** How far, in pixels, chapter text rises as it fades in. */
const TEXT_RISE = 28

export interface ChapterPosition {
  /** Which chapter the scroll is in. */
  readonly index: number
  /** 0 at the start of that chapter, 1 at its end. */
  readonly local: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Maps overall scroll progress (0..1) onto equal-length chapters. */
export const chapterAt = (progress: number, count: number): ChapterPosition => {
  const scaled = clamp01(progress) * count
  const index = Math.min(count - 1, Math.floor(scaled))
  return { index, local: scaled - index }
}

/**
 * Opacity of shot `shot` at a scroll position. The current shot is fully visible and the next one
 * fades in over the last part of the chapter; the film's very end (local 1) never fades onwards.
 */
export const shotOpacity = ({ index, local }: ChapterPosition, shot: number): number => {
  if (shot === index) return 1
  if (shot === index + 1 && local < 1) return smoothstep(1 - CROSSFADE, 1, local)
  return 0
}

/**
 * Fade and rise for a chapter's text. The opening chapter is already on screen when the page loads,
 * and the final chapter's call to action stays once shown.
 */
export const textReveal = (local: number, isFinal: boolean, isFirst = false): { opacity: number; offset: number } => {
  const shown = isFirst ? 1 : smoothstep(TEXT_IN[0], TEXT_IN[1], local)
  const hidden = isFinal ? 0 : smoothstep(TEXT_OUT[0], TEXT_OUT[1], local)
  return { opacity: shown * (1 - hidden), offset: (1 - shown) * TEXT_RISE }
}
