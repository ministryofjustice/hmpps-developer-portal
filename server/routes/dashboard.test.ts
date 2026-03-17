import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { Product } from '../data/modelTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testProduct = [{ id: 1, name: 'testProduct' }] as Product[]

beforeEach(() => {
  serviceCatalogueService.getProducts.mockResolvedValue(testProduct)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/dashboard', () => {
  describe('GET /', () => {
    it('should render dashboard page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        id: 1,
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/dashboard')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
        })
    })
  })
})
