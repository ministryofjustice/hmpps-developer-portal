import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { ScheduledJob, ScheduledJobListResponseDataItem } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testScheduledJobs = [{ id: 1, attributes: { name: 'testScheduledJob ' } }] as ScheduledJobListResponseDataItem[]
const testScheduledJob = {
  ps_id: 'testScheduledJob Id',
  name: 'testScheduledJob Name',
  products: {
    data: [
      {
        id: 23,
        attributes: {
          name: 'productName',
        },
      },
    ],
  },
} as ScheduledJob

beforeEach(() => {
  serviceCatalogueService.getScheduledJobs.mockResolvedValue(testScheduledJobs)
  serviceCatalogueService.getScheduledJob.mockResolvedValue(testScheduledJob)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/scheduled-job', () => {
  describe('GET /', () => {
    it('should render scheduled jobs page', () => {
      return request(app)
        .get('/scheduled-jobs')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#ScheduledJob sTable').length).toBe(1)
        })
    })
  })

  describe('GET /:ScheduledJob Id', () => {
    it('should render scheduled job page with job list if there are jobs', () => {
      return request(app)
        .get('/scheduled-jobs/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testScheduledJob.name)
          expect($('[data-test="product-set-id"]').text()).toBe(testScheduledJob.name)
          expect($('[data-test="no-products"]').text()).toBe('')
        })
    })

    it('should render service area page with none shown if there are no jobs', () => {
      const testScheduledJobNoJobs = {
        name: 'testScheduledJob Name',
      } as ScheduledJob

      serviceCatalogueService.getScheduledJob.mockResolvedValue(testScheduledJobNoJobs)

      return request(app)
        .get('/scheduled-jobs/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testScheduledJobNoJobs.name)
          expect($('[data-test="product-set-id"]').text()).toBe(testScheduledJobNoJobs.name)
          expect($('[data-test="no-products"]').text()).toBe('None')
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for scheduled jobs', () => {
      return request(app)
        .get('/scheduled-jobs/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testScheduledJobs))
        })
    })
  })
})
