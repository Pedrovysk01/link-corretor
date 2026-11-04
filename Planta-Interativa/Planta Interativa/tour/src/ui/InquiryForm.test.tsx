import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import type { SubmitResult } from '../inquiry/submitInquiry'
import { InquiryForm } from './InquiryForm'

const NOW = new Date('2026-10-30T12:00:00.000Z')

const setup = (result: SubmitResult = { ok: true, mode: 'remote' }) => {
  const submit = vi.fn().mockResolvedValue(result)
  const onClose = vi.fn()
  render(
    <InquiryForm propertyId="villa-serena" roomsViewed={['living', 'terrace']} submit={submit} onClose={onClose} now={() => NOW} />,
  )
  return { submit, onClose, user: userEvent.setup() }
}

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/full name/i), 'Amira Haddad')
  await user.type(screen.getByLabelText(/^email/i), 'amira@example.com')
  await user.selectOptions(screen.getByLabelText(/budget/i), '1m-2m')
  await user.click(screen.getByLabelText(/an investment/i))
  await user.type(screen.getByLabelText(/message/i), 'Is the pool heated?')
  await user.click(screen.getByLabelText(/i agree/i))
}

describe('InquiryForm', () => {
  test('shows field errors and does not submit an empty form', async () => {
    const { submit, user } = setup()

    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    expect(await screen.findByText(/please enter your full name/i)).toBeInTheDocument()
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/full name/i)).toHaveFocus()
    expect(submit).not.toHaveBeenCalled()
  })

  test('sends a valid inquiry with tour context and thanks the visitor', async () => {
    const { submit, user } = setup()
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    expect(await screen.findByRole('heading', { name: /thank you, amira/i })).toBeInTheDocument()
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Amira Haddad',
        email: 'amira@example.com',
        propertyId: 'villa-serena',
        intent: 'invest',
        budget: '1m-2m',
        roomsViewed: ['living', 'terrace'],
        submittedAt: NOW.toISOString(),
      }),
    )
  })

  test('labels demo-mode submissions so nobody mistakes them for real leads', async () => {
    const { user } = setup({ ok: true, mode: 'demo' })
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    expect(await screen.findByText(/demo mode/i)).toBeInTheDocument()
  })

  test('keeps what the visitor typed and explains a failed send', async () => {
    const { user } = setup({ ok: false, error: 'We couldn’t reach our team.' })
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t reach our team/i)
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Amira Haddad')
  })

  test('asks for a phone number when the visitor prefers a call', async () => {
    const { submit, user } = setup()
    await fillValidForm(user)
    await user.selectOptions(screen.getByLabelText(/contact me by/i), 'phone')

    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    expect(await screen.findByText(/add a phone number/i)).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  test('fakes success for bots that fill the hidden field, without sending', async () => {
    const { submit, user } = setup()
    const trap = document.querySelector<HTMLInputElement>('input[name="aurelia_hp_ref"]')
    if (!trap) throw new Error('honeypot input missing')
    await user.type(screen.getByLabelText(/full name/i), 'Spam Bot')
    fireEvent.change(trap, { target: { value: 'http://spam.example' } })

    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    expect(await screen.findByRole('heading', { name: /thank you/i })).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  test('recovers from a submit function that throws', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    render(<InquiryForm propertyId="villa-serena" roomsViewed={[]} submit={submit} onClose={vi.fn()} />)
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i)
    expect(screen.getByRole('button', { name: /send inquiry/i })).toBeEnabled()
  })

  test('closing after success returns to the tour', async () => {
    const { onClose, user } = setup()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /send inquiry/i }))

    await user.click(await screen.findByRole('button', { name: /back to the tour/i }))

    expect(onClose).toHaveBeenCalled()
  })
})
