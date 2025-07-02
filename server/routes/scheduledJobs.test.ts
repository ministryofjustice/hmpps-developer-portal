import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { ScheduledJob, Unwrapped } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testScheduledJobs = [{ name: 'testScheduledJob ' }] as ScheduledJob[]
const testScheduledJob = {
  id: 1,
  name: 'jobName',
  description: 'jobDescription',
  schedule: 'jobSchedule',
  last_scheduled_run: '2025-04-11T08:46:23.746Z',
  result: 'Succeeded',
  last_successful_run: '2025-04-11T08:46:23.746Z',
} as Unwrapped<ScheduledJob>

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
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#scheduledJobsTable').length).toBe(1)
        })
    })
  })

  describe('GET /:ScheduledJob Id', () => {
    it('should render scheduled job page with job list if there are jobs', () => {
      return request(app)
        .get('/scheduled-jobs/1')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testScheduledJob.name)
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
