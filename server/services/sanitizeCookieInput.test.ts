import { sanitizeCookieInput } from './sanitizeCookieInput'

describe('sanitizeCookieInput', () => {
  beforeEach(() => {
    jest.resetModules()
  })
  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })
  it('leaves string as it is if no sanitization needed', () => {
    const input = 'example'
    expect(sanitizeCookieInput(input)).toBe('example')
  })
  it('removes html characters', () => {
    const input = '<script>example</script>'
    expect(sanitizeCookieInput(input)).toBe('&ltscript&gtexample&lt/script&gt')
  })
  it('returns default input when type of input is not a string', () => {
    const input = 123
    expect(sanitizeCookieInput(input)).toBe('')
  })
  it('removes control characters', () => {
    const input = 'A\u0000B\u0007C'
    expect(sanitizeCookieInput(input)).toBe('ABC')
  })
  it('normalizes valid unicode to NFC', () => {
    const input = 'e\u0301'
    expect(sanitizeCookieInput(input)).toBe('é')
  })
  it('returns original input if normalize throws', () => {
    const input = 'example'

    const spy = jest.spyOn(String.prototype, 'normalize').mockImplementation(() => {
      throw new Error('bad unicode')
    })
    const result = sanitizeCookieInput(input)
    expect(result).toBe('example')
    spy.mockRestore()
  })
  it('removes whitespace', () => {
    const input = 'A \t B \n C'
    expect(sanitizeCookieInput(input)).toBe('A B C')
  })
  it('adjusts length if too long', () => {
    const input = 'ABCDEFGHIJKLMNOP'
    expect(sanitizeCookieInput(input, { maxLength: 10 })).toBe('ABCDEFGHIJ')
  })
})
