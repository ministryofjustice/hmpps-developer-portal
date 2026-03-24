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
  setStringHeader(name: string, value: string): string {
    return `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`
  }
}

export const cookieService = new CookieService()
