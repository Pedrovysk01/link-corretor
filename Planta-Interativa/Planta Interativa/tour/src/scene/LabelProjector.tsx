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
    // Rótulos de ambiente que caem um sobre o outro: empurra o de baixo para baixo até não cobrir o de cima.
    const labels = placements.filter((p) => p.el.classList.contains('room-label') && !p.isBehindCamera).sort((a, b) => a.top - b.top)
    for (let i = 0; i < labels.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = labels[j], b = labels[i]
        const dx = Math.abs(a.left - b.left), dy = b.top - a.top
        const minX = (a.el.offsetWidth + b.el.offsetWidth) / 2 + 4, minY = (a.el.offsetHeight + b.el.offsetHeight) / 2 + 4
        if (dx < minX && dy < minY) b.top = a.top + minY
      }
    }
    for (const { el, isBehindCamera, left, top } of placements) {
      el.style.transform = `translate(${left}px, ${top}px) translate(-50%, -50%)`
      el.style.visibility = isBehindCamera ? 'hidden' : 'visible'
    }
  })
  return null
}
