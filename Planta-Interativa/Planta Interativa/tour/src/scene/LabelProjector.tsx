import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { MathUtils, Vector3 } from 'three'

/** Attribute that marks a DOM element as pinned to a 3D point stored in data-x/y/z. */
export const ANCHOR_SELECTOR = '[data-anchor]'
/** Gap kept between a label and the viewport edge so it is never cut off. */
const EDGE_MARGIN = 8

/**
 * Moves every anchored DOM label to its 3D point's screen position each frame.
 * Labels live in normal React DOM (see SceneLabels); this keeps them out of the WebGL tree.
 */
export function LabelProjector() {
  const point = useMemo(() => new Vector3(), [])
  useFrame(({ camera, size }) => {
    // All layout reads first, then all style writes, so the browser lays out once per frame.
    const placements = Array.from(document.querySelectorAll<HTMLElement>(ANCHOR_SELECTOR), (el) => {
      point.set(Number(el.dataset.x), Number(el.dataset.y), Number(el.dataset.z)).project(camera)
      const halfWidth = el.offsetWidth / 2 + EDGE_MARGIN
      const halfHeight = el.offsetHeight / 2 + EDGE_MARGIN
      return {
        el,
        isBehindCamera: point.z > 1,
        left: MathUtils.clamp(((point.x + 1) / 2) * size.width, halfWidth, size.width - halfWidth),
        top: MathUtils.clamp(((1 - point.y) / 2) * size.height, halfHeight, size.height - halfHeight),
      }
    })
    for (const { el, isBehindCamera, left, top } of placements) {
      el.style.transform = `translate(${left}px, ${top}px) translate(-50%, -50%)`
      el.style.visibility = isBehindCamera ? 'hidden' : 'visible'
    }
  })
  return null
}
