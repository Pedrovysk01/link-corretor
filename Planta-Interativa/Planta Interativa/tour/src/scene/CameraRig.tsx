import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Box3, Vector3 } from 'three'
import type { Property, Rect, Room } from '../data/types'
import { planBounds, viewFor } from '../lib/geometry'
import { introJaFeita, introKey, prefersReducedMotion, querIntro } from '../lib/intro'
import { useActiveRoom, viewerStore } from '../state/store'
import { cidadeGroundY } from './Cidade'
import { EYE_HEIGHT } from './constants'

const { ACTION } = CameraControlsImpl

/** Distance to the look-at point inside a room. Tiny, so orbiting feels like turning your head. */
const LOOK_DISTANCE = 0.1
/** Negative speeds make dragging pan the view the way a first-person camera does. */
const LOOK_SPEED = -0.35
const KEY_TURN = Math.PI / 12
const POSE_PUBLISH_MS = 100
const OVERVIEW_MIN_DISTANCE = 6

/** Abertura do 3D: começa sobre o mapa de satélite da cidade e desce em zoom contínuo até o corte do pavimento. */
const INTRO_MS = 7000
const INTRO_START_HEIGHT = 1200
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const overviewPose = (bounds: Rect) => {
  const cx = bounds.x + bounds.w / 2
  const cz = bounds.z + bounds.d / 2
  const size = Math.max(bounds.w, bounds.d)
  return { eye: new Vector3(cx - size * 0.25, size * 1.05, cz + size * 0.8), target: new Vector3(cx, 0, cz), size }
}

const configureOverview = (controls: CameraControlsImpl, bounds: Rect) => {
  controls.mouseButtons.left = ACTION.ROTATE
  controls.mouseButtons.right = ACTION.TRUCK
  controls.mouseButtons.wheel = ACTION.DOLLY
  controls.touches.one = ACTION.TOUCH_ROTATE
  controls.touches.two = ACTION.TOUCH_DOLLY_TRUCK
  controls.azimuthRotateSpeed = 1
  controls.polarRotateSpeed = 1
  controls.minPolarAngle = 0.15
  controls.maxPolarAngle = 1.25
  controls.setBoundary(new Box3(new Vector3(bounds.x, 0, bounds.z), new Vector3(bounds.x + bounds.w, 0, bounds.z + bounds.d)))
}

const configureRoom = (controls: CameraControlsImpl) => {
  controls.mouseButtons.left = ACTION.ROTATE
  controls.mouseButtons.right = ACTION.NONE
  controls.mouseButtons.wheel = ACTION.NONE
  controls.touches.one = ACTION.TOUCH_ROTATE
  controls.touches.two = ACTION.NONE
  controls.azimuthRotateSpeed = LOOK_SPEED
  controls.polarRotateSpeed = LOOK_SPEED
  controls.minPolarAngle = 0.35
  controls.maxPolarAngle = Math.PI - 0.35
  controls.minDistance = 0
  controls.maxDistance = LOOK_DISTANCE
  controls.setBoundary()
}

const flyIntoRoom = (controls: CameraControlsImpl, room: Room, animate: boolean) => {
  const { eye, look } = viewFor(room)
  const dir = new Vector3(look[0] - eye[0], -0.15, look[1] - eye[1]).normalize().multiplyScalar(LOOK_DISTANCE)
  return controls.setLookAt(eye[0], EYE_HEIGHT, eye[1], eye[0] + dir.x, EYE_HEIGHT + dir.y, eye[1] + dir.z, animate)
}

const flyToOverview = (controls: CameraControlsImpl, bounds: Rect, focus: Rect, animate: boolean, isCurrent: () => boolean) => {
  const { eye, target, size } = overviewPose(focus)
  controls.minDistance = 0
  controls.maxDistance = Infinity
  configureOverview(controls, bounds)
  void controls.setLookAt(eye.x, eye.y, eye.z, target.x, target.y, target.z, animate).then(() => {
    // Only tighten the zoom limits once the camera has arrived, and only if no newer move started.
    if (!isCurrent()) return
    controls.minDistance = OVERVIEW_MIN_DISTANCE
    controls.maxDistance = size * 2.2
  })
}

const runIntro = (controls: CameraControlsImpl, bounds: Rect, focus: Rect, floorsBelow: number, isCurrent: () => boolean, onEnd: () => void) => {
  configureOverview(controls, bounds)
  const { eye, target } = overviewPose(focus)
  const endDir = eye.clone().sub(target)
  const endDist = endDir.length()
  endDir.normalize()
  const startDir = new Vector3(0, 1, 0.12).normalize() // quase a prumo, olhando o mapa
  const startTarget = new Vector3(target.x, cidadeGroundY(floorsBelow), target.z)
  const pos = new Vector3()
  const dir = new Vector3()
  const tgt = new Vector3()
  controls.setBoundary()
  controls.minDistance = 0
  controls.maxDistance = Infinity
  controls.minPolarAngle = 0
  controls.maxPolarAngle = Math.PI
  controls.enabled = false
  let raf = 0
  let t0 = performance.now()
  let ended = false
  const finish = () => {
    if (ended) return
    ended = true
    cancelAnimationFrame(raf)
    window.removeEventListener('pointerdown', skip, true)
    window.removeEventListener('wheel', skip, true)
    window.removeEventListener('keydown', skip, true)
    controls.enabled = true
    document.body.classList.remove('intro-on')
    onEnd()
  }
  const skip = () => {
    t0 = performance.now() - INTRO_MS
  }
  window.addEventListener('pointerdown', skip, true)
  window.addEventListener('wheel', skip, true)
  window.addEventListener('keydown', skip, true)
  const frame = (now: number) => {
    if (!isCurrent()) return finish()
    const p = Math.min(1, (now - t0) / INTRO_MS)
    const e = easeInOut(p)
    const dist = INTRO_START_HEIGHT * Math.pow(endDist / INTRO_START_HEIGHT, e) // zoom constante: cada instante aproxima na mesma proporção
    dir.lerpVectors(startDir, endDir, e * e).normalize() // só inclina perto do fim
    tgt.lerpVectors(startTarget, target, e)
    pos.copy(tgt).addScaledVector(dir, dist)
    void controls.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, false)
    if (p < 1) raf = requestAnimationFrame(frame)
    else finish()
  }
  raf = requestAnimationFrame(frame)
  return finish
}

/** Espera a tela de carregamento sair para a abertura não rodar escondida. */
const whenLoaded = (start: () => void) => {
  let tries = 0
  const id = window.setInterval(() => {
    const loader = document.querySelector('.loader')
    if (!loader || loader.classList.contains('is-done') || ++tries > 120) {
      window.clearInterval(id)
      start()
    }
  }, 100)
  return () => window.clearInterval(id)
}

const moveCamera = (controls: CameraControlsImpl, room: Room | null, bounds: Rect, focus: Rect, isCurrent: () => boolean) => {
  const animate = !prefersReducedMotion()
  if (!room) {
    flyToOverview(controls, bounds, focus, animate, isCurrent)
    return
  }
  configureRoom(controls)
  void flyIntoRoom(controls, room, animate)
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** Drives the camera between the dollhouse overview and eye-level views inside rooms. */
export function CameraRig({ property }: { readonly property: Property }) {
  // Held in state, not a ref: the controls are created after this component's first effects run.
  const [controls, setControls] = useState<CameraControlsImpl | null>(null)
  const transitionRef = useRef(0)
  const lastPublishRef = useRef(0)
  const room = useActiveRoom()
  const bounds = useMemo(() => planBounds(property.rooms), [property])
  const focus = property.focus ?? bounds

  useEffect(() => {
    if (!controls) return
    const token = ++transitionRef.current
    const isCurrent = () => token === transitionRef.current
    const key = introKey(property)
    if (key && querIntro(property, room !== null)) {
      let cancelIntro: (() => void) | null = null
      document.body.classList.add('intro-on') // painéis e rótulos só voltam quando a câmera chega
      const cancelWait = whenLoaded(() => {
        introJaFeita.add(key)
        cancelIntro = runIntro(controls, bounds, focus, property.floorsBelow ?? 1, isCurrent, () => {
          if (isCurrent()) flyToOverview(controls, bounds, focus, false, isCurrent)
        })
      })
      return () => {
        cancelWait()
        cancelIntro?.()
        if (!introJaFeita.has(key)) document.body.classList.remove('intro-on')
      }
    }
    document.body.classList.remove('intro-on')
    moveCamera(controls, room, bounds, focus, isCurrent)
  }, [controls, room, bounds, focus, property])

  useEffect(() => {
    if (!room || !controls) return
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || document.querySelector('dialog[open]')) return
      if (event.key === 'ArrowLeft') void controls.rotate(KEY_TURN, 0, true)
      if (event.key === 'ArrowRight') void controls.rotate(-KEY_TURN, 0, true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [room, controls])

  const direction = useMemo(() => new Vector3(), [])
  useFrame(({ camera, clock }) => {
    const now = clock.elapsedTime * 1000
    if (now - lastPublishRef.current < POSE_PUBLISH_MS) return
    lastPublishRef.current = now
    camera.getWorldDirection(direction)
    viewerStore.setState({ x: camera.position.x, z: camera.position.z, heading: Math.atan2(direction.x, direction.z) })
  })

  return <CameraControls ref={setControls} makeDefault smoothTime={0.6} draggingSmoothTime={0.12} />
}
