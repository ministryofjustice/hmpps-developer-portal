import { Express } from 'express'
import request from 'supertest'
import { CookieMap } from '../services/cookieService'
import { Product } from '../data/modelTypes'
import config from '../config'
import { AlertsService, ServiceCatalogueService } from '../services'
import RecommendedVersionsService from '../services/recommendedVersionsService'
import { compareComponentsDependencies } from '../services/dependencyComparison'
import { appWithAllRoutes } from './testutils/appSetup'
import resetAllMocks = jest.resetAllMocks
import { Alert } from '../@types'
import * as dependencyHelpers from '../services/dependencyComparison'

let app: Express

jest.mock('../services/dependencyComparison', () => ({
  compareComponentsDependencies: jest.fn(),
}))

const createServiceCatalogueServiceStub = (
  language: string,
): Pick<ServiceCatalogueService, 'getProducts' | 'getProduct'> => ({
  getProducts: async () => {
    return [
      { name: 'product 1', components: [{ name: 'component 1', description: 'component 1', language }] },
    ] as Product[]
  },
  getProduct: async () => {
    return { name: 'product 1', components: [{ name: 'component 1', description: 'component 1', language }] } as Product
  },
})

const alertsServiceStub: Pick<AlertsService, 'getAlertsForComponent'> = {
  getAlertsForComponent: async () =>
    [{ status: { state: 'active' }, labels: { component: 'component 1', alertname: 'alert 1' } }] as Alert[],
}

const alertServiceNoAlertsStub: Pick<AlertsService, 'getAlertsForComponent'> = {
  getAlertsForComponent: async () => [],
}

const recommendedVersionServiceStub: Pick<RecommendedVersionsService, 'getRecommendedVersions'> = {
  getRecommendedVersions: async () => null,
}

beforeEach(() => {
  ;(dependencyHelpers.compareComponentsDependencies as jest.Mock).mockReturnValue({ items: [] })

  jest.mock('../config', () => ({
    recommendedVersions: {
      kotlinOnly: 'true',
    },
  }))
  const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('Kotlin')
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
        removeEncodedQuotes: (_name: string | null): string | null => null,
        setStringHeader: (key: string, value: unknown): string => {
          return `${key}=${String(value)}`
        },
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
        const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('Kotlin')
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
              removeEncodedQuotes: (_name: string | null): string | null => null,
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
          const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('Kotlin')
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertsServiceStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (_req: unknown): string[] | null => ['invalid product'],
                getString: (_cookies: CookieMap, _name: string): string => 'yes',
                removeEncodedQuotes: (_name: string | null): string | null => null,
                setStringHeader: (_key: string, _value: string): string | null => null,
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
          const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('Kotlin')
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertsServiceStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (_req: unknown): string[] | null => ['product 1'],
                getString: (_cookies: CookieMap, _name: string): string => 'yes',
                removeEncodedQuotes: (_name: string | null): string | null => null,
                setStringHeader: (_key: string, _value: string): string | null => null,
              },
            },
          })
          const res = await request(app).get('/dashboard')
          expect(res.status).toBe(200)
          expect(res.text).toContain('component 1')
        })

        it('does not render the alerts banner when no alerts are firing', async () => {
          const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('Kotlin')
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertServiceNoAlertsStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (_req: unknown): string[] | null => ['product 1'],
                getString: (_cookies: CookieMap, _name: string): string => 'yes',
                removeEncodedQuotes: (_name: string | null): string | null => null,
                setStringHeader: (_key: string, _value: string): string | null => null,
              },
            },
          })
          const res = await request(app).get('/dashboard')
          expect(res.status).toBe(200)
          expect(res.text).not.toContain('alert 1')
        })
      })

      describe('language', () => {
        it('only adds dependency comparison info if kotlinOnly is true and component language is Kotlin', async () => {
          const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('Kotlin')
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertServiceNoAlertsStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (_req: unknown): string[] | null => ['product 1'],
                getString: (_cookies: CookieMap, _name: string): string => 'yes',
                removeEncodedQuotes: (_name: string | null): string | null => null,
                setStringHeader: (_key: string, _value: string): string | null => null,
              },
            },
          })
          await request(app).get('/dashboard')
          expect(compareComponentsDependencies).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ language: 'Kotlin' })]),
            null, // null for recommended
          )
        })
        it('does not add dependency comparison info if kotlinOnly is true and component language is not Kotlin', async () => {
          const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('TypeScript')
          app = appWithAllRoutes({
            services: {
              serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
              alertsService: alertServiceNoAlertsStub as AlertsService,
              recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
              cookieService: {
                getFavouritesFromCookie: (_req: unknown): string[] | null => ['product 1'],
                getString: (_cookies: CookieMap, _name: string): string => 'yes',
                removeEncodedQuotes: (_name: string | null): string | null => null,
                setStringHeader: (_key: string, _value: string): string | null => null,
              },
            },
          })
          await request(app).get('/dashboard')
          expect(compareComponentsDependencies).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('POST/', () => {
    it('redirects to /dashboard and adds product to cookie when product exists', async () => {
      const serviceCatalogueServiceStub = createServiceCatalogueServiceStub('Kotlin')
      app = appWithAllRoutes({
        services: {
          serviceCatalogueService: serviceCatalogueServiceStub as ServiceCatalogueService,
          alertsService: alertServiceNoAlertsStub as AlertsService,
          recommendedVersionsService: recommendedVersionServiceStub as RecommendedVersionsService,
          cookieService: {
            getFavouritesFromCookie: (_req: unknown): string[] | null => [],
            getString: (_cookies: CookieMap, _name: string): string => 'yes',
            removeEncodedQuotes: (_name: string | null): string | null => null,
            setStringHeader: (key: string, value: unknown): string => {
              return `${key}=${String(value)}`
            },
          },
        },
      })
      const res = await request(app).post('/dashboard/saved-products/add').send({ product: 'product 1' })

      expect(res.status).toBe(302)

      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')
      expect(url.searchParams.get('error')).toBeNull()

      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('product_name=product 1')]),
      )
    })

    it('redirects to /dashboard with error when product match not found', async () => {
      const nameInput = 'not a product'
      const res = await request(app).post('/dashboard/saved-products/add').send({ product: nameInput })

      expect(res.status).toBe(302)
      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')
      expect(url.searchParams.get('error')).toBe('notfound')
      expect(url.searchParams.get('value')).toBe(nameInput)

      expect(res.headers['set-cookie'] ?? []).not.toEqual(
        expect.arrayContaining([expect.stringContaining('product_name=')]),
      )
    })
  })

  describe('POST/', () => {
    it('deletes product and redirects to /dashboard when product exists', async () => {
      const res = await request(app).post('/dashboard/saved-products/delete').send({ delete: 'product 1' })

      expect(res.status).toBe(302)
      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')

      expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([expect.not.stringContaining('product 1')]))
      expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('product_name=')]))
    })

    it('redirect to /dashboard when product match not found', async () => {
      const nameInput = 'not a product'
      const res = await request(app).post('/dashboard/saved-products/delete').send({ delete: nameInput })

      expect(res.status).toBe(302)
      const url = new URL(res.header.location, 'http://localhost')
      expect(url.pathname).toBe('/dashboard')

      expect(res.headers['set-cookie'] ?? []).toEqual(
        expect.arrayContaining([expect.stringContaining('product_name=product 1')]),
      )
    })
  })
})
