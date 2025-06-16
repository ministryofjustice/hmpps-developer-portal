import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { StrapiServiceArea } from '../data/strapiApiTypes'
import { createModelServiceArea } from '../data/converters/serviceArea.test'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testServiceAreas = [createModelServiceArea(1, 'testServiceArea')]
const testServiceArea = {
  sa_id: 'testServiceAreaId',
  name: 'testServiceAreaName',
  owner: 'testServiceAreaOwner',
  products: {
    data: [
      {
        id: 23,
        attributes: {
          name: 'productName',
          components: { data: [{ id: 1, attributes: { name: 'component-1' } }] },
        },
      },
    ],
  },
} as StrapiServiceArea

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

  describe('GET /:serviceAreaId', () => {
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

          const product = testServiceArea.products.data[0]
          const component = product.attributes.components.data[0]
          expect($(`[data-test="product-${product.id}"]`).text()).toBe(product.attributes.name)
          expect($(`[data-test="product-${product.id}-component-${component.id}"]`).text()).toBe(
            component.attributes.name,
          )
        })
    })

    it('should render service area page with none shown if there are no products', () => {
      const testServiceAreaNoProducts = {
        sa_id: 'testServiceAreaId',
        name: 'testServiceAreaName',
        products: {},
      } as StrapiServiceArea

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
