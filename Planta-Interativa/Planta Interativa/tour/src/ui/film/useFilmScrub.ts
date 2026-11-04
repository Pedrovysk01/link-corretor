import { useEffect, useRef, type RefObject } from 'react'
import { chapterAt, shotOpacity, textReveal, type ChapterPosition } from '../../lib/filmTimeline'

/** How quickly the film catches up with the scroll position each frame (0..1). Lower is silkier. */
const SMOOTHING = 0.12
/** Only seek when the wanted frame differs by more than this, in seconds, to avoid thrashing the decoder. */
const SEEK_EPSILON = 1 / 60
/** Stay just short of the clip's end, where some browsers show a black frame. */
const END_MARGIN = 0.05

interface FilmElements {
  readonly scroller: RefObject<HTMLElement | null>
  readonly videos: RefObject<(HTMLVideoElement | null)[]>
  readonly texts: RefObject<(HTMLElement | null)[]>
  readonly progressBar: RefObject<HTMLElement | null>
}

const seek = (video: HTMLVideoElement, fraction: number) => {
  if (!Number.isFinite(video.duration) || video.seeking) return
  const time = fraction * Math.max(0, video.duration - END_MARGIN)
  if (Math.abs(video.currentTime - time) > SEEK_EPSILON) video.currentTime = time
}

const paint = (position: ChapterPosition, progress: number, elements: FilmElements, count: number) => {
  elements.videos.current.forEach((video, i) => {
    if (!video) return
    const opacity = shotOpacity(position, i)
    video.style.opacity = String(opacity)
    // The shot fading in waits on its first frame; the current shot follows the scroll.
    if (opacity > 0) seek(video, i === position.index ? position.local : 0)
  })
  elements.texts.current.forEach((text, i) => {
    if (!text) return
    const { opacity, offset } =
      i === position.index ? textReveal(position.local, i === count - 1, i === 0) : { opacity: 0, offset: 0 }
    text.style.opacity = String(opacity)
    text.style.transform = `translateY(${offset}px)`
    text.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
  })
  if (elements.progressBar.current) elements.progressBar.current.style.transform = `scaleX(${progress})`
}

/**
 * Drives the scroll-scrubbed film: each animation frame eases towards the scroll position, picks the
 * chapter, cross-fades shots, seeks the active clip and reveals its text. Writes go straight to the
 * DOM so React only re-renders when the chapter number changes.
 */
export function useFilmScrub(elements: FilmElements, count: number, onChapter: (index: number) => void) {
  const onChapterRef = useRef(onChapter)
  useEffect(() => {
    onChapterRef.current = onChapter
  }, [onChapter])

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let smooth = 0
    let chapter = -1
    let frame = 0

    const tick = () => {
      const scroller = elements.scroller.current
      if (scroller) {
        const max = scroller.scrollHeight - scroller.clientHeight
        const target = max > 0 ? scroller.scrollTop / max : 0
        smooth = isReduced ? target : smooth + (target - smooth) * SMOOTHING
        const position = chapterAt(smooth, count)
        paint(position, smooth, elements, count)
        if (position.index !== chapter) {
          chapter = position.index
          onChapterRef.current(chapter)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [elements, count])
}
