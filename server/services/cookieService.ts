export type CookieMap = Record<string, string>

export class CookieService {
  // Get cookie value from parsed object and decode it
  getString(cookies: CookieMap, name: string): string | null {
    const raw = cookies[name]
    if (!raw) return null
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }

  // Build cookie header
  setStringHeader(key: string, value: string | unknown): string {
    return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`
  }

  removeEncodedQuotes(name: string): string {
    return name.replace(/%22/g, '')
  }

  getFavouritesFromCookie(cookies: Record<string, string>, key: string): string[] | null {
    const rawData = cookies[key]
    if (!rawData || typeof rawData !== 'string') {
      return []
    }
    try {
      return JSON.parse(decodeURIComponent(rawData))
    } catch {
      return []
    }
  }
}

export const cookieService = new CookieService()
