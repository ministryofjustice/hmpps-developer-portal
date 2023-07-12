import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { ProductListResponseDataItem } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testProducts = [{ id: 1, attributes: { name: 'testProduct', pid: '1' } } as ProductListResponseDataItem]

beforeEach(() => {
  serviceCatalogueService.getProducts.mockResolvedValue(testProducts)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/products', () => {
  describe('GET /', () => {
    it('should render products page', () => {
      return request(app)
        .get('/products')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#products')).toBeDefined()
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
