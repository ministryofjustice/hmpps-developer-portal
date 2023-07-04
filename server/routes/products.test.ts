import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { Product } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express

beforeEach(() => {
  const testProducts = [{ name: 'testProduct', pid: '1' } as Product]
  serviceCatalogueService.getProducts.mockResolvedValue(testProducts)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /products', () => {
  it('should render products page', () => {
    return request(app)
      .get('/products')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.products').text().trim()).toContain('testProduct')
      })
  })
})
