export interface InputOptions {
  maxLength?: number
  collapseWhitespace?: boolean
  // to provide fallback if empty/invalid
  defaultInput?: string
}

export function sanitizeCookieInput(input: unknown, options: InputOptions = {}): string {
  const { maxLength = 100, collapseWhitespace = true, defaultInput = '' } = options

  if (typeof input !== 'string') {
    return defaultInput
  }
  const regex = /\p{Control}/gu
  let value = input.replace(regex, '')
  try {
    value = value.normalize('NFC')
  } catch {
    return input
  }
  value = value
    .trim()
    // protect against HTML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  if (collapseWhitespace) {
    value = value.replace(/\s+/g, ' ').trim()
  }
  const chars = [...value]
  if (chars.length > maxLength) {
    value = chars.slice(0, maxLength).join('')
  }
  if (!value) return defaultInput
  return value
}
