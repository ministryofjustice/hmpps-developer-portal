import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import SnykVulnerabilityService from '../services/snykVulnerabilityService'
import { SnykScan, SnykVulnerability, Team } from '../data/modelTypes'

jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../services/snykVulnerabilityService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const snykVulnerabilityService = new SnykVulnerabilityService(
  serviceCatalogueService,
) as jest.Mocked<SnykVulnerabilityService>

let app: Express

const testSnykScans = [
  {
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
  },
  {
    id: 21,
    name: 'component-a',
    environment_name: 'prod',
    scan_status: 'Succeeded',
    snyk_ids: ['SNYK-HIGH-1', 'SNYK-CRITICAL-1'],
  },
  {
    id: 22,
    name: 'component-b',
    environment_name: 'prod',
    scan_status: 'Succeeded',
    snyk_ids: ['SNYK-HIGH-2'],
  },
  {
    id: 23,
    name: 'component-c',
    environment_name: 'dev',
    scan_status: 'Succeeded',
    snyk_ids: ['SNYK-HIGH-3'],
  },
] as unknown as SnykScan[]

const testSnykVulnerabilities = [
  {
    snyk_id: 'SNYK-HIGH-1',
    severity: 'HIGH',
    title: 'High vulnerability',
    cves: ['CVE-2026-0001'],
    affected_package_name: 'openssl',
    affected_versions: ['1.1.1'],
    fixed_versions: ['1.1.2'],
    published_date: '2026-05-20',
    language: 'TypeScript',
  },
  {
    snyk_id: 'SNYK-CRITICAL-1',
    severity: 'CRITICAL',
    title: 'Critical vulnerability',
    cves: ['CVE-2026-0002'],
    affected_package_name: 'glibc',
    affected_versions: ['2.31'],
    fixed_versions: ['2.32'],
    published_date: '2026-05-19',
    language: 'Java',
  },
  {
    snyk_id: 'SNYK-HIGH-2',
    severity: 'HIGH',
    cves: ['CVE-2026-0003'],
    affected_package_name: 'lodash',
    language: 'Python',
  },
  {
    snyk_id: 'SNYK-HIGH-3',
    severity: 'HIGH',
    cves: ['CVE-2026-0004'],
    affected_package_name: 'express',
    language: 'Node',
  },
  {
    snyk_id: 'SNYK-MEDIUM-1',
    severity: 'MEDIUM',
    cves: ['CVE-2026-0005'],
    affected_package_name: 'zlib',
    language: 'Go',
  },
] as unknown as SnykVulnerability[]

beforeEach(() => {
  serviceCatalogueService.getSnykScans.mockResolvedValue(testSnykScans)
  serviceCatalogueService.getTeams.mockResolvedValue([
    {
      name: 'team-a',
      products: [
        {
          portfolio: 'portfolio-a',
          components: [{ name: 'component-a' }],
        },
      ],
    },
  ] as unknown as Team[])
  serviceCatalogueService.getSnykScan.mockResolvedValue(
    testSnykScans.find(scan => scan.name === 'component-a' && scan.environment_name === 'dev') as SnykScan,
  )
  serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue(testSnykVulnerabilities)

  const detailScan = testSnykScans.find(
    scan => scan.name === 'component-a' && scan.environment_name === 'dev',
  ) as SnykScan
  const detailVulnerabilities = ['SNYK-CRITICAL-1', 'SNYK-HIGH-1'].map(
    id => testSnykVulnerabilities.find(vulnerability => vulnerability.snyk_id === id) as SnykVulnerability,
  )
  snykVulnerabilityService.getSnykScanPageData.mockResolvedValue({
    snykScan: {
      ...detailScan,
      snyk_vulnerabilities: detailVulnerabilities,
    },
    scanDate: '27 MAY 2026 10:00:00',
    summaryTable: [
      { type: 'Critical Fixable', count: 1 },
      { type: 'High Fixable', count: 1 },
    ],
    vulnerabilitiesResultsTable: detailVulnerabilities,
    secretResultTable: [],
  })
  snykVulnerabilityService.getCriticalReferenceRowsForProd.mockResolvedValue([
    {
      snyk_id: 'SNYK-HIGH-1',
      severity: 'HIGH',
      affected_package_name: 'openssl',
      affected_versions: ['1.1.1'],
      fixed_versions: ['1.1.2'],
      cves: ['CVE-2026-0001'],
      affected_components: ['component-a'],
      published_date: '2026-05-20',
      language: 'TypeScript',
    },
    {
      snyk_id: 'SNYK-CRITICAL-1',
      severity: 'CRITICAL',
      affected_package_name: 'glibc',
      affected_versions: ['2.31'],
      fixed_versions: ['2.32'],
      cves: ['CVE-2026-0002'],
      affected_components: ['component-a'],
      published_date: '2026-05-19',
      language: 'Java',
    },
    {
      snyk_id: 'SNYK-HIGH-2',
      severity: 'HIGH',
      affected_package_name: 'lodash',
      affected_versions: [],
      fixed_versions: [],
      cves: ['CVE-2026-0003'],
      affected_components: ['component-b'],
      published_date: '',
      language: 'Python',
    },
  ])
  snykVulnerabilityService.buildSnykScansTableRows.mockImplementation(scans =>
    scans.map(scan => ({
      environment: scan.environment_name || 'unknown',
      name: scan.name,
      build_image_tag: scan.build_image_tag,
      team: 'team-a',
      portfolio: 'portfolio-a',
      snyk_scan_timestamp: scan.snyk_scan_timestamp,
      snyk_scan_timestamp_ms: Date.parse(scan.snyk_scan_timestamp || '') || 0,
      total_fixed_critical: Number(scan.critical_fixable || 0),
      total_fixed_high: Number(scan.high_fixable || 0),
      total_fixed_medium: Number(scan.medium_fixable || 0),
      total_fixed_low: Number(scan.low_fixable || 0),
      total_fixed_unknown: Number(scan.unknown_fixable || 0),
      total_unfixed_critical: Number(scan.critical_unfixable || 0),
      total_unfixed_high: Number(scan.high_unfixable || 0),
      total_unfixed_medium: Number(scan.medium_unfixable || 0),
      total_unfixed_low: Number(scan.low_unfixable || 0),
      total_unfixed_unknown: Number(scan.unknown_unfixable || 0),
      result_link: `/snyk-scans/${scan.name}/environments/${scan.environment_name || 'unknown'}`,
      vulnerability_search_text: '',
      vulnerability_details_html: 'None',
      vulnerability_refs: [] as Array<{
        snykId: string
        snykUrl: string
        cves: Array<{ value: string; url: string }>
      }>,
    })),
  )

  app = appWithAllRoutes({ services: { serviceCatalogueService, snykVulnerabilityService } })
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
      serviceCatalogueService.getSnykScans.mockResolvedValue([testSnykScans[0]] as SnykScan[])
      return request(app)
        .get('/snyk-scans/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.body).toHaveLength(1)
          expect(res.body[0]).toEqual(
            expect.objectContaining({
              name: 'component-a',
              environment: 'dev',
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

  describe('GET /critical-cves', () => {
    it('should render critical cves page', () => {
      return request(app)
        .get('/snyk-scans/critical-cves')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toContain('Snyk Critical & High CVE References')
          expect($('#snykCriticalCvesTable').length).toBe(1)
        })
    })
  })

  describe('GET /critical-cves/data', () => {
    it('should return critical/high vulnerabilities only for affected prod scan snyk ids with components mapped', () => {
      return request(app)
        .get('/snyk-scans/critical-cves/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.body).toHaveLength(3)

          const returnedIds = res.body.map((row: { snyk_id: string }) => row.snyk_id)
          expect(returnedIds).toEqual(expect.arrayContaining(['SNYK-HIGH-1', 'SNYK-CRITICAL-1', 'SNYK-HIGH-2']))
          expect(returnedIds).not.toContain('SNYK-HIGH-3')
          expect(returnedIds).not.toContain('SNYK-MEDIUM-1')

          const highOne = res.body.find((row: { snyk_id: string }) => row.snyk_id === 'SNYK-HIGH-1')
          expect(highOne).toEqual(
            expect.objectContaining({
              severity: 'HIGH',
              affected_components: ['component-a'],
              language: 'TypeScript',
            }),
          )

          const highTwo = res.body.find((row: { snyk_id: string }) => row.snyk_id === 'SNYK-HIGH-2')
          expect(highTwo).toEqual(
            expect.objectContaining({
              severity: 'HIGH',
              affected_components: ['component-b'],
              language: 'Python',
            }),
          )

          const criticalOne = res.body.find((row: { snyk_id: string }) => row.snyk_id === 'SNYK-CRITICAL-1')
          expect(criticalOne).toEqual(
            expect.objectContaining({
              severity: 'CRITICAL',
              affected_components: ['component-a'],
              language: 'Java',
            }),
          )
        })
    })
  })
})
