import type { InquiryPayload } from './schema'

export const DEMO_STORAGE_KEY = 'montemerano.inquiries'
const DEFAULT_TIMEOUT_MS = 10_000

export type SubmitResult = { readonly ok: true; readonly mode: 'remote' | 'demo' } | { readonly ok: false; readonly error: string }

export interface SubmitOptions {
  /** Where leads are POSTed. `null` runs in demo mode and keeps them in local storage. */
  readonly endpoint: string | null
  readonly fetchFn?: typeof fetch
  /** Defaults to localStorage, read only when needed: some browsers throw just for touching it. */
  readonly storage?: Storage
  readonly timeoutMs?: number
}

const readStored = (storage: Storage): unknown[] => {
  try {
    const existing: unknown = JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? '[]')
    return Array.isArray(existing) ? existing : []
  } catch {
    // A corrupt entry would otherwise block every future demo save; start the list afresh.
    return []
  }
}

const storeLocally = (payload: InquiryPayload, getStorage: () => Storage): SubmitResult => {
  try {
    const storage = getStorage()
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify([...readStored(storage), payload]))
    return { ok: true, mode: 'demo' }
  } catch (error) {
    console.error('Demo inquiry could not be saved', error)
    return { ok: false, error: 'Não foi possível salvar neste navegador. Tente novamente.' }
  }
}

const errorMessage = (error: unknown): string => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'A requisição demorou demais. Verifique a conexão e tente novamente.'
  }
  return 'Não conseguimos falar com a equipe. Verifique a conexão e tente novamente.'
}

export const submitInquiry = async (payload: InquiryPayload, options: SubmitOptions): Promise<SubmitResult> => {
  const { endpoint, fetchFn = fetch, storage, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  if (!endpoint) return storeLocally(payload, () => storage ?? globalThis.localStorage)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!response.ok) {
      console.error('Inquiry endpoint rejected the request', response.status)
      return { ok: false, error: 'Não foi possível enviar agora. Tente novamente em instantes.' }
    }
    return { ok: true, mode: 'remote' }
  } catch (error) {
    console.error('Inquiry request failed', error)
    return { ok: false, error: errorMessage(error) }
  } finally {
    clearTimeout(timer)
  }
}
