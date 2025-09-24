import RecommendedVersionsService from './recommendedVersionsService'
import ServiceCatalogueService from './serviceCatalogueService'

jest.mock('./serviceCatalogueService')

// Minimal shape used by RecommendedVersionsService when reading from Strapi
type strapiComponentMock = {
  versions?: {
    helm_dependencies?: Record<string, unknown>
    helm?: { dependencies?: Record<string, unknown> }
    gradle?: { hmpps_gradle_spring_boot?: unknown }
  }
  values?: {
    helm_dependencies?: Record<string, unknown>
    helm?: { dependencies?: Record<string, unknown> }
    gradle?: { hmpps_gradle_spring_boot?: unknown }
  }
}

describe('RecommendedVersionsService (Strapi only)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const makeSvcWithComponent = (component: strapiComponentMock) => {
    const getComponentMock = jest.fn().mockResolvedValue(component)
    ;(ServiceCatalogueService as unknown as jest.Mock).mockImplementation(() => ({
      getComponent: getComponentMock,
    }))
    const mockCatalogue = new (ServiceCatalogueService as unknown as jest.Mock)()
    const svc = new RecommendedVersionsService(mockCatalogue as unknown as ServiceCatalogueService)
    return { svc, mockCatalogue, getComponentMock }
  }

  it('returns versions from Strapi component (preferred keys)', async () => {
    const component = {
      versions: {
        helm_dependencies: {
          generic_prometheus_alerts: { ref: '1.2.3' },
          generic_service: { ref: '4.5.6' },
        },
        gradle: {
          hmpps_gradle_spring_boot: { ref: '7.8.9' },
        },
      },
    }
    const { svc } = makeSvcWithComponent(component)
    const result = await svc.getRecommendedVersions()
    expect(result.helmDependencies.genericPrometheusAlerts).toBe('1.2.3')
    expect(result.helmDependencies.genericService).toBe('4.5.6')
    expect(result.gradle.hmppsGradleSpringBoot).toBe('7.8.9')
    expect(result.metadata.source).toBe('strapi')
  })

  it('supports legacy helm dependencies shape', async () => {
    const component = {
      versions: {
        helm: {
          dependencies: {
            'generic-prometheus-alerts': '2.3.4',
            'generic-service': '5.6.7',
          },
        },
        gradle: {
          hmpps_gradle_spring_boot: '8.9.10',
        },
      },
    }
    const { svc } = makeSvcWithComponent(component)
    const result = await svc.getRecommendedVersions()
    expect(result.helmDependencies.genericPrometheusAlerts).toBe('2.3.4')
    expect(result.helmDependencies.genericService).toBe('5.6.7')
    expect(result.gradle.hmppsGradleSpringBoot).toBe('8.9.10')
    expect(['strapi', 'partial']).toContain(result.metadata.source)
  })

  it('returns none when Strapi has no versions', async () => {
    const component = { versions: {} }
    const { svc } = makeSvcWithComponent(component)
    const result = await svc.getRecommendedVersions()
    expect(result.helmDependencies.genericPrometheusAlerts).toBeUndefined()
    expect(result.helmDependencies.genericService).toBeUndefined()
    expect(result.gradle.hmppsGradleSpringBoot).toBeUndefined()
    expect(result.metadata.source).toBe('none')
  })

  it('caches results for TTL duration', async () => {
    const component = {
      versions: {
        helm_dependencies: {
          generic_prometheus_alerts: { ref: '9.9.9' },
          generic_service: { ref: '9.9.8' },
        },
        gradle: {
          hmpps_gradle_spring_boot: { ref: '9.9.7' },
        },
      },
    }
    const { svc, getComponentMock } = makeSvcWithComponent(component)
    const first = await svc.getRecommendedVersions()
    expect(first.gradle.hmppsGradleSpringBoot).toBe('9.9.7')

    const second = await svc.getRecommendedVersions()
    expect(second).toEqual(first)
    // getComponent should have been called only once due to cache
    expect(getComponentMock).toHaveBeenCalledTimes(1)
  })
})
