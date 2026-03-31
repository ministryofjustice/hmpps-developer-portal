import { Request } from 'express'

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

  setProductCookie(product: string, value: string): string {
    return `${product}=${JSON.stringify(value)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`
  }

  getFavouritesFromCookie(req: Request, key: string) {
    const rawData = req.cookies[key]
    if (!rawData || typeof rawData !== 'string') {
      return []
    }
    try {
      return JSON.parse(rawData)
    } catch {
      return []
    }
  }
}

export interface productList {
  id?: number
  name: string
}

export const cookieService = new CookieService()

export async function fetchProductList() {
  try {
    const response = await fetch('https://developer-portal-stage.hmpps.service.justice.gov.uk/dashboard/data')
    if (!response.ok) {
      return []
    }

    const productList = (await response.json()) as productList[]
    return productList.map(product => product.name)
  } catch {
    return []
  }
}
