export interface NameOptions {
  maxLength?: number
  collapseWhitespace?: boolean
  // to provide fallback if empty/invalid
  defaultName?: string
}

export function sanitizeNameInput(input: unknown, options: NameOptions = {}): string {
  const { maxLength = 100, collapseWhitespace = true, defaultName = 'User' } = options

  if (typeof input !== 'string') return defaultName
  const regex = /\p{Control}/gu
  let name = input.replace(regex, '')
  try {
    name = name.normalize('NFC')
  } catch (error) {
    return input
  }
  name = name.trim()
  if (collapseWhitespace) {
    name = name.replace(/\s+/g, '')
  }
  if ([...name].length > maxLength) {
    name = [...name].slice(0, maxLength).join('')
  }
  if (!name) return defaultName

  return name
}
