export class CookieService {
  // Get cookie value from parsed object and decode it
  getString(cookies: Record<string, string>, name: string): string | null {
    const raw = cookies[name]
    if (!raw) return null

    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }

  // Build a Set-Cookie string
  setStringHeaderName(name: string, value: string): string {
    return `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`
  }

  setStringHeaderProduct(product: string, value: unknown): string {
    return `${encodeURIComponent(product)}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`
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
