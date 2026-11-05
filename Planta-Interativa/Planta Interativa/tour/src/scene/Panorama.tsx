import { useLoader } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { BackSide, SRGBColorSpace, TextureLoader } from 'three'
import { EYE_HEIGHT } from './constants'
import type { Room } from '../data/types'
import { viewFor } from '../lib/geometry'

/** Panorama 360° do ambiente: uma esfera com a foto equirretangular por dentro, centrada no olho do visitante.
 *  A câmera continua a mesma do tour (girar = olhar em volta). Só entra quando o arquivo existe. */
function Esfera({ url, room }: { readonly url: string; readonly room: Room }) {
  const tex = useLoader(TextureLoader, url)
  tex.colorSpace = SRGBColorSpace
  const { eye } = viewFor(room)
  return (
    <mesh position={[eye[0], EYE_HEIGHT, eye[1]]} scale={[-1, 1, 1]} renderOrder={1000}>
      <sphereGeometry args={[4, 64, 48]} />
      <meshBasicMaterial map={tex} side={BackSide} toneMapped={false} depthWrite={false} depthTest={false} fog={false} />
    </mesh>
  )
}

export function Panorama({ room, on, onExiste }: { readonly room: Room; readonly on: boolean; readonly onExiste?: (ok: boolean) => void }) {
  const [existe, setExiste] = useState(false)
  const url = room.pano ? `${import.meta.env.BASE_URL}${room.pano}` : null
  useEffect(() => {
    setExiste(false); onExiste?.(false)
    if (!url) return
    let vivo = true
    fetch(url, { method: 'HEAD' }).then((r) => { if (vivo && r.ok && /image/.test(r.headers.get('content-type') || '')) { setExiste(true); onExiste?.(true) } }).catch(() => {})
    return () => { vivo = false }
  }, [url])
  if (!on || !url || !existe) return null
  return (
    <Suspense fallback={null}>
      <Esfera url={url} room={room} />
    </Suspense>
  )
}

/** O ambiente atual tem panorama disponível? (para a UI mostrar o botão) */
export const temPano = (room: Room | null) => !!(room && room.pano)
