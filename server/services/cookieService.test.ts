import type { Request } from 'express'
import { CookieService, fetchProductList } from './cookieService'

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
      expect(result).toBe('token=my%20value; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
    it('adds name and value to Set-Cookie header', () => {
      const result = service.setStringHeader('name_token', 'testName')
      expect(result).toBe('name_token=testName; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
    it('handles empty values', () => {
      const result = service.setStringHeader('token', '')
      expect(result).toBe('token=; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
  })

  describe('setProductCookie', () => {
    it('returns a correctly built Set-Cookie string header', () => {
      const result = service.setProductCookie('token', 'my value')
      expect(result).toBe('token="my value"; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
    it('adds product and value to Set-Cookie header', () => {
      const result = service.setProductCookie('product_token', 'testProduct')
      expect(result).toBe('product_token="testProduct"; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
    it('handles empty values', () => {
      const result = service.setProductCookie('token', '')
      expect(result).toBe('token=""; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax')
    })
  })

  describe('getFavouritesFromCookie', () => {
    it('returns an empty array when there is no cookie', () => {
      const req = { cookies: {} } as unknown as Request
      expect(service.getFavouritesFromCookie(req, 'key')).toEqual([])
    })
    it('returns empty array when cookie is not a string', () => {
      const req = { cookies: { key: 123 } } as unknown as Request
      expect(service.getFavouritesFromCookie(req, 'key')).toEqual([])
    })
    it('returns an empty array when cookie contains invalid JSON', () => {
      const req = { cookies: { key: 'not-json' } } as unknown as Request
      expect(service.getFavouritesFromCookie(req, 'key')).toEqual([])
    })
    it('returns an array of favourites when they exist', () => {
      const req = { cookies: { key: '["prod1", "prod2"]' } } as unknown as Request
      expect(service.getFavouritesFromCookie(req, 'key')).toEqual(['prod1', 'prod2'])
    })
  })
})

function mockFetchJson(json: unknown, ok = true) {
  const jsonMock = jest.fn().mockResolvedValue(json)
  const fetchMock = jest.fn().mockResolvedValue({
    ok,
    json: jsonMock,
  })
  globalThis.fetch = fetchMock
  return { fetchMock, jsonMock }
}

describe('fetchProductList', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })
  it('returns list of products names', async () => {
    const { fetchMock, jsonMock } = mockFetchJson([{ name: 'prod 1' }, { name: 'prod 2' }])
    const result = await fetchProductList()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(jsonMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual(['prod 1', 'prod 2'])
  })
  it('returns an empty array if response is not ok', async () => {
    const { fetchMock } = mockFetchJson([{ name: 'prod 1' }, { name: 'prod 2' }], false)
    const result = await fetchProductList()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })
  it('returns an empty array if JSON error', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('bad json')),
    })
    expect(await fetchProductList()).toEqual([])
  })
})
