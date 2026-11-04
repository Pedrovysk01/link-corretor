import type { Property } from '../data/types'

/** Abertas na sessão: a animação mapa→planta roda uma vez por tipo de empreendimento ("cidade:Apartment", "cidade:Lazer"). */
export const introJaFeita = new Set<string>()

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const introKey = (property: Property) => (property.surroundings === 'cidade' ? `cidade:${property.type}` : null)

/** Esta abertura toca a animação? (visão geral, 1ª vez, sem preferência por menos movimento, sem ?intro=0) */
export const querIntro = (property: Property, hasRoom: boolean) => {
  const key = introKey(property)
  return !hasRoom && key !== null && !introJaFeita.has(key) && !prefersReducedMotion() && !/[?&]intro=0/.test(location.search)
}
