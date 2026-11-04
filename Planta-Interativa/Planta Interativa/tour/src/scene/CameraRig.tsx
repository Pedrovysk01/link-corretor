import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Box3, Vector3 } from 'three'
import type { Property, Rect, Room } from '../data/types'
import { planBounds, viewFor } from '../lib/geometry'
import { useActiveRoom, viewerStore } from '../state/store'
import { EYE_HEIGHT } from './constants'

const { ACTION } = CameraControlsImpl

/** Distance to the look-at point inside a room. Tiny, so orbiting feels like turning your head. */
const LOOK_DISTANCE = 0.1
/** Negative speeds make dragging pan the view the way a first-person camera does. */
const LOOK_SPEED = -0.35
const KEY_TURN = Math.PI / 12
const POSE_PUBLISH_MS = 100
const OVERVIEW_MIN_DISTANCE = 6

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

const flyToOverview = (controls: CameraControlsImpl, bounds: Rect, animate: boolean, isCurrent: () => boolean) => {
  const { eye, target, size } = overviewPose(bounds)
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

const moveCamera = (controls: CameraControlsImpl, room: Room | null, bounds: Rect, isCurrent: () => boolean) => {
  const animate = !prefersReducedMotion()
  if (!room) {
    flyToOverview(controls, bounds, animate, isCurrent)
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

  useEffect(() => {
    if (!controls) return
    const token = ++transitionRef.current
    moveCamera(controls, room, bounds, () => token === transitionRef.current)
  }, [controls, room, bounds])

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
