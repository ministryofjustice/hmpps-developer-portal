import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { RdsEntry } from '../@types'

jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../data/strapiApiClient')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testReports = [
  {
    tf_label: 'example_rds',
    namespace: 'hmpps-example',
    db_instance_class: 'db.small',
    db_engine_version: '1.0',
    rds_family: 'postgres1',
    db_max_allocated_storage: '1',
  },
] as RdsEntry[]

beforeEach(() => {
  serviceCatalogueService.getRdsInstances.mockResolvedValue(testReports)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/reports', () => {
  describe('GET /rds', () => {
    it('should render rds reports page', () => {
      return request(app)
        .get('/reports/rds')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#rdsInstancesTable').length).toBe(1)
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for rds reports', () => {
      return request(app)
        .get(`/reports/rds/data`)
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testReports))
        })
    })
  })
})
