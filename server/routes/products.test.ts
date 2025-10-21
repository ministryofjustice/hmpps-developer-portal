import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import AlertsService from '../services/alertsService'
import { Product } from '../data/modelTypes'

jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../services/alertsService')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const alertsService = new AlertsService(null) as jest.Mocked<AlertsService>

let app: Express
const testProducts = [{ id: 1, name: 'testProduct', p_id: '1', slug: 'testproduct' }] as Product[]
const testProduct = {
  name: 'z-index testProduct',
  p_id: '1',
  lead_developer: 'Some Lead Developer',
  product_manager: 'Some Product Manager',
  delivery_manager: 'Some Lead Developer',
  components: [
    {
      name: 'test-component',
      description: 'Test Component Description',
    },
  ],
} as Product

const testAlert = [
  {
    annotations: {
      summary: 'Alert Summary',
      message: 'Alert Message',
    },
    startsAt: '2025-10-21T08:14:15Z',
    status: { state: 'active' },
    labels: {
      alertname: 'test-alert',
      environment: 'dev',
    },
  },
]

beforeEach(() => {
  serviceCatalogueService.getProducts.mockResolvedValue(testProducts)
  serviceCatalogueService.getProduct.mockResolvedValue(testProduct)

  app = appWithAllRoutes({ services: { serviceCatalogueService, alertsService } })
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

  describe('GET /:productSlug', () => {
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

    it('should render product page with alert banner', () => {
      alertsService.getAlertsForComponent.mockResolvedValue(testAlert)
      return request(app)
        .get('/products/testproduct')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testProduct.name)
          expect($('[data-test="product-manager"]').text()).toBe(testProduct.product_manager)
          expect($('[data-test="delivery-manager"]').text()).toBe(testProduct.delivery_manager)
          expect($('[data-test="lead-developer"]').text()).toBe(testProduct.lead_developer)
          const alertBanner = $('#product-alert-popup')
          const rows = alertBanner.find('.govuk-table__body .govuk-table__row')
          expect(rows.length).toBe(2)
          const firstCellText = rows.eq(0).find('.govuk-table__cell').first().text().trim()
          expect(firstCellText).toBe('test-alert')
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
