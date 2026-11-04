import { Map as MapIcon, Minus } from 'lucide-react'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { Property, Room, Wall } from '../data/types'
import { planBounds, roomArea, roomCenter, wallLength, wallSegments } from '../lib/geometry'
import { tourStore, useTour, useViewer } from '../state/store'

const PADDING = 0.8
const PHONE_QUERY = '(max-width: 767px)'
const MAX_LABEL_SIZE = 0.7
/** Rough width of one character as a fraction of the font size. */
const CHAR_WIDTH = 0.56
const CONE_LENGTH = 2.2
const CONE_HALF_ANGLE = 0.45

interface Line {
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
}

/** Wall pieces as plan lines: solid runs at floor level, plus thin lines across glazing. */
const planLines = (wall: Wall, height: number): { solid: Line[]; glazed: Line[] } => {
  const length = wallLength(wall)
  const [dx, dz] = [(wall.to[0] - wall.from[0]) / length, (wall.to[1] - wall.from[1]) / length]
  const toLine = (start: number, end: number): Line => ({
    x1: wall.from[0] + dx * start,
    y1: wall.from[1] + dz * start,
    x2: wall.from[0] + dx * end,
    y2: wall.from[1] + dz * end,
  })
  const { solids, glass } = wallSegments(wall, height)
  return {
    solid: solids.filter((s) => s.bottom === 0 && s.top === height).map((s) => toLine(s.start, s.end)),
    glazed: glass.map((s) => toLine(s.start, s.end)),
  }
}

function ViewerMarker() {
  const x = useViewer((p) => p.x)
  const z = useViewer((p) => p.z)
  const heading = useViewer((p) => p.heading)
  const left = heading - CONE_HALF_ANGLE
  const right = heading + CONE_HALF_ANGLE
  const cone = `M ${x} ${z} L ${x + Math.sin(left) * CONE_LENGTH} ${z + Math.cos(left) * CONE_LENGTH} L ${
    x + Math.sin(right) * CONE_LENGTH
  } ${z + Math.cos(right) * CONE_LENGTH} Z`
  return (
    <g className="plan__viewer" aria-hidden="true">
      <path d={cone} />
      <circle cx={x} cy={z} r={0.32} />
    </g>
  )
}

function PlanRoom({ room, isActive, isVisited }: { readonly room: Room; readonly isActive: boolean; readonly isVisited: boolean }) {
  const { x, z, w, d } = room.rect
  const [cx, cz] = roomCenter(room)
  const enter = () => tourStore.getState().enterRoom(room.id)
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    enter()
  }
  const fontSize = Math.min(MAX_LABEL_SIZE, (w * 0.9) / (room.name.length * CHAR_WIDTH))
  const classes = ['plan__room', `plan__room--${room.kind}`, isActive && 'is-active', isVisited && 'is-visited']
  return (
    <g
      className={classes.filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      aria-label={`${room.name}, ${roomArea(room).toFixed(0)} metros quadrados`}
      aria-current={isActive ? 'location' : undefined}
      onClick={enter}
      onKeyDown={onKeyDown}
    >
      <title>{room.name}</title>
      <rect x={x} y={z} width={w} height={d} />
      <text x={cx} y={cz} fontSize={fontSize} textAnchor="middle" dominantBaseline="middle">
        {room.name}
      </text>
    </g>
  )
}

/** Clickable floor plan that doubles as a minimap showing where the visitor stands. */
export function FloorPlan({ property }: { readonly property: Property }) {
  // Phones start with the plan tucked away so the 3D view gets the screen.
  const [isCollapsed, setCollapsed] = useState(() => window.matchMedia(PHONE_QUERY).matches)
  const activeRoomId = useTour((s) => s.activeRoomId)
  const visited = useTour((s) => s.visitedRoomIds)
  const isInside = activeRoomId !== null
  // The toggle swaps one button for another; carry keyboard focus across instead of dropping it to <body>.
  const wasToggledRef = useRef(false)
  const toggle = (collapse: boolean) => {
    wasToggledRef.current = true
    setCollapsed(collapse)
  }
  const focusAfterToggle = (el: HTMLButtonElement | null) => {
    if (!el || !wasToggledRef.current) return
    wasToggledRef.current = false
    el.focus()
  }

  const { viewBox, lines } = useMemo(() => {
    const b = planBounds(property.rooms)
    return {
      viewBox: `${b.x - PADDING} ${b.z - PADDING} ${b.w + PADDING * 2} ${b.d + PADDING * 2}`,
      lines: property.walls.map((wall) => planLines(wall, property.wallHeight)),
    }
  }, [property])

  if (isCollapsed) {
    return (
      <button ref={focusAfterToggle} type="button" className="glass plan-toggle" onClick={() => toggle(false)} aria-expanded="false">
        <MapIcon size={18} aria-hidden="true" /> Floor plan
      </button>
    )
  }

  return (
    <section className="glass plan" aria-label="Planta baixa">
      <header className="plan__header">
        <h2 className="eyebrow">Planta baixa</h2>
        <div className="plan__actions">
          {isInside && (
            <button type="button" className="link-button" onClick={() => tourStore.getState().showOverview()}>
              Visão geral
            </button>
          )}
          <button
            ref={focusAfterToggle}
            type="button"
            className="icon-button"
            onClick={() => toggle(true)}
            aria-label="Ocultar planta baixa"
            aria-expanded="true"
          >
            <Minus size={18} aria-hidden="true" />
          </button>
        </div>
      </header>
      <svg className="plan__svg" viewBox={viewBox} role="group" aria-label={`Ambientes de ${property.name}`}>
        {property.rooms.map((room) => (
          <PlanRoom key={room.id} room={room} isActive={room.id === activeRoomId} isVisited={visited.includes(room.id)} />
        ))}
        <g className="plan__walls" aria-hidden="true">
          {lines.flatMap(({ solid }, i) => solid.map((l, j) => <line key={`s${i}-${j}`} {...l} />))}
        </g>
        <g className="plan__glazing" aria-hidden="true">
          {lines.flatMap(({ glazed }, i) => glazed.map((l, j) => <line key={`g${i}-${j}`} {...l} />))}
        </g>
        {isInside && <ViewerMarker />}
      </svg>
    </section>
  )
}
