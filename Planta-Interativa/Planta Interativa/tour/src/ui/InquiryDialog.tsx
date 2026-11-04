import { X } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { INQUIRY_ENDPOINT } from '../config'
import type { InquiryPayload } from '../inquiry/schema'
import { submitInquiry } from '../inquiry/submitInquiry'
import { tourStore, useProperty, useTour } from '../state/store'
import { InquiryForm } from './InquiryForm'

const send = (payload: InquiryPayload) => submitInquiry(payload, { endpoint: INQUIRY_ENDPOINT })

/**
 * Modal around the inquiry form. The form stays mounted while the dialog is closed, so an accidental
 * Esc or backdrop click never throws away what the visitor typed or a request still in flight.
 */
export function InquiryDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pressStartedOnBackdrop = useRef(false)
  const [formKey, setFormKey] = useState(0)
  const isOpen = useTour((s) => s.isInquiryOpen)
  const visited = useTour((s) => s.visitedRoomIds)
  const property = useProperty()
  const close = () => tourStore.getState().closeInquiry()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  // Close on the backdrop only when the press also began there, not when a text selection ends there.
  const onMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    pressStartedOnBackdrop.current = event.target === dialogRef.current
  }
  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (pressStartedOnBackdrop.current && event.target === dialogRef.current) close()
  }

  const finish = () => {
    close()
    setFormKey((k) => k + 1)
  }

  return (
    <dialog ref={dialogRef} className="dialog" aria-labelledby="inquiry-title" onClose={close} onMouseDown={onMouseDown} onClick={onClick}>
      <div className="dialog__body">
        <header className="dialog__header">
          <div>
            <p className="eyebrow">Registre seu interesse</p>
            <h2 id="inquiry-title" className="panel__title">
              {property.name}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={close} aria-label="Fechar formulário">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <InquiryForm key={`${property.id}-${formKey}`} propertyId={property.id} roomsViewed={visited} submit={send} onClose={finish} />
      </div>
    </dialog>
  )
}
