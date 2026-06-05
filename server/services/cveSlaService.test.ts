import ServiceCatalogueService from './serviceCatalogueService'
import CveSlaService, { type ComponentInfo, type ProductInfo } from './cveSlaService'
import { Component, Product, ServiceArea, SnykVulnerability } from '../data/strapiApiTypes'

jest.mock('./serviceCatalogueService')

const DAYS_IN_MILLIS = 24 * 60 * 60 * 1000

const makeVuln = (overrides: Partial<SnykVulnerability> = {}): SnykVulnerability => ({
  snyk_id: 'SNYK-001',
  severity: 'HIGH',
  published_date: '2020-01-01',
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
    products: [
      {
        name: 'My Product',
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

  describe('compare component info', () => {
    const vulnerability = {
      publishedDate: '2020-01-02',
      severityLevel: 'HIGH',
      slaBreached: true,
      vulnerabilityId: '01',
    }

    it('priortises vulnerability count', () => {
      const c1: Partial<ComponentInfo> = {
        componentName: 'aaa',
        breachedVulnerabilities: [vulnerability],
      }
      const c2: Partial<ComponentInfo> = {
        componentName: 'zzz',
        breachedVulnerabilities: [vulnerability, vulnerability],
      }
      const c3: Partial<ComponentInfo> = {
        componentName: 'mmm',
        breachedVulnerabilities: [vulnerability, vulnerability, vulnerability],
      }

      const names = [c1, c2, c3].sort(cveSlaService.compareComponents).map(component => component.componentName)
      expect(names).toStrictEqual(['mmm', 'zzz', 'aaa'])
    })

    it('priortises by name is equal vuln count', () => {
      const c1: Partial<ComponentInfo> = {
        componentName: 'aaa',
        breachedVulnerabilities: [vulnerability],
      }
      const c2: Partial<ComponentInfo> = {
        componentName: 'zzz',
        breachedVulnerabilities: [vulnerability],
      }
      const c3: Partial<ComponentInfo> = {
        componentName: 'mmm',
        breachedVulnerabilities: [vulnerability],
      }

      const names = [c1, c2, c3].sort(cveSlaService.compareComponents).map(component => component.componentName)
      expect(names).toStrictEqual(['aaa', 'mmm', 'zzz'])
    })
  })

  describe('compare product info', () => {
    const component: ComponentInfo = {} as ComponentInfo

    it('priortises breached components count', () => {
      const p1: Partial<ProductInfo> = {
        productName: 'aaa',
        breachedComponents: [component],
      }
      const p2: Partial<ProductInfo> = {
        productName: 'zzz',
        breachedComponents: [component, component],
      }
      const p3: Partial<ProductInfo> = {
        productName: 'mmm',
        breachedComponents: [component, component, component],
      }

      const names = [p1, p2, p3].sort(cveSlaService.compareProducts).map(product => product.productName)
      expect(names).toStrictEqual(['mmm', 'zzz', 'aaa'])
    })

    it('priortises by name is equal vuln count', () => {
      const p1: Partial<ProductInfo> = {
        productName: 'aaa',
        breachedComponents: [component],
      }
      const p2: Partial<ProductInfo> = {
        productName: 'zzz',
        breachedComponents: [component],
      }
      const p3: Partial<ProductInfo> = {
        productName: 'mmm',
        breachedComponents: [component],
      }

      const names = [p1, p2, p3].sort(cveSlaService.compareProducts).map(product => product.productName)
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
        serviceArea: 'My Service Area',
        breachedProducts: [
          {
            productName: 'My Product',
            components: [
              {
                breachedVulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                  },
                ],
                componentName: 'my-component',
                vulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                  },
                ],
              },
            ],
            breachedComponents: [
              {
                componentName: 'my-component',
                breachedVulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                  },
                ],
                vulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                  },
                ],
              },
            ],
          },
        ],
        productsWithComponents: [
          {
            productName: 'My Product',
            components: [
              {
                breachedVulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                  },
                ],
                componentName: 'my-component',
                vulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                  },
                ],
              },
            ],
            breachedComponents: [
              {
                breachedVulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
                  },
                ],
                componentName: 'my-component',
                vulnerabilities: [
                  {
                    publishedDate: oldDate,
                    severityLevel: 'HIGH',
                    slaBreached: true,
                    vulnerabilityId: 'SNYK-001',
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

      expect(result.breachedProducts).toHaveLength(0)
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

      expect(result.breachedProducts.length).toBe(0)
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

      expect(result.breachedProducts).toHaveLength(1)
      expect(result.breachedProducts[0].components[0].vulnerabilities[0].severityLevel).toBe('CRITICAL')
    })

    it('uses the production environment (starts with "prod") for vulnerability data', async () => {
      const oldDate = new Date(Date.now() - 60 * DAYS_IN_MILLIS).toISOString()
      const recentDate = new Date(Date.now() - 5 * DAYS_IN_MILLIS).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([
        makeVuln({ snyk_id: 'SNYK-DEV', severity: 'HIGH', published_date: oldDate }),
        makeVuln({ snyk_id: 'SNYK-PROD', severity: 'HIGH', published_date: recentDate }),
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
      expect(result.breachedProducts).toHaveLength(0)
      expect(result.productsWithComponents[0].components[0].vulnerabilities).toHaveLength(1)
      expect(result.productsWithComponents[0].components[0].vulnerabilities[0].vulnerabilityId).toBe('SNYK-PROD')
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

      expect(result.breachedProducts).toHaveLength(0)
      expect(result.productsWithComponents[0].components[0].vulnerabilities).toStrictEqual([])
    })

    it('returns slaBreached: false for a service area with no products', async () => {
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea({ products: [] }))

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.breachedProducts).toHaveLength(0)
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

      expect(result.breachedProducts).toHaveLength(1)
      expect(result.productsWithComponents).toHaveLength(1)

      expect(result.breachedProducts[0].breachedComponents).toHaveLength(1)
      expect(result.breachedProducts[0].breachedComponents.find(c => c.componentName === 'comp-ok')).not.toBeNull()
      expect(
        result.breachedProducts[0].breachedComponents.find(c => c.componentName === 'comp-breached'),
      ).not.toBeNull()
    })
  })
})
