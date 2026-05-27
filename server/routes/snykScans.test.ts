import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { SnykScan, SnykVulnerability, Team } from '../data/modelTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express

const testSnykScans = [
  {
    id: 1,
    name: 'component-a',
    environment_name: 'dev',
    build_image_tag: '2026-01-01.1.abcdef0',
    scan_status: 'Succeeded',
    snyk_scan_timestamp: '2026-05-27T10:00:00.000Z',
    critical_fixable: 1,
    critical_unfixable: 0,
    high_fixable: 1,
    high_unfixable: 0,
    medium_fixable: 0,
    medium_unfixable: 0,
    low_fixable: 0,
    low_unfixable: 0,
    unknown_fixable: 0,
    unknown_unfixable: 0,
    snyk_ids: ['SNYK-HIGH-1', 'SNYK-CRITICAL-1'],
  },
] as unknown as SnykScan[]

const testTeams = [
  {
    name: 'team-a',
    products: [
      {
        portfolio: 'portfolio-a',
        components: [{ name: 'component-a' }],
      },
    ],
  },
] as unknown as Team[]

const testSnykScan = {
  id: 11,
  name: 'component-a',
  environment_name: 'dev',
  build_image_tag: '2026-01-01.1.abcdef0',
  image_id: 'ghcr.io/moj/component-a:2026-01-01.1.abcdef0',
  scan_status: 'Succeeded',
  snyk_scan_timestamp: '2026-05-27T10:00:00.000Z',
  critical_fixable: 1,
  critical_unfixable: 0,
  high_fixable: 1,
  high_unfixable: 0,
  medium_fixable: 0,
  medium_unfixable: 0,
  low_fixable: 0,
  low_unfixable: 0,
  unknown_fixable: 0,
  unknown_unfixable: 0,
  snyk_ids: ['SNYK-HIGH-1', 'SNYK-CRITICAL-1'],
  snyk_cves: [{ snyk_id: 'SNYK-HIGH-1', cves: ['CVE-2026-0001'] }],
} as unknown as SnykScan

const testSnykVulnerabilities = [
  {
    snyk_id: 'SNYK-HIGH-1',
    severity: 'HIGH',
    title: 'High vulnerability',
    cves: ['CVE-2026-0001'],
    affected_package_name: 'openssl',
  },
  {
    snyk_id: 'SNYK-CRITICAL-1',
    severity: 'CRITICAL',
    title: 'Critical vulnerability',
    cves: ['CVE-2026-0002'],
    affected_package_name: 'glibc',
  },
] as unknown as SnykVulnerability[]

beforeEach(() => {
  serviceCatalogueService.getSnykScans.mockResolvedValue(testSnykScans)
  serviceCatalogueService.getTeams.mockResolvedValue(testTeams)
  serviceCatalogueService.getSnykScan.mockResolvedValue(testSnykScan)
  serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue(testSnykVulnerabilities)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/snyk-scans', () => {
  describe('GET /', () => {
    it('should render snyk scans page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        id: 1,
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/snyk-scans')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#snykScansTable').length).toBe(1)
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for snyk scans', () => {
      return request(app)
        .get('/snyk-scans/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.body).toHaveLength(1)
          expect(res.body[0]).toEqual(
            expect.objectContaining({
              name: 'component-a',
              environment_name: 'dev',
              team: 'team-a',
              portfolio: 'portfolio-a',
            }),
          )
        })
    })
  })

  describe('GET /:componentName/environments/:environmentName', () => {
    it('should render snyk detail page with enriched vulnerability rows', () => {
      return request(app)
        .get('/snyk-scans/component-a/environments/dev')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          expect($('[data-test="detail-page-title"]').text()).toContain('component-a')
          expect($('table.snykData').length).toBeGreaterThan(0)
          expect($('td').text()).toContain('SNYK-CRITICAL-1')
          expect($('td').text()).toContain('SNYK-HIGH-1')

          const allText = $('body').text()
          const criticalIndex = allText.indexOf('SNYK-CRITICAL-1')
          const highIndex = allText.indexOf('SNYK-HIGH-1')
          expect(criticalIndex).toBeGreaterThan(-1)
          expect(highIndex).toBeGreaterThan(-1)
          expect(criticalIndex).toBeLessThan(highIndex)
        })
    })
  })
})
