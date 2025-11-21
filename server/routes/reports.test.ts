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
const testReport = {
  tf_label: 'example_rds',
  namespace: 'hmpps-example',
  db_instance_class: 'db.small',
  db_engine_version: '1.0',
  rds_family: 'postgres1',
  db_max_allocated_storage: '1',
} as RdsEntry

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

  // describe('GET /:rdsInstanceSlug', () => {
  //   it('should render rds report page with rds reports if there are any', () => {
  //     return request(app)
  //       .get('/reports/rds/example_rds-hmpps-example')
  //       .expect('Content-Type', /html/)
  //       .expect(res => {
  //         const $ = cheerio.load(res.text)
  //         expect($('[data-test="detail-page-title"]').text()).toContain(testReport.tf_label)
  //         expect($('[data-test="namespace"]').text()).toBe(testReport.namespace)
  //         expect($('[data-test="db_instance_class"]').text()).toBe(testReport.db_instance_class)
  //         expect($('[data-test="db_engine_version"]').text()).toBe(testReport.db_engine_version)
  //         expect($('[data-test="rds_family"]').text()).toBe(testReport.rds_family)
  //         expect($('[data-test="db_max_allocated_storage"]').text()).toBe(testReport.db_max_allocated_storage)
  //       })
  //   })
  // })
})
