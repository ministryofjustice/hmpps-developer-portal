import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { ServiceArea, Unwrapped } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testServiceAreas = [
  {
    id: 1,
    name: 'testServiceArea',
    owner: 'The Owner',
    sa_id: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        id: 456,
        name: 'A Product name',
        p_id: 'DPS000',
        slug: 'a-product-name-1',
        subproduct: false,
      },
    ],
  },
] as Unwrapped<ServiceArea>[]
const testServiceArea = {
  id: 123,
  sa_id: 'testsa_id',
  name: 'testServiceAreaName',
  owner: 'testServiceAreaOwner',
  products: [
    {
      id: 23,
      name: 'productName',
      components: [{ id: 1, name: 'component-1' }],
    },
  ],
} as Unwrapped<ServiceArea>

beforeEach(() => {
  serviceCatalogueService.getServiceAreas.mockResolvedValue(testServiceAreas)
  serviceCatalogueService.getServiceArea.mockResolvedValue(testServiceArea)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/service-areas', () => {
  describe('GET /', () => {
    it('should render service areas page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        id: 1,
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/service-areas')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#serviceAreasTable').length).toBe(1)
        })
    })
  })

  describe('GET /:sa_id', () => {
    it('should render service area page with products list if there are products', () => {
      return request(app)
        .get('/service-areas/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testServiceArea.name)
          expect($('[data-test="service-area-id"]').text()).toBe(testServiceArea.sa_id)
          expect($('[data-test="service-area-owner"]').text()).toBe(testServiceArea.owner)
          expect($('[data-test="no-products"]').text()).toBe('')

          const product = testServiceArea.products[0]
          const component = product.components[0]
          expect($(`[data-test="product-${product.id}"]`).text()).toBe(product.name)
          expect($(`[data-test="product-${product.id}-component-${component.id}"]`).text()).toBe(component.name)
        })
    })

    it('should render service area page with none shown if there are no products', () => {
      const testServiceAreaNoProducts = {
        id: 1,
        sa_id: 'testsa_id',
        name: 'testServiceAreaName',
        products: {},
      } as Unwrapped<ServiceArea>

      serviceCatalogueService.getServiceArea.mockResolvedValue(testServiceAreaNoProducts)

      return request(app)
        .get('/service-areas/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testServiceAreaNoProducts.name)
          expect($('[data-test="service-area-id"]').text()).toBe(testServiceAreaNoProducts.sa_id)
          expect($('[data-test="no-products"]').text()).toBe('None')
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for service areas', () => {
      return request(app)
        .get('/service-areas/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testServiceAreas))
        })
    })
  })
})
