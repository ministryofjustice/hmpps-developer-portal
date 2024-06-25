import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ProductDependenciesService, { type ProductDependencies } from '../services/productDependenciesService'

jest.mock('../services/productDependenciesService')

const productDependenciesService = new ProductDependenciesService(null, null) as jest.Mocked<ProductDependenciesService>

let app: Express
const testProducts = [
  {
    productName: 'product-2',
    productCode: 'prod-2',
    componentNames: ['comp-3'],
    dependencies: [],
    dependents: [{ productCode: 'prod-1', productName: 'product-1', componentNames: ['comp-2'] }],
  },
  {
    productName: 'product-1',
    productCode: 'prod-1',
    componentNames: ['comp-1', 'comp-2'],
    dependencies: [{ productCode: 'prod-2', productName: 'product-2', componentNames: ['comp-3'] }],
    dependents: [{ productCode: 'prod-3', productName: 'product-3', componentNames: ['comp-4'] }],
  },
] as ProductDependencies[]

beforeEach(() => {
  productDependenciesService.getProducts.mockResolvedValue(testProducts)

  app = appWithAllRoutes({ services: { productDependenciesService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/product-dependencies', () => {
  describe('GET /', () => {
    it('should render products page', () => {
      return request(app)
        .get('/product-dependencies')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#productName').text()).toContain('product-2')
          expect($('#graph-source').text()).toContain('graph TB')
        })
    })
  })

  describe('GET /:product-code', () => {
    it('should render product page', () => {
      return request(app)
        .get('/product-dependencies/prod-1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#productName').text()).toContain('product-1')
          expect($('#graph-source').text()).toContain('graph TB')
        })
    })

    it('can change orientation', () => {
      return request(app)
        .get('/product-dependencies/prod-1?orientation=LR')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#graph-source').text()).toContain('graph LR')
        })
    })
  })
})
