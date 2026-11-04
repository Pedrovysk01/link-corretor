import { describe, expect, test } from 'vitest'
import { inquirySchema } from './schema'

const valid = {
  name: 'Amira Haddad',
  email: 'amira@example.com',
  phone: '',
  propertyId: 'villa-serena',
  intent: 'live',
  budget: '1m-2m',
  contactMethod: 'email',
  message: '',
  consent: true,
}

const fieldErrors = (input: unknown) => {
  const result = inquirySchema.safeParse(input)
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('inquirySchema', () => {
  test('accepts a complete inquiry and trims text', () => {
    const result = inquirySchema.parse({ ...valid, name: '  Amira Haddad  ' })

    expect(result.name).toBe('Amira Haddad')
  })

  test('rejects a short name and an invalid email', () => {
    const errors = fieldErrors({ ...valid, name: 'A', email: 'not-an-email' })

    expect(errors.name).toMatch(/full name/i)
    expect(errors.email).toMatch(/valid email/i)
  })

  test('requires consent', () => {
    expect(fieldErrors({ ...valid, consent: false }).consent).toMatch(/agree/i)
  })

  test('requires a phone number when the visitor asks to be called', () => {
    expect(fieldErrors({ ...valid, contactMethod: 'phone', phone: '' }).phone).toMatch(/phone number/i)
    expect(fieldErrors({ ...valid, contactMethod: 'phone', phone: '+44 20 7946 0958' })).toEqual({})
  })

  test('rejects letters in a phone number', () => {
    expect(fieldErrors({ ...valid, phone: 'call me' }).phone).toBeDefined()
  })

  test('caps the message length', () => {
    expect(fieldErrors({ ...valid, message: 'x'.repeat(1001) }).message).toBeDefined()
  })

  test('rejects properties that do not exist and over-long emails', () => {
    expect(fieldErrors({ ...valid, propertyId: 'castle' }).propertyId).toBeDefined()
    expect(fieldErrors({ ...valid, email: `${'a'.repeat(250)}@example.com` }).email).toMatch(/too long/i)
  })

  test('strips control characters and folds line breaks out of the name', () => {
    const result = inquirySchema.parse({ ...valid, name: 'Amira\r\nBcc: x@evil.test\u0007', message: 'Hi\nthere\u0000' })

    expect(result.name).toBe('Amira Bcc: x@evil.test')
    expect(result.message).toBe('Hi\nthere')
  })
})
