import type { Express } from 'express'
import request from 'supertest'
import { StrapiService } from '../services'
import { appWithAllRoutes } from './testutils/appSetup'
import { Product } from '../data/strapiApiTypes'

const strapiService = new StrapiService(null) as jest.Mocked<StrapiService>

let app: Express

beforeEach(() => {
  const testProduct = { name: 'testProduct', pid: '1' } as Product
  strapiService.getProducts.mockResolvedValue(testProduct)

  app = appWithAllRoutes({ services: { strapiService } })
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
        expect(res.text).toContain('This site is under construction...')
      })
  })
})
