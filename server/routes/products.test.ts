import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import AlertsService from '../services/alertsService'
import RecommendedVersionsService from '../services/recommendedVersionsService'
import { Product, Environment } from '../data/modelTypes'
import * as vulnerabilitySummary from '../utils/vulnerabilitySummary'
import { compareComponentsDependencies } from '../services/dependencyComparison'
import { Component } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../services/alertsService')
jest.mock('../services/recommendedVersionsService')
jest.mock('../utils/vulnerabilitySummary')
jest.mock('../services/dependencyComparison')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const alertsService = new AlertsService(null) as jest.Mocked<AlertsService>
const recommendedVersionsService = new RecommendedVersionsService(null) as jest.Mocked<RecommendedVersionsService>

let app: Express
const testProducts = [{ id: 1, name: 'testProduct', p_id: '1', slug: 'testproduct' }] as Product[]
const testProduct = {
  name: 'z-index testProduct',
  p_id: '1',
  lead_developer: 'Some Lead Developer',
  product_manager: 'Some Product Manager',
  delivery_manager: 'Some Lead Developer',
  team: {
    name: 'Test Team',
  },
  components: [
    {
      name: 'test-component',
      description: 'Test Component Description',
    },
  ],
} as Product

const testAlert = [
  {
    annotations: {
      summary: 'Alert Summary',
      message: 'Alert Message',
    },
    startsAt: '2025-10-21T08:14:15Z',
    status: { state: 'active' },
    labels: {
      alertname: 'test-alert',
      environment: 'dev',
    },
  },
]

const mockComponent = {
  name: 'test-component',
  envs: [
    {
      name: 'prod',
      trivy_scan: {
        scan_summary: {
          summary: {
            'os-pkgs': {
              fixed: { HIGH: 1, CRITICAL: 1 },
              unfixed: { HIGH: 0, CRITICAL: 0 },
            },
            'lang-pkgs': {
              fixed: { HIGH: 0, CRITICAL: 0 },
              unfixed: { HIGH: 0, CRITICAL: 0 },
            },
          },
        },
      },
    },
  ],
  language: 'Kotlin',
} as Component

const testProductionEnvironment = {
  name: 'prod',
  namespace: 'test-namespace',
  trivy_scan: {
    scan_summary: {
      summary: {
        secret: {},
        'os-pkgs': {
          fixed: { HIGH: 1, CRITICAL: 1 },
          unfixed: { HIGH: 0, CRITICAL: 0 },
        },
        'lang-pkgs': {
          fixed: { HIGH: 0, CRITICAL: 0 },
          unfixed: { HIGH: 0, CRITICAL: 0 },
        },
      },
    },
  },
} as unknown as Environment

const mockComparison = {
  items: [
    {
      componentName: 'hmpps-adjudications-insights-api',
      key: 'genericPrometheusAlerts',
      current: '1.13.0',
      recommended: '1.14',
      status: 'needs-attention',
    },
    {
      componentName: 'hmpps-adjudications-insights-api',
      key: 'genericService',
      current: '3.11',
      recommended: '3.12',
      status: 'needs-attention',
    },
    {
      componentName: 'hmpps-adjudications-insights-api',
      key: 'hmppsGradleSpringBoot',
      current: '9.1.1',
      recommended: '9.1.1',
      status: 'aligned',
    },
  ],
  summary: {
    totalItems: 3,
    aligned: 1,
    needsUpgrade: 0,
    aboveBaseline: 0,
    missing: 0,
    needsAttention: 2,
  },
  recommendedSource: 'strapi',
}

beforeEach(() => {
  serviceCatalogueService.getProducts.mockResolvedValue(testProducts)
  serviceCatalogueService.getProduct.mockResolvedValue(testProduct)
  alertsService.getAlertsForComponent.mockResolvedValue(testAlert)

  serviceCatalogueService.getComponent.mockResolvedValue(mockComponent)
  const mockedGetProductionEnvironment = jest.spyOn(vulnerabilitySummary, 'getProductionEnvironment')
  mockedGetProductionEnvironment.mockReturnValue(testProductionEnvironment)
  ;(compareComponentsDependencies as jest.Mock).mockResolvedValue(mockComparison)

  app = appWithAllRoutes({ services: { serviceCatalogueService, alertsService, recommendedVersionsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/products', () => {
  describe('GET /', () => {
    it('should render products page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        id: 1,
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/products')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#productsTable').length).toBe(1)
        })
    })
  })

  describe('GET /:productSlug', () => {
    it('should render product page', () => {
      return request(app)
        .get('/products/testproduct')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testProduct.name)
          expect($('[data-test="product-manager"]').text()).toBe(testProduct.product_manager)
          expect($('[data-test="delivery-manager"]').text()).toBe(testProduct.delivery_manager)
          expect($('[data-test="lead-developer"]').text()).toBe(testProduct.lead_developer)
        })
    })

    it('should render product page with alert banner', () => {
      return request(app)
        .get('/products/testproduct')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testProduct.name)
          const alertBanner = $('#product-alert-popup')
          const rows = alertBanner.find('.govuk-table__body .govuk-table__row')
          expect(rows.length).toBe(2)
          const firstCellText = rows.eq(0).find('.govuk-table__cell').first().text().trim()
          expect(firstCellText).toBe('test-alert')
        })
    })

    it('should render product page with Trivy vunnerability banner', () => {
      const mockedCountTrivyHighAndCritical = jest.spyOn(vulnerabilitySummary, 'countTrivyHighAndCritical')
      mockedCountTrivyHighAndCritical.mockReturnValue(2)
      return request(app)
        .get('/products/testproduct')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testProduct.name)
          const vulnerabilityBanner = $('.vulnerability-alert-banner')
          expect(vulnerabilityBanner.length).toBe(1)
          expect(vulnerabilityBanner.text()).toMatch(/Trivy/i)
          const link = vulnerabilityBanner.find('a')
          expect(link.length).toBe(1)
          expect(link.attr('href')).toContain('/trivy-scans')
        })
    })

    it('should render product page with Veracode vunnerability banner', () => {
      const mockedCountVeracodeHighAndVeryHigh = jest.spyOn(vulnerabilitySummary, 'countVeracodeHighAndVeryHigh')
      mockedCountVeracodeHighAndVeryHigh.mockReturnValue(2)
      return request(app)
        .get('/products/testproduct')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#detailPageTitle').text()).toContain(testProduct.name)
          const vulnerabilityBanner = $('.vulnerability-alert-banner')
          expect(vulnerabilityBanner.length).toBe(1)
          expect(vulnerabilityBanner.text()).toMatch(/Veracode/i)
          const link = vulnerabilityBanner.find('a')
          expect(link.length).toBe(1)
          expect(link.attr('href')).toContain('/veracode')
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for products', () => {
      return request(app)
        .get('/products/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testProducts))
        })
    })
  })
})
