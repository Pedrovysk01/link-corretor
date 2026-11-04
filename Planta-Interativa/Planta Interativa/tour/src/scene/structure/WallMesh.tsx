import { useMemo } from 'react'
import type { Wall } from '../../data/types'
import { wallLength, wallSegments, type Span } from '../../lib/geometry'
import { EXTERIOR_WALL, INTERIOR_WALL } from '../constants'
import { MATERIALS } from '../materials'
import { OpeningDetail } from './OpeningDetail'

const SKIRTING_HEIGHT = 0.09
const SKIRTING_PROUD = 0.012

/** Extends spans that meet a wall end by half a thickness so corners close neatly. */
const spanBox = (span: Span, length: number, thickness: number) => {
  const start = span.start === 0 ? -thickness / 2 : span.start
  const end = span.end >= length ? length + thickness / 2 : span.end
  return { centre: (start + end) / 2, width: end - start }
}

/** One wall: solid plaster around its openings, skirting at the floor, and framed doors and glazing. */
export function WallMesh({ wall, height }: { readonly wall: Wall; readonly height: number }) {
  const { solids, length, angle } = useMemo(() => {
    const dx = wall.to[0] - wall.from[0]
    const dz = wall.to[1] - wall.from[1]
    return { solids: wallSegments(wall, height).solids, length: wallLength(wall), angle: -Math.atan2(dz, dx) }
  }, [wall, height])
  const thickness = wall.exterior ? EXTERIOR_WALL : INTERIOR_WALL
  const material = wall.exterior ? MATERIALS.facade : MATERIALS.plaster

  return (
    <group position={[wall.from[0], 0, wall.from[1]]} rotation={[0, angle, 0]}>
      {solids.map((span) => {
        const box = spanBox(span, length, thickness)
        const isOnFloor = span.bottom === 0 && span.top - span.bottom > SKIRTING_HEIGHT
        return (
          <group key={`${span.start}-${span.bottom}`}>
            <mesh position={[box.centre, (span.bottom + span.top) / 2, 0]} material={material} castShadow receiveShadow>
              <boxGeometry args={[box.width, span.top - span.bottom, thickness]} />
            </mesh>
            {isOnFloor && (
              <mesh position={[box.centre, SKIRTING_HEIGHT / 2, 0]} material={MATERIALS.skirting} receiveShadow>
                <boxGeometry args={[box.width, SKIRTING_HEIGHT, thickness + SKIRTING_PROUD * 2]} />
              </mesh>
            )}
          </group>
        )
      })}
      {(wall.openings ?? []).map((opening) => (
        <OpeningDetail key={`${opening.kind}-${opening.offset}`} opening={opening} thickness={thickness} />
      ))}
    </group>
  )
}
