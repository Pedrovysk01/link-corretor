import { useRef, useState, type FormEvent } from 'react'
import { inquirySchema, type InquiryPayload } from '../inquiry/schema'
import type { SubmitResult } from '../inquiry/submitInquiry'
import { InquiryFields, type Errors, type FormValues } from './inquiry/InquiryFields'
import { ThankYou } from './inquiry/ThankYou'

/** Field name for the bot trap. Deliberately unlike anything browsers or password managers autofill. */
const HONEYPOT_FIELD = 'montemerano_hp_ref'
const UNEXPECTED_ERROR = 'Algo deu errado ao enviar. Tente novamente.'

type Status =
  | { readonly kind: 'editing' }
  | { readonly kind: 'sending' }
  | { readonly kind: 'failed'; readonly error: string }
  | { readonly kind: 'sent'; readonly mode: 'remote' | 'demo'; readonly firstName: string }

export interface InquiryFormProps {
  readonly propertyId: string
  readonly roomsViewed: readonly string[]
  readonly submit: (payload: InquiryPayload) => Promise<SubmitResult>
  readonly onClose: () => void
  readonly now?: () => Date
}

const emptyValues = (propertyId: string): FormValues => ({
  name: '',
  email: '',
  phone: '',
  propertyId,
  intent: '',
  budget: '',
  contactMethod: 'email',
  message: '',
  consent: false,
})

const validate = (values: FormValues) => {
  const result = inquirySchema.safeParse(values)
  if (result.success) return { data: result.data, errors: {} as Errors }
  const errors: Errors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormValues
    errors[key] ??= issue.message
  }
  return { data: null, errors }
}

const firstName = (name: string) => name.split(/\s+/)[0]

/** The lead-capture form shown at the end of the tour, carrying which rooms the visitor explored. */
export function InquiryForm({ propertyId, roomsViewed, submit, onClose, now = () => new Date() }: InquiryFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<FormValues>(() => emptyValues(propertyId))
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>({ kind: 'editing' })
  const [hasTriedSubmit, setTriedSubmit] = useState(false)

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    const next = { ...values, [key]: value }
    setValues(next)
    if (hasTriedSubmit) setErrors(validate(next).errors)
  }

  /** Focuses the first invalid control in on-screen order, not schema order. */
  const focusFirstError = (found: Errors) => {
    const controls = Array.from(formRef.current?.elements ?? [])
    const target = controls.find((el) => {
      const name = el.getAttribute('name')
      return name !== null && Object.hasOwn(found, name)
    })
    if (target instanceof HTMLElement) target.focus()
  }

  const send = async (payload: InquiryPayload, name: string) => {
    setStatus({ kind: 'sending' })
    try {
      const result = await submit(payload)
      setStatus(result.ok ? { kind: 'sent', mode: result.mode, firstName: firstName(name) } : { kind: 'failed', error: result.error })
    } catch (error) {
      console.error('Inquiry submission threw unexpectedly', error)
      setStatus({ kind: 'failed', error: UNEXPECTED_ERROR })
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (status.kind === 'sending') return
    if (honeypot) {
      // Bots get a convincing success and nothing is sent.
      setStatus({ kind: 'sent', mode: 'remote', firstName: firstName(values.name) || 'there' })
      return
    }
    setTriedSubmit(true)
    const { data, errors: found } = validate(values)
    setErrors(found)
    if (!data) {
      focusFirstError(found)
      return
    }
    await send({ ...data, roomsViewed, submittedAt: now().toISOString() }, data.name)
  }

  if (status.kind === 'sent') return <ThankYou firstName={status.firstName} mode={status.mode} onClose={onClose} />

  return (
    <form ref={formRef} className="inquiry" onSubmit={handleSubmit} noValidate>
      <InquiryFields values={values} errors={errors} update={update} />

      <div className="honeypot" inert>
        <label htmlFor={HONEYPOT_FIELD}>Referência</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {status.kind === 'failed' && (
        <p className="form-error" role="alert">
          {status.error}
        </p>
      )}

      <button type="submit" className="button button--primary button--block" disabled={status.kind === 'sending'}>
        {status.kind === 'sending' ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  )
}
