import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Missing env variable: RESEND_API_KEY')
  }
  return new Resend(apiKey)
}

export const resend = {
  get client() {
    return getResendClient()
  },
}
