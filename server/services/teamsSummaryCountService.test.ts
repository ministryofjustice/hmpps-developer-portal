import TeamsSummaryCountService from './teamsSummaryCountService'
import AlertsService from './alertsService'
import logger from '../../logger'
import { StrapiApiClient } from '../data'
import {
  mockProducts,
  mockProductList,
  mockTeamResponseWithProducts,
  mockTeamResponseWithoutProducts,
  mockComponents2,
  mockProductResponse1,
  mockProductResponse2,
  mockProductComponentMapResponse,
  mockOneProduct,
  mockProductSingleComponentMapResponse,
  mockProductResponseEmpty,
  mockTeamResponseWithTwoProducts,
  mockAlerts,
  mockProductResponseWithComponents,
  mockProductResponseWithComponents2,
  mockTeamAlertSummary,
  mockProductResponseWithNoComponents,
  mockTeamResponseWithEmptyProduct,
  mockTeamResponseWithOneProduct,
  mockProductResponseWithComponentsAndAlerts,
  mockAlertsForProductWithComponentsAndAlerts,
  mockTeamAlertSummaryForProductWithComponentsAndAlerts,
  mockEmptyProducts,
  mockActiveAndInactiveAlerts,
  mockAlertsCount,
  mockTrivyScans,
  mockComponents,
  mockVeracodeComponents,
} from './teamsSummaryCountService.test-helpers'
import ServiceCatalogueService from './serviceCatalogueService'

jest.mock('../../logger')
jest.mock('../data/strapiApiClient')
jest.mock('../applicationInfo', () => ({
  __esModule: true,
  default: () => ({
    applicationName: 'test-app',
    buildNumber: '1.0.0',
    gitRef: 'abcdefg',
    gitShortHash: 'abcdef',
    productId: 'test-product',
    branchName: 'test-branch',
  }),
}))

type ProductParams = { productSlug: string }

const mockLogger = logger as jest.Mocked<typeof logger>
const strapiApiClient = new StrapiApiClient() as jest.Mocked<StrapiApiClient>

const mockAlertsService = {
  alertsApiClientFactory: jest.fn(),
  getAlerts: jest.fn(),
  getAlertsForComponent: jest.fn(),
} as unknown as jest.Mocked<AlertsService>

const mockStrapiClient = strapiApiClient as jest.Mocked<StrapiApiClient>

describe('TeamsSummaryCountService.getProductsForTeam', () => {
  let service: TeamsSummaryCountService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService(mockAlertsService, () => mockStrapiClient)
  })

  it('should return products from array response', async () => {
    strapiApiClient.getTeam.mockResolvedValue(mockTeamResponseWithProducts)
    const result = await service.getProductsForTeam('team-slug')
    expect(strapiApiClient.getTeam).toHaveBeenCalledWith({ teamSlug: 'team-slug' })
    expect(result).toEqual(mockProducts)
  })

  it('should return products from object response', async () => {
    strapiApiClient.getTeam.mockResolvedValue(mockTeamResponseWithProducts)
    const result = await service.getProductsForTeam('team-slug')
    expect(result).toEqual(mockProducts)
  })

  it('should return empty array when no products found', async () => {
    strapiApiClient.getTeam.mockResolvedValue(mockTeamResponseWithoutProducts)
    const result = await service.getProductsForTeam('team-slug')
    expect(result).toEqual([])
  })

  it('should return empty array on error', async () => {
    strapiApiClient.getTeam.mockRejectedValue(new Error('API Error'))
    const result = await service.getProductsForTeam('team-slug')
    expect(result).toEqual([])
  })
})

describe('TeamsSummaryCountService.getComponentsForProducts', () => {
  let service: TeamsSummaryCountService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService(mockAlertsService, () => mockStrapiClient)
  })

  it('should fetch components for multiple products', async () => {
    strapiApiClient.getProduct.mockImplementation((params: ProductParams) => {
      if (params.productSlug === 'product-1') {
        return Promise.resolve(mockProductResponse1)
      }
      if (params.productSlug === 'product-2') {
        return Promise.resolve(mockProductResponse2)
      }
      return Promise.reject(new Error('Unknown product'))
    })

    const result = await service.getComponentsForProducts(mockProductList)

    expect(strapiApiClient.getProduct).toHaveBeenCalledTimes(2)
    expect(strapiApiClient.getProduct).toHaveBeenCalledWith({ productSlug: 'product-1' } as ProductParams)
    expect(strapiApiClient.getProduct).toHaveBeenCalledWith({ productSlug: 'product-2' } as ProductParams)

    expect(result).toEqual(mockProductComponentMapResponse)
  })

  it('should handle object response format', async () => {
    strapiApiClient.getProduct.mockResolvedValue(mockProductResponse2)
    const result = await service.getComponentsForProducts(mockOneProduct)
    expect(result).toEqual(mockProductSingleComponentMapResponse)
  })

  it('should handle API errors for individual products', async () => {
    strapiApiClient.getProduct.mockImplementation(({ productSlug }) => {
      if (productSlug === 'product-2') {
        return Promise.resolve(mockProductResponse2)
      }
      return Promise.reject(new Error('API Error'))
    })

    const result = await service.getComponentsForProducts(mockProductList)
    expect(result).toEqual({
      'Product 1': [],
      'Product 2': mockComponents2,
    })
  })

  it('should handle empty components array', async () => {
    strapiApiClient.getProduct.mockResolvedValue(mockProductResponseEmpty)
    const result = await service.getComponentsForProducts(mockEmptyProducts)
    expect(result).toEqual({
      'Empty Product': [],
    })
  })

  it('should orchestrate data flow correctly to build product->component->alert mapping', async () => {
    const teamSlug = 'team-alpha'
    mockStrapiClient.getTeam.mockResolvedValue(mockTeamResponseWithTwoProducts)

    mockStrapiClient.getProduct.mockImplementation((params: ProductParams) => {
      if (params.productSlug === 'product-a') {
        return Promise.resolve(mockProductResponseWithComponents)
      }
      return Promise.resolve(mockProductResponseWithComponents2)
    })

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getTeamAlertSummary(teamSlug)

    expect(mockStrapiClient.getTeam).toHaveBeenCalledWith({ teamSlug })
    expect(mockStrapiClient.getProduct).toHaveBeenCalledTimes(2)
    expect(mockAlertsService.getAlerts).toHaveBeenCalled()

    expect(result).toEqual(mockTeamAlertSummary)
  })

  it('should handle empty product list', async () => {
    mockStrapiClient.getTeam.mockResolvedValue(mockTeamResponseWithoutProducts)
    mockAlertsService.getAlerts.mockResolvedValue([])
    const result = await service.getTeamAlertSummary('empty-team')
    expect(result).toEqual({ products: {}, total: 0 })
  })

  it('should handle products with no components', async () => {
    mockStrapiClient.getTeam.mockResolvedValue(mockTeamResponseWithEmptyProduct)
    mockStrapiClient.getProduct.mockResolvedValue(mockProductResponseWithNoComponents)
    mockAlertsService.getAlerts.mockResolvedValue([])
    const result = await service.getTeamAlertSummary('team-beta')

    expect(result).toEqual({
      products: { 'Empty Product': {} },
      total: 0,
    })
  })

  it('should handle various alert count scenarios', async () => {
    mockStrapiClient.getTeam.mockResolvedValue(mockTeamResponseWithOneProduct)
    mockStrapiClient.getProduct.mockResolvedValue(mockProductResponseWithComponentsAndAlerts)
    mockAlertsService.getAlerts.mockResolvedValue(mockAlertsForProductWithComponentsAndAlerts)

    const result = await service.getTeamAlertSummary('team-gamma')

    expect(result).toEqual(mockTeamAlertSummaryForProductWithComponentsAndAlerts)
  })
})

describe('TeamsSummaryCountService.getFiringAlertCountsForComponents', () => {
  let service: TeamsSummaryCountService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService(mockAlertsService, () => mockStrapiClient)
    mockAlertsService.getAlerts.mockReset()
  })

  it('should count active alerts for matching components', async () => {
    const componentNames = ['component-1', 'component-2', 'component-3']
    mockAlertsService.getAlerts.mockResolvedValue(mockAlertsCount)
    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'component-1': 2,
      'component-2': 1,
      'component-3': 1,
    })
  })

  it('should handle component names with no active alerts', async () => {
    const componentNames = ['no-alerts-component', 'component-with-alert']
    mockAlertsService.getAlerts.mockResolvedValue(mockActiveAndInactiveAlerts)
    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'no-alerts-component': 0,
      'component-with-alert': 1,
    })
  })

  it('should handle component names not present in any alert', async () => {
    const componentNames = ['unknown-component-1', 'unknown-component-2']
    const mockAlertsWithMissingComponent = [
      { status: { state: 'active' }, labels: { component: 'some-other-component' } },
    ]
    mockAlertsService.getAlerts.mockResolvedValue(mockAlertsWithMissingComponent)
    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'unknown-component-1': 0,
      'unknown-component-2': 0,
    })
  })

  it('should handle alerts with missing labels or status', async () => {
    const componentNames = ['component-1', 'component-2']
    const mockAlertsWithMissingLabelsOrStatus = [
      { status: { state: 'active' }, labels: { component: 'component-1' } },
      { status: {}, labels: { component: 'component-1' } },
      { status: { state: 'active' } },
      { labels: { component: 'component-2' } },
      {},
    ]
    mockAlertsService.getAlerts.mockResolvedValue(mockAlertsWithMissingLabelsOrStatus)
    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'component-1': 1,
      'component-2': 0,
    })
  })

  it('should handle empty alerts array', async () => {
    const componentNames = ['component-1', 'component-2']
    mockAlertsService.getAlerts.mockResolvedValue([])
    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'component-1': 0,
      'component-2': 0,
    })
  })

  it('should handle errors from alerts service', async () => {
    const componentNames = ['component-1', 'component-2']
    mockAlertsService.getAlerts.mockRejectedValue(new Error('Failed to fetch alerts'))
    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({})

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[getFiringAlertCountsForComponents] Error:'),
      expect.any(Error),
    )
  })
})

/**
 * getTeamTrivyVulnerabilityCounts tests
 */
describe('TeamsSummaryCountService.getTeamTrivyVulnerabilityCounts', () => {
  let service: TeamsSummaryCountService
  let mockServiceCatalogueService: Partial<ServiceCatalogueService> & {
    getTrivyScans: jest.Mock
    getComponents: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService(mockAlertsService, () => mockStrapiClient)
    mockServiceCatalogueService = {
      getTrivyScans: jest.fn(),
      getComponents: jest.fn(),
    }
  })

  it('should count CRITICAL and HIGH vulns for matching components', async () => {
    mockServiceCatalogueService.getTrivyScans!.mockResolvedValue(mockTrivyScans)
    mockServiceCatalogueService.getComponents!.mockResolvedValue(mockComponents)
    const result = await service.getTeamTrivyVulnerabilityCounts(
      mockProducts,
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ critical: 2, high: 4 })
  })

  it('should return 0,0 if products is empty', async () => {
    const result = await service.getTeamTrivyVulnerabilityCounts(
      [],
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ critical: 0, high: 0 })
  })

  it('should return 0,0 if no matching components', async () => {
    mockServiceCatalogueService.getTrivyScans!.mockResolvedValue([
      {
        name: 'NonMatchingComponent',
        scan_summary: { scan_result: { 'os-pkgs': [{ Severity: 'CRITICAL' }], 'lang-pkgs': [] } },
      },
    ])
    mockServiceCatalogueService.getComponents!.mockResolvedValue([
      { attributes: { name: 'ComponentX', product: { data: { id: 99 } } } },
    ])
    const products = [{ id: 1, attributes: { name: 'Product 1' } }]
    const result = await service.getTeamTrivyVulnerabilityCounts(
      products,
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ critical: 0, high: 0 })
  })

  it('should log error and return 0,0 on exception', async () => {
    mockServiceCatalogueService.getTrivyScans!.mockRejectedValue(new Error('fail'))
    const products = [{ id: 1, attributes: { name: 'Product 1' } }]
    const result = await service.getTeamTrivyVulnerabilityCounts(
      products,
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ critical: 0, high: 0 })
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in getTeamTrivyVulnerabilityCounts'),
      expect.any(Error),
    )
  })
})

describe('TeamsSummaryCountService.getTeamVeracodeVulnerabilityCounts', () => {
  let service: TeamsSummaryCountService
  let mockServiceCatalogueService: Partial<ServiceCatalogueService> & {
    getComponents: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService(mockAlertsService, () => mockStrapiClient)
    mockServiceCatalogueService = {
      getComponents: jest.fn(),
    }
  })

  it('should aggregate severities from matching components', async () => {
    mockServiceCatalogueService.getComponents!.mockResolvedValue(mockVeracodeComponents)
    const result = await service.getTeamVeracodeVulnerabilityCounts(
      [
        { id: 1, attributes: { name: 'Product 1' } },
        { id: 2, attributes: { name: 'Product 2' } },
      ],
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ veryHigh: 2, high: 4, medium: 5, low: 9 })
  })

  it('should return all zeros if products is empty', async () => {
    const result = await service.getTeamVeracodeVulnerabilityCounts(
      [],
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ veryHigh: 0, high: 0, medium: 0, low: 0 })
  })

  it('should return all zeros if no matching components', async () => {
    mockServiceCatalogueService.getComponents!.mockResolvedValue([
      {
        attributes: {
          name: 'OtherComponent',
          product: { data: { id: 99 } },
          veracode_results_summary: { severity: [{ category: [{ severity: 'VERY_HIGH', count: 10 }] }] },
        },
      },
    ])
    const result = await service.getTeamVeracodeVulnerabilityCounts(
      [{ id: 1, attributes: { name: 'Product 1' } }],
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ veryHigh: 0, high: 0, medium: 0, low: 0 })
  })

  it('should ignore components with missing or empty severity', async () => {
    mockServiceCatalogueService.getComponents!.mockResolvedValue([
      { attributes: { name: 'CompNoSummary', product: { data: { id: 1 } } } },
      {
        attributes: {
          name: 'CompEmptySeverity',
          product: { data: { id: 1 } },
          veracode_results_summary: { severity: [] },
        },
      },
    ])
    const result = await service.getTeamVeracodeVulnerabilityCounts(
      [{ id: 1, attributes: { name: 'Product 1' } }],
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ veryHigh: 0, high: 0, medium: 0, low: 0 })
  })

  it('should log error and return all zeros on exception', async () => {
    mockServiceCatalogueService.getComponents!.mockRejectedValue(new Error('fail'))
    const result = await service.getTeamVeracodeVulnerabilityCounts(
      [{ id: 1, attributes: { name: 'Product 1' } }],
      mockServiceCatalogueService as unknown as ServiceCatalogueService,
    )
    expect(result).toEqual({ veryHigh: 0, high: 0, medium: 0, low: 0 })
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in getTeamVeracodeVulnerabilityCounts'),
      expect.any(Error),
    )
  })
})
