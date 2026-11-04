import type { Property } from '../types'
import { skylineResidence } from './apartment'
import { montemerano01 } from './montemerano'
import { montemeranoLazer } from './montemerano-lazer'
import { villaSerena } from './villa'

export const PROPERTIES: readonly Property[] = [montemerano01, montemeranoLazer, villaSerena, skylineResidence]

export const getProperty = (id: string): Property => {
  const property = PROPERTIES.find((p) => p.id === id)
  if (!property) throw new Error(`Unknown property "${id}"`)
  return property
}

export const getRoom = (property: Property, roomId: string) => {
  const room = property.rooms.find((r) => r.id === roomId)
  if (!room) throw new Error(`Unknown room "${roomId}" in ${property.name}`)
  return room
}

/** Room ids per property, for validating deep links. */
export const KNOWN_ROOMS = Object.fromEntries(PROPERTIES.map((p) => [p.id, p.rooms.map((r) => r.id)]))
