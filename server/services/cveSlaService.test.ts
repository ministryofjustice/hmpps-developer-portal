import ServiceCatalogueService from './serviceCatalogueService'
import CveSlaService from './cveSlaService'
import { Component, Product, ServiceArea, SnykVulnerability } from '../data/strapiApiTypes'

jest.mock('./serviceCatalogueService')

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
    const DAYS_IN_MILLIS = 24 * 60 * 60 * 1000

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

  describe('getCveSlaForServiceArea', () => {
    it('returns the expected structure for a service area with an SLA-breached HIGH vulnerability', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([makeVuln({ published_date: oldDate })])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea())

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result).toStrictEqual({
        serviceArea: 'My Service Area',
        slaBreached: true,
        products: [
          {
            productName: 'My Product',
            slaBreached: true,
            components: [
              {
                componentName: 'my-component',
                slaBreached: true,
                vulnerabilities: [
                  {
                    vulnerabilityId: 'SNYK-001',
                    severityLevel: 'HIGH',
                    publishedDate: oldDate,
                    slaBreached: true,
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it('returns slaBreached: false when all HIGH/CRITICAL vulnerabilities are within the SLA window', async () => {
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([makeVuln({ published_date: recentDate })])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea())

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.slaBreached).toBe(false)
      expect(result.products[0].slaBreached).toBe(false)
      expect(result.products[0].components[0].slaBreached).toBe(false)
    })

    it('filters out LOW and MEDIUM severity vulnerabilities', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
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

      expect(result.slaBreached).toBe(false)
      expect(result.products[0].components[0].vulnerabilities).toHaveLength(0)
    })

    it('includes CRITICAL severity vulnerabilities', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
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

      expect(result.slaBreached).toBe(true)
      expect(result.products[0].components[0].vulnerabilities[0].severityLevel).toBe('CRITICAL')
    })

    it('uses the production environment (starts with "prod") for vulnerability data', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
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

      expect(result.slaBreached).toBe(false)
      expect(result.products[0].components[0].vulnerabilities).toHaveLength(1)
      expect(result.products[0].components[0].vulnerabilities[0].vulnerabilityId).toBe('SNYK-PROD')
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

      expect(result.slaBreached).toBe(false)
      expect(result.products[0].components[0].vulnerabilities).toStrictEqual([])
    })

    it('returns slaBreached: false for a service area with no products', async () => {
      serviceCatalogueService.getSnykVulnerabilities.mockResolvedValue([])
      serviceCatalogueService.getServiceArea.mockResolvedValue(makeServiceArea({ products: [] }))

      const result = await cveSlaService.getCveSlaForServiceArea('my-service-area')

      expect(result.slaBreached).toBe(false)
      expect(result.products).toHaveLength(0)
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
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
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

      expect(result.slaBreached).toBe(true)
      expect(result.products[0].slaBreached).toBe(true)
      expect(result.products[0].components.find(c => c.componentName === 'comp-ok').slaBreached).toBe(false)
      expect(result.products[0].components.find(c => c.componentName === 'comp-breached').slaBreached).toBe(true)
    })
  })
})
