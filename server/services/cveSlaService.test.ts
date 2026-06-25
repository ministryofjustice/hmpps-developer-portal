import ServiceCatalogueService from './serviceCatalogueService'
import CveSlaService, { Vulnerability, type ComponentInfo, type ProductInfo } from './cveSlaService'
import { Component, Product, ServiceArea, SnykVulnerability } from '../data/strapiApiTypes'
import { relativeTimeFromNow } from '../utils/utils'

jest.mock('./serviceCatalogueService')

const DAYS_IN_MILLIS = 24 * 60 * 60 * 1000

const makeVuln = (overrides: Partial<SnykVulnerability> = {}): SnykVulnerability => ({
  snyk_id: 'SNYK-001',
  severity: 'HIGH',
  published_date: '2020-01-01',
  ...overrides,
})

const makeVulnInfo = (overrides: Partial<Vulnerability> = {}): Vulnerability => ({
  vulnerabilityId: 'SNYK-001',
  severityLevel: 'HIGH',
  publishedDate: '2020-01-01',
  slaBreached: true,
  ...overrides,
})

const makeComponent = (overrides: Partial<Component> = {}): Component =>
  ({
    name: 'my-component',
    envs: [
      {
        name: 'production',
        snyk_scan: { snyk_ids: ['SNYK-001'] },
      },
    ],
    ...overrides,
  }) as unknown as Component

const makeServiceArea = (overrides: Partial<ServiceArea> = {}): ServiceArea =>
  ({
    name: 'My Service Area',
    slug: 'service-area-1',
    products: [
      {
        name: 'My Product',
        slug: 'product-1',
        components: [makeComponent()],
      },
    ],
    ...overrides,
  }) as unknown as ServiceArea

describe('CveSlaService', () => {
  const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
  const cveSlaService = new CveSlaService(serviceCatalogueService)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('slaBreached', () => {
    it('returns true when published date is more than 7 days ago', () => {
      const longAgo = new Date(Date.now() - 8 * DAYS_IN_MILLIS).toISOString()
      expect(cveSlaService.slaBreached(longAgo)).toBe(true)
    })

    it('returns false when published date is within 7 days', () => {
      const recent = new Date(Date.now() - 6 * DAYS_IN_MILLIS).toISOString()
      expect(cveSlaService.slaBreached(recent)).toBe(false)
    })

    it('returns false when published date is exactly 7 days ago', () => {
      const exactly30 = new Date(Date.now() - 7 * DAYS_IN_MILLIS).toISOString()
      expect(cveSlaService.slaBreached(exactly30)).toBe(false)
    })
  })

  describe('compare vulnerability info', () => {
    it('priortises severity', () => {
      const v1 = makeVulnInfo({ vulnerabilityId: 'vuln-1', severityLevel: 'HIGH', publishedDate: '2026-01-01' })
      const v2 = makeVulnInfo({ vulnerabilityId: 'vuln-2', severityLevel: 'CRITICAL', publishedDate: '2026-01-01' })
      const v3 = makeVulnInfo({ vulnerabilityId: 'vuln-3', severityLevel: 'MEDIUM', publishedDate: '2026-01-01' })

      const vulnerabilityIds = [v1, v2, v3]
        .sort(cveSlaService.compareVulnerabilities)
        .map(vulnerability => vulnerability.vulnerabilityId)
      expect(vulnerabilityIds).toStrictEqual(['vuln-2', 'vuln-1', 'vuln-3'])
    })

    it('then by date', () => {
      const v1 = makeVulnInfo({ vulnerabilityId: 'vuln-1', severityLevel: 'HIGH', publishedDate: '2026-01-01' })
      const v2 = makeVulnInfo({ vulnerabilityId: 'vuln-2', severityLevel: 'HIGH', publishedDate: '2026-01-03' })
      const v3 = makeVulnInfo({ vulnerabilityId: 'vuln-3', severityLevel: 'HIGH', publishedDate: '2026-01-02' })

      const vulnerabilityIds = [v1, v2, v3]
        .sort(cveSlaService.compareVulnerabilities)
        .map(vulnerability => vulnerability.vulnerabilityId)
      expect(vulnerabilityIds).toStrictEqual(['vuln-1', 'vuln-3', 'vuln-2'])
    })

    it('then by name', () => {
      const v1 = makeVulnInfo({ vulnerabilityId: 'vuln-1', severityLevel: 'HIGH', publishedDate: '2026-01-01' })
      const v2 = makeVulnInfo({ vulnerabilityId: 'vuln-2', severityLevel: 'HIGH', publishedDate: '2026-01-01' })
      const v3 = makeVulnInfo({ vulnerabilityId: 'vuln-3', severityLevel: 'HIGH', publishedDate: '2026-01-01' })

      const vulnerabilityIds = [v1, v2, v3]
        .sort(cveSlaService.compareVulnerabilities)
        .map(vulnerability => vulnerability.vulnerabilityId)
      expect(vulnerabilityIds).toStrictEqual(['vuln-1', 'vuln-2', 'vuln-3'])
    })
  })

  describe('compare component info', () => {
    const vulnerability = {
      publishedDate: '2020-01-02',
      severityLevel: 'HIGH',
      slaBreached: true,
      vulnerabilityId: '01',
      breachedSince: relativeTimeFromNow(new Date('2020-01-02')),
    }

    it('priortises vulnerability count', () => {
      const c1: Partial<ComponentInfo> = {
        name: 'aaa',
        breachedVulnerabilities: [vulnerability],
      }
      const c2: Partial<ComponentInfo> = {
        name: 'zzz',
        breachedVulnerabilities: [vulnerability, vulnerability],
      }
      const c3: Partial<ComponentInfo> = {
        name: 'mmm',
        breachedVulnerabilities: [vulnerability, vulnerability, vulnerability],
      }

      const names = [c1, c2, c3].sort(cveSlaService.compareComponents).map(component => component.name)
      expect(names).toStrictEqual(['mmm', 'zzz', 'aaa'])
    })

    it('priortises by name is equal vuln count', () => {
      const c1: Partial<ComponentInfo> = {
        name: 'aaa',
        breachedVulnerabilities: [vulnerability],
      }
      const c2: Partial<ComponentInfo> = {
        name: 'zzz',
        breachedVulnerabilities: [vulnerability],
      }
      const c3: Partial<ComponentInfo> = {
        name: 'mmm',
        breachedVulnerabilities: [vulnerability],
      }

      const names = [c1, c2, c3].sort(cveSlaService.compareComponents).map(component => component.name)
      expect(names).toStrictEqual(['aaa', 'mmm', 'zzz'])
    })
  })

  describe('compare product info', () => {
    it('priortises breached components count', () => {
      const p1: Partial<ProductInfo> = {
        name: 'aaa',
        numberOfBreachedComponents: 1,
      }
      const p2: Partial<ProductInfo> = {
        name: 'zzz',
        numberOfBreachedComponents: 2,
      }
      const p3: Partial<ProductInfo> = {
        name: 'mmm',
        numberOfBreachedComponents: 3,
      }

      const names = [p1, p2, p3].sort(cveSlaService.compareProducts).map(product => product.name)
      expect(names).toStrictEqual(['mmm', 'zzz', 'aaa'])
    })

    it('priortises by name is equal vuln count', () => {
      const p1: Partial<ProductInfo> = {
        name: 'aaa',
        numberOfBreachedComponents: 1,
      }
      const p2: Partial<ProductInfo> = {
        name: 'zzz',
        numberOfBreachedComponents: 1,
      }
      const p3: Partial<ProductInfo> = {
        name: 'mmm',
        numberOfBreachedComponents: 1,
      }

      const names = [p1, p2, p3].sort(cveSlaService.compareProducts).map(product => product.name)
      expect(names).toStrictEqual(['aaa', 'mmm', 'zzz'])
    })
  })

  describe('getCveSlaForServiceArea', () => {
    it('returns the expected structure for a service area with an SLA-breached HIGH vulnerability', async () => {
      const oldDate = new Date(Date.now() - 60 * DAYS_IN_MILLIS).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([makeVuln({ published_date: oldDate })])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea())

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result).toStrictEqual({
        name: 'My Service Area',
        slug: 'service-area-1',
        numberOfBreachedProducts: 1,
        numberOfBreachedVulnerabilities: 1,
        productsWithComponents: [
          {
            name: 'My Product',
            slug: 'product-1',
            numberOfBreachedComponents: 1,
            numberOfBreachedVulnerabilities: 1,
            components: [
              {
                name: 'my-component',
                scanName: 'production',
                breachedVulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                    breachedSince: relativeTimeFromNow(new Date(oldDate)),
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it('returns slaBreached: false when all HIGH/CRITICAL vulnerabilities are within the SLA window', async () => {
      const recentDate = new Date(Date.now() - 5 * DAYS_IN_MILLIS).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([makeVuln({ published_date: recentDate })])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea())

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.numberOfBreachedProducts).toStrictEqual(0)
      expect(result.productsWithComponents[0].components[0].breachedVulnerabilities).toHaveLength(0)
    })

    it('filters out LOW and MEDIUM severity vulnerabilities', async () => {
      const oldDate = new Date(Date.now() - 60 * DAYS_IN_MILLIS).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([
        makeVuln({ snyk_id: 'SNYK-LOW', severity: 'LOW', published_date: oldDate }),
        makeVuln({ snyk_id: 'SNYK-MEDIUM', severity: 'MEDIUM', published_date: oldDate }),
      ])
      serviceCatalogueService.getServiceArea.mockResolvedValue(
        makeServiceArea({
          products: [
            {
              name: 'My Product',
              components: [
                makeComponent({
                  envs: [{ name: 'production', snyk_scan: { snyk_ids: ['SNYK-LOW', 'SNYK-MEDIUM'] } }] as never,
                }),
              ],
            } as Product,
          ],
        }),
      )

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.numberOfBreachedProducts).toStrictEqual(0)
      expect(result.productsWithComponents[0].components[0].breachedVulnerabilities).toHaveLength(0)
    })

    it('includes CRITICAL severity vulnerabilities', async () => {
      const oldDate = new Date(Date.now() - 60 * DAYS_IN_MILLIS).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([
        makeVuln({ snyk_id: 'SNYK-CRIT', severity: 'CRITICAL', published_date: oldDate }),
      ])
      serviceCatalogueService.getServiceArea.mockResolvedValue(
        makeServiceArea({
          products: [
            {
              name: 'My Product',
              components: [
                makeComponent({
                  envs: [{ name: 'production', snyk_scan: { snyk_ids: ['SNYK-CRIT'] } }] as never,
                }),
              ],
            } as Product,
          ],
        }),
      )

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.numberOfBreachedProducts).toStrictEqual(1)
      expect(result.productsWithComponents[0].components[0].breachedVulnerabilities[0].severityLevel).toBe('CRITICAL')
    })

    it('uses the production environment (starts with "prod") for vulnerability data', async () => {
      const oldDate = new Date(Date.now() - 60 * DAYS_IN_MILLIS).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([
        makeVuln({ snyk_id: 'SNYK-DEV', severity: 'HIGH', published_date: oldDate }),
        makeVuln({ snyk_id: 'SNYK-PROD', severity: 'HIGH', published_date: oldDate }),
      ])
      serviceCatalogueService.getServiceArea.mockResolvedValue(
        makeServiceArea({
          products: [
            {
              name: 'My Product',
              components: [
                makeComponent({
                  envs: [
                    { name: 'dev', snyk_scan: { snyk_ids: ['SNYK-DEV'] } },
                    { name: 'prod', snyk_scan: { snyk_ids: ['SNYK-PROD'] } },
                  ] as never,
                }),
              ],
            } as Product,
          ],
        }),
      )

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')
      expect(result.numberOfBreachedProducts).toStrictEqual(1)
      expect(result.productsWithComponents[0].components[0].breachedVulnerabilities).toHaveLength(1)
      expect(result.productsWithComponents[0].components[0].breachedVulnerabilities[0].vulnerabilityId).toBe(
        'SNYK-PROD',
      )
    })

    it('returns no vulnerabilities when component has no production environment', async () => {
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([makeVuln()])
      serviceCatalogueService.getServiceArea.mockResolvedValue(
        makeServiceArea({
          products: [
            {
              name: 'My Product',
              components: [
                makeComponent({
                  envs: [{ name: 'dev', snyk_scan: { snyk_ids: ['SNYK-001'] } }] as never,
                }),
              ],
            } as Product,
          ],
        }),
      )

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.numberOfBreachedProducts).toStrictEqual(0)
      expect(result.productsWithComponents[0].components[0].breachedVulnerabilities).toStrictEqual([])
    })

    it('returns slaBreached: false for a service area with no products', async () => {
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea({ products: [] }))

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.numberOfBreachedProducts).toStrictEqual(0)
      expect(result.productsWithComponents).toHaveLength(0)
    })

    it('calls getServiceArea with the correct slug and options', async () => {
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea({ products: [] }))

      await cveSlaService.getCveSlaForServiceArea('some-slug')

      expect(serviceCatalogueService.getServiceArea).toHaveBeenCalledWith({
        serviceAreaSlug: 'some-slug',
        withProducts: true,
        withSnykScan: true,
      })
    })

    it('slaBreached bubbles up correctly: breached component makes product and service area breached', async () => {
      const oldDate = new Date(Date.now() - 60 * DAYS_IN_MILLIS).toISOString()
      const recentDate = new Date(Date.now() - 5 * DAYS_IN_MILLIS).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([
        makeVuln({ snyk_id: 'SNYK-OLD', severity: 'HIGH', published_date: oldDate }),
        makeVuln({ snyk_id: 'SNYK-NEW', severity: 'HIGH', published_date: recentDate }),
      ])
      serviceCatalogueService.getServiceArea.mockResolvedValue(
        makeServiceArea({
          products: [
            {
              name: 'My Product',
              components: [
                makeComponent({
                  name: 'comp-ok',
                  envs: [{ name: 'prod', snyk_scan: { snyk_ids: ['SNYK-NEW'] } }] as never,
                }),
                makeComponent({
                  name: 'comp-breached',
                  envs: [{ name: 'prod', snyk_scan: { snyk_ids: ['SNYK-OLD'] } }] as never,
                }),
              ],
            } as Product,
          ],
        }),
      )

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.numberOfBreachedProducts).toStrictEqual(1)
      expect(result.productsWithComponents).toHaveLength(1)

      expect(result.productsWithComponents[0].numberOfBreachedComponents).toBe(1)
      expect(result.productsWithComponents[0].components).toHaveLength(2)

      expect(result.productsWithComponents[0].components[0]).toMatchObject({
        name: 'comp-breached',
        breachedVulnerabilities: [
          {
            severityLevel: 'HIGH',
            slaBreached: true,
            vulnerabilityId: 'SNYK-OLD',
          },
        ],
      })
      expect(result.productsWithComponents[0].components[1]).toMatchObject({
        name: 'comp-ok',
        breachedVulnerabilities: [],
      })
    })
  })
})
