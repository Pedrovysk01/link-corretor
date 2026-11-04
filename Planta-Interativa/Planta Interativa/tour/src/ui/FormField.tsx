import type { ReactNode } from 'react'

interface FieldProps {
  readonly id: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly children: (aria: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

/** A labelled control with its hint and error placed directly beneath it. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}

interface Option {
  readonly id: string
  readonly label: string
}

interface ChoiceGroupProps {
  readonly name: string
  readonly legend: string
  readonly options: readonly Option[]
  readonly value: string
  readonly error?: string
  readonly onChange: (value: string) => void
}

export function ChoiceGroup({ name, legend, options, value, error, onChange }: ChoiceGroupProps) {
  return (
    <fieldset className={`field choice${error ? ' field--invalid' : ''}`} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="field__label">{legend}</legend>
      <div className="choice__options">
        {options.map((option) => (
          <label key={option.id} className="choice__option">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              aria-invalid={Boolean(error)}
              onChange={() => onChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="field__error">
          {error}
        </p>
      )}
    </fieldset>
  )
}
