import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test } from 'vitest'
import { getProperty, getRoom } from '../data/properties'
import { tourStore } from '../state/store'
import { FloorPlan } from './FloorPlan'
import { HintBar } from './HintBar'
import { InquiryDialog } from './InquiryDialog'
import { LoadingScreen } from './LoadingScreen'
import { PropertyCard } from './PropertyCard'
import { RoomPanel } from './RoomPanel'
import { SceneLabels } from './SceneLabels'
import { TopBar } from './TopBar'

const villa = getProperty('villa-serena')

beforeEach(() => {
  tourStore.getState().selectProperty('villa-serena')
})

describe('PropertyCard', () => {
  test('shows the headline facts and starts the guided tour at the first stop', async () => {
    render(<PropertyCard property={villa} />)

    expect(screen.getByRole('heading', { name: 'Villa Serena' })).toBeInTheDocument()
    expect(screen.getByText('$1,850,000')).toBeInTheDocument()
    expect(screen.getByText('280 m²')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /start guided tour/i }))

    expect(tourStore.getState().activeRoomId).toBe(villa.tour[0])
  })

  test('opens the inquiry form from the brochure button', async () => {
    render(<PropertyCard property={villa} />)

    await userEvent.click(screen.getByRole('button', { name: /request brochure/i }))

    expect(tourStore.getState().isInquiryOpen).toBe(true)
  })
})

describe('RoomPanel', () => {
  test('moves forward and back through the tour', async () => {
    tourStore.getState().enterRoom('living')
    const { rerender } = render(<RoomPanel property={villa} room={getRoom(villa, 'living')} />)
    expect(screen.getByText(/stop 2 of 9/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^next/i }))
    expect(tourStore.getState().activeRoomId).toBe('kitchen')

    rerender(<RoomPanel property={villa} room={getRoom(villa, 'kitchen')} />)
    await userEvent.click(screen.getByRole('button', { name: /previous/i }))
    expect(tourStore.getState().activeRoomId).toBe('living')
  })

  test('disables Previous on the first stop', () => {
    render(<RoomPanel property={villa} room={getRoom(villa, villa.tour[0])} />)

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  test('ends the tour with a request for details', async () => {
    const last = villa.tour[villa.tour.length - 1]
    render(<RoomPanel property={villa} room={getRoom(villa, last)} />)

    await userEvent.click(screen.getByRole('button', { name: /request details/i }))

    expect(tourStore.getState().isInquiryOpen).toBe(true)
  })

  test('returns to the overview', async () => {
    tourStore.getState().enterRoom('living')
    render(<RoomPanel property={villa} room={getRoom(villa, 'living')} />)

    await userEvent.click(screen.getByRole('button', { name: /back to overview/i }))

    expect(tourStore.getState().mode).toBe('overview')
  })
})

describe('FloorPlan', () => {
  test('enters a room when it is clicked or chosen with the keyboard', async () => {
    render(<FloorPlan property={villa} />)

    await userEvent.click(screen.getByRole('button', { name: /kitchen & dining, 70 square metres/i }))
    expect(tourStore.getState().activeRoomId).toBe('kitchen')

    screen.getByRole('button', { name: /master suite/i }).focus()
    await userEvent.keyboard('{Enter}')
    expect(tourStore.getState().activeRoomId).toBe('master')
  })

  test('marks the current room and offers a way back to the overview', async () => {
    tourStore.getState().enterRoom('living')
    render(<FloorPlan property={villa} />)

    expect(screen.getByRole('button', { name: /living room/i })).toHaveAttribute('aria-current', 'location')

    await userEvent.click(screen.getByRole('button', { name: 'Overview' }))
    expect(tourStore.getState().mode).toBe('overview')
  })

  test('collapses and expands', async () => {
    render(<FloorPlan property={villa} />)

    await userEvent.click(screen.getByRole('button', { name: /hide floor plan/i }))
    expect(screen.queryByRole('region', { name: 'Floor plan' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Floor plan' })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: /floor plan/i }))
    expect(screen.getByRole('region', { name: 'Floor plan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hide floor plan/i })).toHaveFocus()
  })
})

describe('TopBar', () => {
  test('switches property and opens the inquiry form', async () => {
    render(<TopBar />)

    await userEvent.click(screen.getByRole('button', { name: /skyline 12b/i }))
    expect(tourStore.getState().propertyId).toBe('skyline-12b')
    expect(screen.getByRole('button', { name: /skyline 12b/i })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: /enquire/i }))
    expect(tourStore.getState().isInquiryOpen).toBe(true)
  })
})

describe('SceneLabels', () => {
  test('lists every room in the overview and only neighbouring rooms inside', async () => {
    const { rerender } = render(<SceneLabels property={villa} />)
    expect(screen.getAllByRole('button')).toHaveLength(villa.rooms.length)

    await userEvent.click(screen.getByRole('button', { name: /pool terrace/i }))
    rerender(<SceneLabels property={villa} />)

    const doorways = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(doorways).toEqual(expect.arrayContaining(['Go to Living Room', 'Go to Kitchen & Dining']))
    expect(doorways).toHaveLength(2)
  })
})

describe('InquiryDialog', () => {
  test('opens from the store and closes again', async () => {
    render(<InquiryDialog />)
    const dialog = screen.getByRole('dialog', { hidden: true })
    expect(dialog).not.toHaveAttribute('open')

    tourStore.getState().openInquiry()
    expect(await screen.findByLabelText('Full name')).toBeInTheDocument()
    expect(dialog).toHaveAttribute('open')

    await userEvent.click(screen.getByRole('button', { name: /close inquiry form/i }))
    expect(tourStore.getState().isInquiryOpen).toBe(false)
  })
})

describe('HintBar and LoadingScreen', () => {
  test('hint follows the mode', () => {
    render(<HintBar />)
    expect(screen.getByRole('status')).toHaveTextContent(/click any room/i)
  })

  test('loading screen announces readiness', () => {
    const { rerender } = render(<LoadingScreen propertyName="Villa Serena" isDone={false} />)
    expect(screen.getByText(/preparing the 3d tour/i)).toBeInTheDocument()

    rerender(<LoadingScreen propertyName="Villa Serena" isDone />)
    expect(screen.getByText(/tour ready/i, { selector: 'span' })).toBeInTheDocument()
  })
})
