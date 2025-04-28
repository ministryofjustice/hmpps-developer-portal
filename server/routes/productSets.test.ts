import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { ProductSet, ProductSetListResponseDataItem } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testProductSets = [{ id: 1, attributes: { name: 'testProductSet' } }] as ProductSetListResponseDataItem[]
const testProductSet = {
  ps_id: 'testProductSetId',
  name: 'testProductSetName',
  products: {
    data: [
      {
        id: 23,
        attributes: {
          name: 'productName',
        },
      },
    ],
  },
} as ProductSet

beforeEach(() => {
  serviceCatalogueService.getProductSets.mockResolvedValue(testProductSets)
  serviceCatalogueService.getProductSet.mockResolvedValue(testProductSet)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/product-sets', () => {
  describe('GET /', () => {
    it('should render product sets page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/product-sets')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#productSetsTable').length).toBe(1)
        })
    })
  })

  describe('GET /:productSetId', () => {
    it('should render product set page with products list if there are products', () => {
      return request(app)
        .get('/product-sets/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testProductSet.name)
          expect($('[data-test="product-set-id"]').text()).toBe(testProductSet.ps_id)
          expect($('[data-test="no-products"]').text()).toBe('')
          expect($(`[data-test="product-${testProductSet.products.data[0].id}"]`).text()).toBe(
            testProductSet.products.data[0].attributes.name,
          )
        })
    })

    it('should render service area page with none shown if there are no products', () => {
      const testProductSetNoProducts = {
        ps_id: 'testProductSetId',
        name: 'testProductSetName',
        products: {},
      } as ProductSet

      serviceCatalogueService.getProductSet.mockResolvedValue(testProductSetNoProducts)

      return request(app)
        .get('/product-sets/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testProductSetNoProducts.name)
          expect($('[data-test="product-set-id"]').text()).toBe(testProductSetNoProducts.ps_id)
          expect($('[data-test="no-products"]').text()).toBe('None')
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for product sets', () => {
      return request(app)
        .get('/product-sets/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testProductSets))
        })
    })
  })
})
