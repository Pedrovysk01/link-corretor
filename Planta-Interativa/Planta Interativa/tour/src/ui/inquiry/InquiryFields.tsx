import { PROPERTIES } from '../../data/properties'
import { BUDGETS, CONTACT_METHODS, INTENTS } from '../../inquiry/schema'
import { ChoiceGroup, Field } from '../FormField'

export interface FormValues {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly propertyId: string
  readonly intent: string
  readonly budget: string
  readonly contactMethod: string
  readonly message: string
  readonly consent: boolean
}

export type Errors = Partial<Record<keyof FormValues, string>>

interface FieldsProps {
  readonly values: FormValues
  readonly errors: Errors
  readonly update: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void
}

function ContactFields({ values, errors, update }: FieldsProps) {
  return (
    <>
      <Field id="name" label="Nome completo" error={errors.name}>
        {(aria) => <input {...aria} name="name" autoComplete="name" value={values.name} onChange={(e) => update('name', e.target.value)} />}
      </Field>
      <Field id="email" label="E-mail" error={errors.email}>
        {(aria) => (
          <input {...aria} name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => update('email', e.target.value)} />
        )}
      </Field>
      <Field id="contactMethod" label="Prefiro contato por" error={errors.contactMethod}>
        {(aria) => (
          <select {...aria} name="contactMethod" value={values.contactMethod} onChange={(e) => update('contactMethod', e.target.value)}>
            {CONTACT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field id="phone" label="Telefone" hint="Necessário para ligação ou WhatsApp" error={errors.phone}>
        {(aria) => (
          <input {...aria} name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} />
        )}
      </Field>
    </>
  )
}

function InterestFields({ values, errors, update }: FieldsProps) {
  return (
    <>
      <Field id="propertyId" label="Empreendimento" error={errors.propertyId}>
        {(aria) => (
          <select {...aria} name="propertyId" value={values.propertyId} onChange={(e) => update('propertyId', e.target.value)}>
            {PROPERTIES.filter((p) => p.id.startsWith('montemerano')).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field id="budget" label="Faixa de investimento" error={errors.budget}>
        {(aria) => (
          <select {...aria} name="budget" value={values.budget} onChange={(e) => update('budget', e.target.value)}>
            <option value="" disabled>
              Selecione uma faixa
            </option>
            {BUDGETS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        )}
      </Field>
    </>
  )
}

/** Every visible input of the inquiry form, in on-screen order. */
export function InquiryFields(props: FieldsProps) {
  const { values, errors, update } = props
  return (
    <>
      <div className="inquiry__grid">
        <ContactFields {...props} />
        <InterestFields {...props} />
      </div>
      <ChoiceGroup name="intent" legend="Estou comprando" options={INTENTS} value={values.intent} error={errors.intent} onChange={(v) => update('intent', v)} />
      <Field id="message" label="Mensagem (opcional)" error={errors.message}>
        {(aria) => (
          <textarea
            {...aria}
            name="message"
            rows={3}
            placeholder="Dúvidas sobre condições de pagamento, acabamentos, visita ao decorado…"
            value={values.message}
            onChange={(e) => update('message', e.target.value)}
          />
        )}
      </Field>
      <div className={`field consent${errors.consent ? ' field--invalid' : ''}`}>
        <label className="consent__label">
          <input
            type="checkbox"
            name="consent"
            checked={values.consent}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            onChange={(e) => update('consent', e.target.checked)}
          />
          <span>Concordo que o Villa Montemerano entre em contato sobre este empreendimento. Seus dados não são compartilhados.</span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="field__error">
            {errors.consent}
          </p>
        )}
      </div>
    </>
  )
}
