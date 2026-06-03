import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import CveSlaService from '../services/cveSlaService'

jest.mock('../services/serviceCatalogueService')
jest.mock('../services/cveSlaService')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const cveSlaService = new CveSlaService(null) as jest.Mocked<CveSlaService>

let app: Express

const mockServiceAreas = [
  { slug: 'hmpps-area', name: 'HMPPS Area' },
  { slug: 'other-area', name: 'Other Area' },
]

const mockCveSlaResult = {
  serviceArea: 'HMPPS Area',
  slaBreached: false,
  products: [
    {
      productName: 'Test Product',
      slaBreached: false,
      components: [
        {
          componentName: 'test-component',
          slaBreached: false,
          vulnerabilities: [
            {
              vulnerabilityId: 'SNYK-001',
              severityLevel: 'HIGH',
              publishedDate: '2026-01-01T00:00:00Z',
              slaBreached: false,
            },
          ],
        },
      ],
    },
  ],
}

beforeEach(() => {
  serviceCatalogueService.getServiceAreas = jest.fn().mockResolvedValue(mockServiceAreas)
  cveSlaService.getCveSlaForServiceArea = jest.fn().mockResolvedValue(mockCveSlaResult)

  app = appWithAllRoutes({ services: { serviceCatalogueService, cveSlaService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/cve-slas', () => {
  describe('GET /', () => {
    it('should redirect to the first service area slug', async () => {
      return request(app).get('/cve-slas').expect(302).expect('Location', 'cve-slas/hmpps-area')
    })
    it('should error if no service areas', async () => {
      serviceCatalogueService.getServiceAreas = jest.fn().mockResolvedValue([])
      return request(app).get('/cve-slas').expect(500)
    })
    it('should call getServiceAreas with withComponents: false', async () => {
      await request(app).get('/cve-slas').expect(302)
      expect(serviceCatalogueService.getServiceAreas).toHaveBeenCalledWith({ withComponents: false })
    })
  })

  describe('GET /:serviceAreaSlug', () => {
    it('should return JSON CVE SLA data for the given service area', async () => {
      return request(app)
        .get('/cve-slas/hmpps-area')
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .expect(res => {
          expect(res.body).toStrictEqual(mockCveSlaResult)
        })
    })

    it('should call getCveSlaForServiceArea with the correct slug', async () => {
      await request(app).get('/cve-slas/hmpps-area').expect(200)
      expect(cveSlaService.getCveSlaForServiceArea).toHaveBeenCalledWith('hmpps-area')
    })

    it('should return data for a different service area slug', async () => {
      const otherResult = { ...mockCveSlaResult, serviceArea: 'Other Area' }
      cveSlaService.getCveSlaForServiceArea.mockResolvedValue(otherResult)

      return request(app)
        .get('/cve-slas/other-area')
        .expect(200)
        .expect(res => {
          expect(res.body.serviceArea).toBe('Other Area')
          expect(cveSlaService.getCveSlaForServiceArea).toHaveBeenCalledWith('other-area')
        })
    })
  })
})
