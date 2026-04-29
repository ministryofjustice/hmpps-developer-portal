import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import { CookieMap } from '../services/cookieService'
import config from '../config'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      cookieService: {
        getFavouritesFromCookie: (_req: unknown): string[] | null => [],
        getString: (_cookies: CookieMap, name: string): string | null => {
          if (name === config.cookieKeys.userPreferencesCookie) {
            return 'yes'
          }
          return null
        },
        removeEncodedQuotes: (_name: string | null): string | null => 'cookie_policy=yes',
        setStringHeader: (_key: string, _value: string): string | null => 'cookie_policy=yes',
      },
    },
  })
})

describe('/cookiesPage', () => {
  describe('GET', () => {
    it('renders cookie page', async () => {
      const res = await request(app).get('/cookies')
      expect(res.status).toBe(200)
    })
  })

  describe('POST', () => {
    it('updates users cookie preferences', async () => {
      const res = await request(app)
        .post('/cookies/update-cookies')
        .send({ cookies: { functional: 'yes' } })

      expect(res.status).toBe(200)
      expect(res.text).toContain('You’ve set your cookie preferences.')
    })
  })
})
