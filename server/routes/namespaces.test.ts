import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { ScheduledJob } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express

type RdsEntry = Record<string, unknown>
type ElasticacheCluster = Record<string, unknown>
type PingdomCheck = Record<string, unknown>
type HmppsTemplate = Record<string, unknown>

const mockScheduledJob = {
  id: 12,
  name: 'hmpps-mock-scheduled-job',
  description: 'Mock description.',
  schedule: '05 */6 * * *',
  last_scheduled_run: '2025-09-08T06:08:39.972Z',
  createdAt: '2025-04-24T12:27:23.968Z',
  updatedAt: '2025-09-08T06:08:39.988Z',
  publishedAt: '2025-04-24T12:27:24.732Z',
  result: 'Succeeded',
  error_details: [],
  last_successful_run: '2025-09-08T06:08:39.972Z',
  documentId: 'mockId',
} as ScheduledJob

const mockNamespaces = [
  {
    id: 123,
    name: 'mock-namespace-1',
    createdAt: '2024-08-22T16:47:36.494Z',
    updatedAt: '2025-09-08T06:06:29.875Z',
    publishedAt: '2024-08-22T16:47:36.485Z',
    documentId: 'mockId1',
    rds_instance: [] as RdsEntry[],
    elasticache_cluster: [] as ElasticacheCluster[],
    pingdom_check: [] as PingdomCheck[],
    hmpps_template: [] as HmppsTemplate[],
  },
  {
    id: 456,
    name: 'mock-namespace-2',
    createdAt: '2024-08-22T16:47:39.016Z',
    updatedAt: '2025-09-08T06:06:30.097Z',
    publishedAt: '2024-08-22T16:47:39.007Z',
    documentId: 'mockId2',
    rds_instance: [] as RdsEntry[],
    elasticache_cluster: [] as ElasticacheCluster[],
    pingdom_check: [] as PingdomCheck[],
    hmpps_template: [] as HmppsTemplate[],
  },
]

const mockNamespace = {
  id: 123,
  name: 'hmpps-mock-namespace',
  createdAt: '2024-08-22T16:47:39.016Z',
  updatedAt: '2025-09-08T06:06:30.097Z',
  publishedAt: '2024-08-22T16:47:39.007Z',
  documentId: 'mockId',
  rds_instance: [
    {
      tf_label: 'hmpps_mock_namespace_api_rds',
      namespace: 'hmpps-mock-namespace-api-dev',
      db_instance_class: 'db.t3.small',
      db_engine_version: '16',
      rds_family: 'postgres16',
      db_max_allocated_storage: null,
      allow_major_version_upgrade: null,
      allow_minor_version_upgrade: null,
      deletion_protection: null,
      maintenance_window: null,
      performance_insights_enabled: null,
      is_production: false,
      environment_name: 'dev',
    },
  ] as RdsEntry[],
  elasticache_cluster: [] as ElasticacheCluster[],
  pingdom_check: [] as PingdomCheck[],
  hmpps_template: [] as HmppsTemplate[],
}

beforeEach(() => {
  serviceCatalogueService.getScheduledJob.mockResolvedValue(mockScheduledJob)
  serviceCatalogueService.getNamespaces.mockResolvedValue(mockNamespaces)
  serviceCatalogueService.getNamespace.mockResolvedValue(mockNamespace)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/namespaces', () => {
  describe('GET /', () => {
    it('should render the namepaces page', async () => {
      return request(app)
        .get('/namespaces')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          expect(serviceCatalogueService.getScheduledJob).toHaveBeenCalled()
          const $ = cheerio.load(res.text)
          const table = $('#namespacesTable')
          expect(table.length).toBe(1)
        })
    })
  })

  describe('GET /data', () => {
    it('should fetch namespaces data', async () => {
      const mockResult = [
        {
          id: 123,
          name: 'mock-namespace-1',
          createdAt: '2024-08-22T16:47:36.494Z',
          updatedAt: '2025-09-08T06:06:29.875Z',
          publishedAt: '2024-08-22T16:47:36.485Z',
          documentId: 'mockId1',
          rds_instance: [] as RdsEntry[],
          elasticache_cluster: [] as ElasticacheCluster[],
          pingdom_check: [] as PingdomCheck[],
          hmpps_template: [] as HmppsTemplate[],
        },
        {
          id: 456,
          name: 'mock-namespace-2',
          createdAt: '2024-08-22T16:47:39.016Z',
          updatedAt: '2025-09-08T06:06:30.097Z',
          publishedAt: '2024-08-22T16:47:39.007Z',
          documentId: 'mockId2',
          rds_instance: [] as RdsEntry[],
          elasticache_cluster: [] as ElasticacheCluster[],
          pingdom_check: [] as PingdomCheck[],
          hmpps_template: [] as HmppsTemplate[],
        },
      ]
      return request(app)
        .get('/namespaces/data')
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual(mockResult)
          expect(serviceCatalogueService.getNamespaces).toHaveBeenCalled()
        })
    })
  })

  describe('GET /:namespaceSlug', () => {
    it('should fetch namespace data and display RDS instances', async () => {
      return request(app)
        .get('/namespaces/hmpps-mock-namespace')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const table = $('.componentData')
          const namespaceRDSLink = table.find('td ul li a')
          expect(serviceCatalogueService.getNamespace).toHaveBeenCalled()
          expect(namespaceRDSLink.text().trim()).toBe('hmpps_mock_namespace_api_rds')
          expect(namespaceRDSLink.attr('href')).toBe(
            '/reports/rds/hmpps_mock_namespace_api_rds-hmpps-mock-namespace-api-dev',
          )
        })
    })
  })
})
