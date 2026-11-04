import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import type { Room } from '../data/types'
import { tourStore, useTour } from '../state/store'
import { DRAG_THRESHOLD_PX, FLOOR_TOP } from './constants'
import { floorSurface } from './materials'

const HOVER_GLOW = '#14b8a6'
const HOVER_INTENSITY = 0.35

function RoomFloor({ room }: { readonly room: Room }) {
  const { x, z, w, d } = room.rect
  const surface = useMemo(() => floorSurface(room.floor, w, d), [room.floor, w, d])
  const [isHovered, setHovered] = useState(false)
  const isActive = useTour((s) => s.activeRoomId === room.id)

  useEffect(
    () => () => {
      for (const texture of Object.values(surface)) texture.dispose()
    },
    [surface],
  )

  useEffect(() => {
    if (!isHovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [isHovered])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > DRAG_THRESHOLD_PX || isActive) return
    tourStore.getState().enterRoom(room.id)
  }

  return (
    <mesh
      position={[x + w / 2, FLOOR_TOP / 2, z + d / 2]}
      receiveShadow
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[w, FLOOR_TOP, d]} />
      <meshStandardMaterial
        {...surface}
        emissive={HOVER_GLOW}
        emissiveIntensity={isHovered && !isActive ? HOVER_INTENSITY : 0}
      />
    </mesh>
  )
}

/** Clickable floors for every room. */
export function RoomFloors({ rooms }: { readonly rooms: readonly Room[] }) {
  return (
    <group>
      {rooms.map((room) => (
        <RoomFloor key={room.id} room={room} />
      ))}
    </group>
  )
}
