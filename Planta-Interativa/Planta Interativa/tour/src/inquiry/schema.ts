import { z } from 'zod'
import { PROPERTIES } from '../data/properties'

export const INTENTS = [
  { id: 'live', label: 'Um lar para morar' },
  { id: 'invest', label: 'Um investimento' },
] as const

export const BUDGETS = [
  { id: 'under-750k', label: 'Até R$ 1 milhão' },
  { id: '750k-1m', label: 'R$ 1 a 1,5 milhão' },
  { id: '1m-2m', label: 'R$ 1,5 a 2 milhões' },
  { id: '2m-plus', label: 'Acima de R$ 2 milhões' },
] as const

export const CONTACT_METHODS = [
  { id: 'email', label: 'E-mail' },
  { id: 'phone', label: 'Ligação' },
  { id: 'whatsapp', label: 'WhatsApp' },
] as const

const MAX_MESSAGE = 1000
const MAX_EMAIL = 254
/** C0 control characters except tab and newline; CR is dropped so text can't smuggle header breaks. */
// oxlint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g
const LINE_BREAKS = /[\r\n]+/g

const cleanLine = (value: string) => value.replace(CONTROL_CHARS, '').replace(LINE_BREAKS, ' ')
const cleanText = (value: string) => value.replace(CONTROL_CHARS, '')
const ids = <T extends readonly { id: string }[]>(options: T) => options.map((o) => o.id) as [T[number]['id'], ...T[number]['id'][]]

export const inquirySchema = z
  .object({
    name: z
      .string()
      .transform(cleanLine)
      .pipe(z.string().trim().min(2, 'Informe seu nome completo').max(80, 'Use até 80 caracteres')),
    email: z.string().trim().max(MAX_EMAIL, 'E-mail longo demais').pipe(z.email('Informe um e-mail válido')),
    phone: z
      .string()
      .trim()
      .max(25, 'Telefone longo demais')
      .regex(/^[+\d\s()-]*$/, 'Use apenas dígitos, espaços, + ( ) ou -'),
    propertyId: z.enum(PROPERTIES.map((p) => p.id) as [string, ...string[]], 'Escolha um empreendimento'),
    intent: z.enum(ids(INTENTS), 'Diga a finalidade da compra'),
    budget: z.enum(ids(BUDGETS), 'Escolha uma faixa'),
    contactMethod: z.enum(ids(CONTACT_METHODS), 'Escolha como prefere ser contatado'),
    message: z
      .string()
      .transform(cleanText)
      .pipe(z.string().trim().max(MAX_MESSAGE, `Use até ${MAX_MESSAGE} caracteres`)),
    consent: z.literal(true, 'Aceite para podermos responder'),
  })
  .refine((v) => v.contactMethod === 'email' || v.phone.replace(/\D/g, '').length >= 7, {
    path: ['phone'],
    message: 'Informe um telefone para ligarmos ou enviarmos mensagem',
  })

export type InquiryInput = z.infer<typeof inquirySchema>

export interface InquiryPayload extends InquiryInput {
  readonly roomsViewed: readonly string[]
  readonly submittedAt: string
}
