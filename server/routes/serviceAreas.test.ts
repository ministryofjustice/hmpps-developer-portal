import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { ServiceArea, ServiceAreaListResponseDataItem } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testServiceAreas = [{ id: 1, attributes: { name: 'testServiceArea' } }] as ServiceAreaListResponseDataItem[]
const testServiceArea = { name: 'Service Area' } as ServiceArea

beforeEach(() => {
  serviceCatalogueService.getServiceAreas.mockResolvedValue(testServiceAreas)
  serviceCatalogueService.getServiceArea.mockResolvedValue(testServiceArea)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/service-areas', () => {
  describe('GET /', () => {
    it('should render service areas page', () => {
      return request(app)
        .get('/service-areas')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#serviceAreas')).toBeDefined()
        })
    })
  })

  describe('GET /:serviceAreaId', () => {
    it('should render service area page', () => {
      return request(app)
        .get('/service-areas/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testServiceArea.name)
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for service areas', () => {
      return request(app)
        .get('/service-areas/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testServiceAreas))
        })
    })
  })
})
