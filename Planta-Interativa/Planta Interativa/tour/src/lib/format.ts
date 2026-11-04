export const formatPrice = (amount: number, currency: string): string =>
  new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

export const formatArea = (squareMetres: number): string => `${Math.round(squareMetres)} m²`
