import { CookieService } from './cookieService'

describe('CookieService', () => {
  let service: CookieService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new CookieService()
  })

  describe('getString', () => {
    it('gets cookie value from a parsed object and decodes it', () => {
      const cookies = {
        token: 'my%20value',
      }
      expect(service.getString(cookies, 'token')).toBe('my value')
    })
    it('returns null when no cookie', () => {
      const cookies = {
        token: '',
      }
      expect(service.getString(cookies, 'token')).toBeNull()
    })
    it('handles multiple cookies', () => {
      const cookies = {
        a: '1',
        token: 'my%20value',
        b: '9',
      }
      expect(service.getString(cookies, 'token')).toBe('my value')
    })
  })

  describe('setStringHeader', () => {
    it('returns a correctly built Set-Cookie string header', () => {
      const result = service.setStringHeader('token', 'my value')
      expect(result).toBe('token=%22my%20value%22; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
    it('adds product and value to Set-Cookie header', () => {
      const result = service.setStringHeader('product_token', 'testProduct')
      expect(result).toBe('product_token=%22testProduct%22; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
    it('handles empty values', () => {
      const result = service.setStringHeader('token', '')
      expect(result).toBe('token=%22%22; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
  })

  describe('getFavouritesFromCookie', () => {
    it('returns an empty array when there is no cookie', () => {
      const cookies = {
        token: '',
      }
      expect(service.getFavouritesFromCookie(cookies, 'token')).toEqual([])
    })
    it('returns an empty array when cookie contains invalid JSON', () => {
      const cookies = {
        token: 'not-json',
      }
      expect(service.getFavouritesFromCookie(cookies, 'token')).toEqual([])
    })
    it('returns product names when they exist', () => {
      const cookies = {
        token: '%22prod1%22',
      }
      expect(service.getFavouritesFromCookie(cookies, 'token')).toEqual('prod1')
    })
  })
})
