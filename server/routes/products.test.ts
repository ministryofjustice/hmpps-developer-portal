import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { Product } from '../data/modelTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testProducts = [{ id: 1, name: 'testProduct', p_id: '1', slug: 'testproduct' }] as Product[]
const testProduct = {
  name: 'z-index testProduct',
  p_id: '1',
  lead_developer: 'Some Lead Developer',
  product_manager: 'Some Product Manager',
  delivery_manager: 'Some Lead Developer',
} as Product

beforeEach(() => {
  serviceCatalogueService.getProducts.mockResolvedValue(testProducts)
  serviceCatalogueService.getProduct.mockResolvedValue(testProduct)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/products', () => {
  describe('GET /', () => {
    it('should render products page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        id: 1,
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/products')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#productsTable').length).toBe(1)
        })
    })
  })

  describe('GET /:productId', () => {
    it('should render product page', () => {
      return request(app)
        .get('/products/testproduct')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testProduct.name)
          expect($('[data-test="product-manager"]').text()).toBe(testProduct.product_manager)
          expect($('[data-test="delivery-manager"]').text()).toBe(testProduct.delivery_manager)
          expect($('[data-test="lead-developer"]').text()).toBe(testProduct.lead_developer)
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for products', () => {
      return request(app)
        .get('/products/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testProducts))
        })
    })
  })
})
