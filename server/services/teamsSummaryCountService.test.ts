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
  mockEmptyProduct,
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
} from './teamsSummaryCountService.test-helpers'

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
    const result = await service.getComponentsForProducts(mockEmptyProduct)
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

    const mockAlertsCount = [
      { status: { state: 'active' }, labels: { component: 'component-1' } },
      { status: { state: 'active' }, labels: { component: 'component-1' } },
      { status: { state: 'active' }, labels: { application: 'component-2' } },
      { status: { state: 'inactive' }, labels: { component: 'component-1' } },
      { status: { state: 'active' }, labels: { component: 'other-component' } },
      { status: { state: 'active' }, labels: { component: 'component-3' } },
    ]

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

    const mockActiveAndInactiveAlerts = [
      { status: { state: 'active' }, labels: { component: 'component-with-alert' } },
      { status: { state: 'inactive' }, labels: { component: 'no-alerts-component' } },
    ]

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
