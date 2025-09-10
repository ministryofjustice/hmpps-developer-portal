import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import logger from '../../logger'
import { appWithAllRoutes } from './testutils/appSetup'
import { Alert } from '../@types'
import AlertsService from '../services/alertsService'
import ServiceCatalogueService from '../services/serviceCatalogueService'

jest.mock('../services/serviceCatalogueService')
jest.mock('../services/alertsService')

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

const alertsService = {
  getAndSortAlerts: jest.fn(),
  getAlertEnvironments: jest.fn(),
  getAlertType: jest.fn(),
  getAlertName: jest.fn(),
} as unknown as jest.Mocked<AlertsService>

let app: Express

const mockAlerts = [
  {
    annotations: {
      dashboard_url: 'https://dashboard-test-url.gov.uk',
      message: 'Test alert message.',
      runbook_url: 'https://test-runbook-url.gov.uk',
      summary: 'Test alert summary.',
    },
    endsAt: '2025-08-29T14:19:32.637Z',
    fingerprint: 'a123b456c789d101e',
    receivers: [{ name: 'test-receiver' }],
    startsAt: '2025-08-29T017:10:32.637Z',
    status: { inhibitedBy: [], silencedBy: [], state: 'active' },
    updatedAt: '2025-08-29T14:15:32.640Z',
    generatorURL: 'https://prometheus.test.url.gov.uk',
    labels: {
      alertname: 'test-alert-name',
      application: 'hmpps-test-application',
      businessUnit: 'hmpps',
      clusterName: 'test',
      environment: 'dev',
      productId: 'none',
      prometheus: 'monitoring/prometheus-test',
      queue_name: 'hmpps-test-query',
      severity: 'hmpps-test-severity',
      alert_slack_channel: '#test-channel',
      team: 'Test Team',
    },
  },
] as Alert[]

const mockEnvironments = [
  { text: '', value: '', selected: true },
  { text: 'dev', value: 'dev', selected: false },
  { text: 'none', value: 'none', selected: false },
  { text: 'preprod', value: 'preprod', selected: false },
  { text: 'prod', value: 'prod', selected: false },
  { text: 'stage', value: 'stage', selected: false },
  { text: 'test', value: 'test', selected: false },
]

beforeEach(() => {
  alertsService.getAlertType.mockReturnValue('all')
  alertsService.getAlertName.mockReturnValue('')
  alertsService.getAlertEnvironments.mockResolvedValue(mockEnvironments)
  alertsService.getAndSortAlerts.mockResolvedValue(mockAlerts)

  app = appWithAllRoutes({ services: { serviceCatalogueService, alertsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/alerts', () => {
  describe('GET /', () => {
    it('should render alerts page', async () => {
      return request(app)
        .get('/alerts')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const options = $('#environment option')
          expect(options.length).toBe(mockEnvironments.length)
          expect(options.eq(0).text()).toBe('')
          expect(options.eq(0).attr('selected')).toBe('selected')
          expect(options.eq(1).text()).toBe('dev')
          expect(options.eq(1).attr('value')).toBe('dev')
          expect(options.eq(2).text()).toBe('none')
          expect(options.eq(3).text()).toBe('preprod')
          expect(options.eq(4).text()).toBe('prod')
          expect(options.eq(5).text()).toBe('stage')
          expect(options.eq(6).text()).toBe('test')
        })
    })

    it('should render alerts page with environment options', async () => {
      return request(app).get('/alerts/environment/test-alert').expect(200)
      expect(alertsService.getAlertType).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { alertType: 'environment', alertName: 'test-alert' },
        }),
      )
    })
  })

  describe('GET /all', () => {
    it('should output JSON data for scheduled jobs', async () => {
      return request(app)
        .get('/alerts/all')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(mockAlerts))
        })
    })

    it('should log a warning if getAndSortAlerts throws', async () => {
      alertsService.getAndSortAlerts.mockRejectedValue(new Error('Sort failed'))

      const res = await request(app).get('/alerts/all')
      expect(res.status).toBe(500)
      expect(logger.error).toHaveBeenCalledWith('Failed to get alerts', expect.any(Error))
    })
  })
})
