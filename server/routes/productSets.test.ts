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
const testProductSet = { name: 'Product Set' } as ProductSet

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
      return request(app)
        .get('/product-sets')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#productSets')).toBeDefined()
        })
    })
  })

  describe('GET /:productSetId', () => {
    it('should render product set page', () => {
      return request(app)
        .get('/product-sets/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testProductSet.name)
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
