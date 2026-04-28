import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import { CookieMap } from '../services/cookieService'
import { Product } from '../data/modelTypes'
import config from '../config'
import { AlertsService, ServiceCatalogueService } from '../services'
import RecommendedVersionsService from '../services/recommendedVersionsService'
import resetAllMocks = jest.resetAllMocks
import { Alert } from '../@types'

let app: Express

const serviceCatalogueServiceStub: Pick<ServiceCatalogueService, 'getProducts' | 'getProduct'> = {
  getProducts: async () => {
    return [{ name: 'product 1', components: [{ name: 'component 1', description: 'component 1' }] }] as Product[]
  },
  getProduct: async () => {
    return {
      name: 'product 1',
      components: [{ name: 'component 1', description: 'component 1' }],
    } as Product
  },
}

const alertsServiceStub: Pick<AlertsService, 'getAlertsForComponent'> = {
  getAlertsForComponent: async () =>
    [
      {
        status: {
          state: 'active',
        },
        labels: {
          component: 'component 1',
          alertname: 'alert 1',
        },
      },
    ] as Alert[],
}

const alertServiceNoAlertsStub: Pick<AlertsService, 'getAlertsForComponent'> = {
  getAlertsForComponent: async () => [],
}

const recommendedVersionServiceStub: Pick<RecommendedVersionsService, 'getRecommendedVersions'> = {
  getRecommendedVersions: async () => null,
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
      alertsService: alertsServiceStub as AlertsService,
      recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
      cookieService: {
        getFavouritesFromCookie: (_req: unknown): string[] | null => ['product 1'],
        getString: (_cookies: CookieMap, name: string): string | null => {
          if (name === config.cookieKeys.userPreferencesCookie) {
            return 'yes'
          }
          return null
        },
        removeEncodedQuotes: (_value: string | null): string | null => null,
        setStringHeader: (_key: string, _value: string): string | null => null,
      },
    },
  })
})

afterEach(() => {
  resetAllMocks()
})

describe('/dashboard', () => {
  describe('GET/', () => {
    describe('correct rendering pathways', () => {
      it('renders dashboard page', async () => {
        const res = await request(app).get('/dashboard')
        expect(res.status).toBe(200)
      })
    })

    describe('user preferences', () => {
      it('shows unable to view message when a users cookie preferences are set to no', async () => {
        app = appWithAllRoutes({
          services: {
            serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
            alertsService: alertsServiceStub as AlertsService,
            recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
            cookieService: {
              getFavouritesFromCookie: (_req: unknown): string[] | null => [],
              getString: (_cookies: CookieMap, name: string): string | null => {
                if (name === config.cookieKeys.userPreferencesCookie) {
                  return 'no'
                }
                return null
              },
              removeEncodedQuotes: (value: string | null): string | null => null,
              setStringHeader: (_key: string, _value: string): string | null => null,
            },
          },
        })
        const res = await request(app).get('/dashboard')
        expect(res.status).toBe(200)
        expect(res.text).toContain('You are not able to use the dashboard without additional cookies')
      })

      it('shows dashboard when users cookie preferences are set to yes', async () => {
        const res = await request(app).get('/dashboard')
        expect(res.status).toBe(200)
        expect(res.text).toContain('Welcome to your dashboard')
      })

      describe('product selection', () => {
        it('renders selected product when valid', async () => {
          const res = await request(app).get('/dashboard')
          expect(res.status).toBe(200)
          expect(res.text).toContain('govuk-summary-card__title')
        })

        it('doesnt render products when product cookie is not valid', async () => {
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertsServiceStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (): string[] | null => ['invalid product'],
                getString: (): string => 'yes',
                removeEncodedQuotes: (): string | null => null,
                setStringHeader: (): string | null => null,
              },
            },
          })
          const res = await request(app).get('/dashboard')
          expect(res.status).toBe(200)
          expect(res.text).not.toContain('govuk-summary-card__title')
        })
      })

      describe('alerts', () => {
        it('renders the alerts banner when alerts are firing', async () => {
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertsServiceStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (): string[] | null => ['product 1'],
                getString: (): string => 'yes',
                removeEncodedQuotes: (): string | null => null,
                setStringHeader: (): string | null => null,
              },
            },
          })
          const res = await request(app).get('/dashboard')
          expect(res.status).toBe(200)
          expect(res.text).toContain('component 1')
        })

        it('does not render the alerts banner when no alerts are firing', async () => {
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertServiceNoAlertsStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (): string[] | null => ['product 1'],
                getString: (): string => 'yes',
                removeEncodedQuotes: (): string | null => null,
                setStringHeader: (): string | null => null,
              },
            },
          })
          const res = await request(app).get('/dashboard')
          expect(res.status).toBe(200)
          expect(res.text).not.toContain('alert 1')
        })
      })
    })
  })

  describe('POST/', () => {
    it('redirects to /dashboard when product exists', async () => {
      const res = await request(app).post('/dashboard/saved-products/add').send({ product: 'product 1' })

      expect(res.status).toBe(302)
      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')
      expect(url.searchParams.get('error')).toBeNull()
    })

    it('redirects to /dashboard with error when product match not found', async () => {
      const nameInput = 'not a product'
      const res = await request(app).post('/dashboard/saved-products/add').send({ product: nameInput })

      expect(res.status).toBe(302)
      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')
      expect(url.searchParams.get('error')).toBe('notfound')
      expect(url.searchParams.get('value')).toBe(nameInput)
    })
  })

  describe('POST/', () => {
    it('deletes product and redirects to /dashboard when product exists', async () => {
      const res = await request(app).post('/dashboard/saved-products/delete').send({ product: 'product 1' })

      expect(res.status).toBe(302)
      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')
    })

    it('redirect to /dashboard when product match not found', async () => {
      const nameInput = 'not a product'
      const res = await request(app).post('/dashboard/saved-products/add').send({ product: nameInput })

      expect(res.status).toBe(302)
      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')
    })
  })
})
