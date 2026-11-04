import { z } from 'zod'

/** Plain http is tolerated for local testing only; production leads must travel over TLS. */
const PROTOCOL = import.meta.env.DEV ? /^https?$/ : /^https$/

const endpointSchema = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .pipe(z.url({ protocol: PROTOCOL, error: 'VITE_INQUIRY_ENDPOINT must be an https URL' }).nullable())

/** Where inquiry leads are POSTed; `null` means demo mode (stored in the browser only). */
export const INQUIRY_ENDPOINT: string | null = endpointSchema.parse(import.meta.env.VITE_INQUIRY_ENDPOINT ?? '')
