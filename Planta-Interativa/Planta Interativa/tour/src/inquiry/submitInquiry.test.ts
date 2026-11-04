import { describe, expect, test, vi } from 'vitest'
import type { InquiryPayload } from './schema'
import { DEMO_STORAGE_KEY, submitInquiry } from './submitInquiry'

const payload: InquiryPayload = {
  name: 'Amira Haddad',
  email: 'amira@example.com',
  phone: '',
  propertyId: 'villa-serena',
  intent: 'invest',
  budget: '1m-2m',
  contactMethod: 'email',
  message: 'Is the pool heated?',
  consent: true,
  roomsViewed: ['living', 'terrace'],
  submittedAt: '2026-10-30T12:00:00.000Z',
}

const memoryStorage = (): Storage => {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}

describe('submitInquiry', () => {
  test('stores the inquiry locally in demo mode when no endpoint is configured', async () => {
    const storage = memoryStorage()

    const result = await submitInquiry(payload, { endpoint: null, storage })

    expect(result).toEqual({ ok: true, mode: 'demo' })
    expect(JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? '[]')).toEqual([payload])
  })

  test('appends to inquiries already stored in demo mode', async () => {
    const storage = memoryStorage()
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify([{ name: 'earlier' }]))

    await submitInquiry(payload, { endpoint: null, storage })

    expect(JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? '[]')).toHaveLength(2)
  })

  test('posts the lead as JSON to the configured endpoint', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))

    const result = await submitInquiry(payload, { endpoint: 'https://leads.example.com/hook', fetchFn })

    expect(result).toEqual({ ok: true, mode: 'remote' })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://leads.example.com/hook')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', Accept: 'application/json' })
    const body = JSON.parse(init.body)
    expect(body).toEqual(payload)
  })

  test('recovers when the stored demo list is corrupt', async () => {
    const storage = memoryStorage()
    storage.setItem(DEMO_STORAGE_KEY, '{not json')

    const result = await submitInquiry(payload, { endpoint: null, storage })

    expect(result).toEqual({ ok: true, mode: 'demo' })
    expect(JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? '[]')).toEqual([payload])
  })

  test('reports an error instead of throwing when storage is blocked', async () => {
    const blocked = { ...memoryStorage(), setItem: () => { throw new DOMException('Denied', 'SecurityError') } } as Storage

    const result = await submitInquiry(payload, { endpoint: null, storage: blocked })

    expect(result.ok).toBe(false)
  })

  test('reports a friendly error when the endpoint rejects the request', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('nope', { status: 500 }))

    const result = await submitInquiry(payload, { endpoint: 'https://leads.example.com/hook', fetchFn })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toMatch(/couldn.t send/i)
  })

  test('reports a friendly error when the network fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await submitInquiry(payload, { endpoint: 'https://leads.example.com/hook', fetchFn })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toMatch(/connection/i)
  })

  test('gives up after the timeout', async () => {
    const fetchFn = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )

    const result = await submitInquiry(payload, { endpoint: 'https://leads.example.com/hook', fetchFn, timeoutMs: 10 })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toMatch(/took too long/i)
  })
})
