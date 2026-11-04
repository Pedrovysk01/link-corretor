import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ThankYouProps {
  readonly firstName: string
  readonly mode: 'remote' | 'demo'
  readonly onClose: () => void
}

/** Confirmation that replaces the form; it takes focus so screen readers announce it. */
export function ThankYou({ firstName, mode, onClose }: ThankYouProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])

  return (
    <div className="thanks" role="status">
      <CheckCircle2 className="thanks__icon" size={44} aria-hidden="true" />
      <h2 ref={headingRef} tabIndex={-1} className="panel__title">
        Obrigado, {firstName}
      </h2>
      <p className="panel__lead">
        Um consultor entrará em contato em até um dia útil com o catálogo, as plantas e a disponibilidade atual.
      </p>
      {mode === 'demo' && (
        <p className="notice">
          Modo demonstração: este contato foi salvo apenas neste navegador. Configure <code>VITE_INQUIRY_ENDPOINT</code> para enviar os leads.
        </p>
      )}
      <button type="button" className="button button--primary" onClick={onClose}>
        Voltar ao tour
      </button>
    </div>
  )
}
