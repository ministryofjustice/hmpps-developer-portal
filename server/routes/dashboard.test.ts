import type { Express } from 'express'
import request from 'supertest'
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
      })
      return request(app).get('/dashboard').expect('Content-Type', 'text/plain; charset=utf-8').expect(302)
    })
  })
})
