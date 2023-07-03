import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import { StrapiService } from '../services'
import { Product } from '../data/strapiApiTypes'
import type { ApplicationInfo } from '../applicationInfo'

jest.mock('../applicationInfo', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        applicationName: 'test',
        buildNumber: '1',
        gitRef: 'long ref',
        gitShortHash: 'short ref',
      } as ApplicationInfo
    }),
  }
})
jest.mock('../services/strapiService.ts')

const strapiService = new StrapiService(null) as jest.Mocked<StrapiService>

let app: Express

beforeEach(() => {
  const testProduct = [{ name: 'testProduct', pid: '1' } as Product]
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
        const $ = cheerio.load(res.text)
        expect($('.products').text().trim()).toContain('Object')
      })
  })
})
