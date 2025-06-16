// Mock dependencies
// Import the class under test
import TeamsSummaryCountService from './teamsSummaryCountService'

// Mock the problematic imports
jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

const mockGetTeam = jest.fn()
const mockGetProduct = jest.fn()
const mockLogger = jest.requireMock('../../logger')

jest.mock('../data', () => ({
  StrapiApiClient: jest.fn().mockImplementation(() => ({
    getTeam: mockGetTeam,
    getProduct: mockGetProduct,
  })),
}))

describe('TeamsSummaryCountService.getProductsForTeam', () => {
  let service: InstanceType<typeof TeamsSummaryCountService>

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService()
  })

  it('should return products from array response', async () => {
    // Mock the API response - array format
    const mockProducts = [
      { id: 1, attributes: { name: 'Product 1' } },
      { id: 2, attributes: { name: 'Product 2' } },
    ]

    mockGetTeam.mockResolvedValue({
      data: [
        {
          attributes: {
            products: {
              data: mockProducts,
            },
          },
        },
      ],
    })

    const result = await service.getProductsForTeam('team-slug')

    expect(mockGetTeam).toHaveBeenCalledWith({ teamSlug: 'team-slug' })
    expect(result).toEqual(mockProducts)
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Found 2 products for team team-slug'))
  })

  it('should return products from object response', async () => {
    // Mock the API response - object format
    const mockProducts = [{ id: 1, attributes: { name: 'Product 1' } }]

    mockGetTeam.mockResolvedValue({
      data: {
        attributes: {
          products: {
            data: mockProducts,
          },
        },
      },
    })

    const result = await service.getProductsForTeam('team-slug')

    expect(result).toEqual(mockProducts)
  })

  it('should return empty array when no products found', async () => {
    // Mock response with no products
    mockGetTeam.mockResolvedValue({
      data: [
        {
          attributes: {
            products: { data: [] },
          },
        },
      ],
    })

    const result = await service.getProductsForTeam('team-slug')

    expect(result).toEqual([])
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Found 0 products for team team-slug'))
  })

  it('should return empty array on error', async () => {
    // Mock API error
    mockGetTeam.mockRejectedValue(new Error('API Error'))

    const result = await service.getProductsForTeam('team-slug')

    expect(result).toEqual([])
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching products for team team-slug'),
      expect.any(Error),
    )
  })
})

describe('TeamsSummaryCountService.getComponentsForProducts', () => {
  let service: InstanceType<typeof TeamsSummaryCountService>

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService()
  })

  it('should fetch components for multiple products', async () => {
    const mockProducts = [
      { attributes: { name: 'Product 1', slug: 'product-1', p_id: 'p1' } },
      { attributes: { name: 'Product 2', slug: 'product-2', p_id: 'p2' } },
    ]

    const mockComponents1 = [
      { id: 1, attributes: { name: 'Comp1A' } },
      { id: 2, attributes: { name: 'Comp1B' } },
    ]

    const mockComponents2 = [{ id: 3, attributes: { name: 'Comp2A' } }]

    // Mock responses for each product
    mockGetProduct.mockImplementation(({ productSlug }) => {
      if (productSlug === 'product-1') {
        return Promise.resolve({
          data: [{ attributes: { components: { data: mockComponents1 } } }],
        })
      }
      if (productSlug === 'product-2') {
        return Promise.resolve({
          data: [{ attributes: { components: { data: mockComponents2 } } }],
        })
      }
      return Promise.reject(new Error('Unknown product'))
    })

    const result = await service.getComponentsForProducts(mockProducts)

    expect(mockGetProduct).toHaveBeenCalledTimes(2)
    expect(mockGetProduct).toHaveBeenCalledWith({ productSlug: 'product-1' })
    expect(mockGetProduct).toHaveBeenCalledWith({ productSlug: 'product-2' })

    expect(result).toEqual({
      'Product 1': mockComponents1,
      'Product 2': mockComponents2,
    })
  })

  it('should handle object response format', async () => {
    const mockProducts = [{ attributes: { name: 'Product 3', slug: 'product-3', p_id: 'p3' } }]

    const mockComponents = [{ id: 4, attributes: { name: 'Comp3A' } }]

    mockGetProduct.mockResolvedValue({
      data: { attributes: { components: { data: mockComponents } } },
    })

    const result = await service.getComponentsForProducts(mockProducts)

    expect(result).toEqual({
      'Product 3': mockComponents,
    })
  })

  it('should handle API errors for individual products', async () => {
    const mockProducts = [
      { attributes: { name: 'Good Product', slug: 'good-product', p_id: 'good1' } },
      { attributes: { name: 'Bad Product', slug: 'bad-product', p_id: 'bad1' } },
    ]

    const mockComponents1 = [{ id: 1, attributes: { name: 'Comp1' } }]

    // First product succeeds, second fails
    mockGetProduct.mockImplementation(({ productSlug }) => {
      if (productSlug === 'good-product') {
        return Promise.resolve({
          data: [{ attributes: { components: { data: mockComponents1 } } }],
        })
      }
      return Promise.reject(new Error('API Error'))
    })

    const result = await service.getComponentsForProducts(mockProducts)

    expect(result).toEqual({
      'Good Product': mockComponents1,
      'Bad Product': [], // Empty array for failed product
    })

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching components for product Bad Product'),
      expect.any(Error),
    )
  })

  it('should handle empty components array', async () => {
    const mockProducts = [{ attributes: { name: 'Empty Product', slug: 'empty-product', p_id: 'empty1' } }]

    mockGetProduct.mockResolvedValue({
      data: [{ attributes: { components: { data: [] } } }],
    })

    const result = await service.getComponentsForProducts(mockProducts)

    expect(result).toEqual({
      'Empty Product': [],
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 0 components for product Empty Product'),
    )
  })
})

describe('TeamsSummaryCountService.getTeamAlertSummary', () => {
  let service: InstanceType<typeof TeamsSummaryCountService>
  let mockAlertsService: { getAlerts: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService()
    mockAlertsService = { getAlerts: jest.fn() }

    // Instead of testing the actual implementation of these methods again,
    // we'll spy on them and provide controlled outputs
    jest.spyOn(service, 'getProductsForTeam').mockImplementation()
    jest.spyOn(service, 'getComponentsForProducts').mockImplementation()
    jest.spyOn(service, 'getFiringAlertCountsForComponents').mockImplementation()
  })

  it('should orchestrate data flow correctly to build product->component->alert mapping', async () => {
    const teamSlug = 'team-alpha'

    // Mock products returned by getProductsForTeam
    const mockProducts = [
      { attributes: { name: 'Product A', slug: 'product-a', p_id: 'pa' } },
      { attributes: { name: 'Product B', slug: 'product-b', p_id: 'pb' } },
    ]
    ;(service.getProductsForTeam as jest.Mock).mockResolvedValue(mockProducts)

    // Mock components returned by getComponentsForProducts
    const mockProductComponentMap = {
      'Product A': [{ attributes: { name: 'ComponentA1' } }, { attributes: { name: 'ComponentA2' } }],
      'Product B': [{ attributes: { name: 'ComponentB1' } }],
    }
    ;(service.getComponentsForProducts as jest.Mock).mockResolvedValue(mockProductComponentMap)

    // Mock alert counts returned by getFiringAlertCountsForComponents
    const mockAlertCounts = {
      ComponentA1: 3,
      ComponentA2: 0,
      ComponentB1: 2,
    }
    ;(service.getFiringAlertCountsForComponents as jest.Mock).mockResolvedValue(mockAlertCounts)

    // Execute the method under test
    const result = await service.getTeamAlertSummary(teamSlug, mockAlertsService)

    // Verify method calls
    expect(service.getProductsForTeam).toHaveBeenCalledWith(teamSlug)
    expect(service.getComponentsForProducts).toHaveBeenCalledWith(mockProducts)
    expect(service.getFiringAlertCountsForComponents).toHaveBeenCalledWith(
      ['ComponentA1', 'ComponentA2', 'ComponentB1'],
      mockAlertsService,
    )

    // Verify final structure
    expect(result).toEqual({
      'Product A': {
        ComponentA1: 3,
        ComponentA2: 0,
      },
      'Product B': {
        ComponentB1: 2,
      },
    })

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Start for team team-alpha'))
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Total components found: 3'))
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Done for team team-alpha'))
  })

  it('should handle empty product list', async () => {
    ;(service.getProductsForTeam as jest.Mock).mockResolvedValue([])
    ;(service.getComponentsForProducts as jest.Mock).mockResolvedValue({})
    ;(service.getFiringAlertCountsForComponents as jest.Mock).mockResolvedValue({})

    const result = await service.getTeamAlertSummary('empty-team', mockAlertsService)

    expect(result).toEqual({})
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Total components found: 0'))
  })

  it('should handle products with no components', async () => {
    const mockProducts = [{ attributes: { name: 'Empty Product', slug: 'empty', p_id: 'empty1' } }]
    ;(service.getProductsForTeam as jest.Mock).mockResolvedValue(mockProducts)

    // Use explicit type for the empty array to avoid TypeScript error
    const mockProductComponentMap: Record<string, Array<{ attributes: { name: string } }>> = {
      'Empty Product': [], // No components
    }
    ;(service.getComponentsForProducts as jest.Mock).mockResolvedValue(mockProductComponentMap)
    ;(service.getFiringAlertCountsForComponents as jest.Mock).mockResolvedValue({})

    const result = await service.getTeamAlertSummary('team-beta', mockAlertsService)

    expect(result).toEqual({
      'Empty Product': {}, // Empty component mapping
    })
  })

  it('should handle various alert count scenarios', async () => {
    // Setup a scenario where some components have alerts, some don't, and some are missing from alert counts
    const mockProducts = [{ attributes: { name: 'Product X', slug: 'product-x', p_id: 'px' } }]
    ;(service.getProductsForTeam as jest.Mock).mockResolvedValue(mockProducts)

    const mockProductComponentMap = {
      'Product X': [
        { attributes: { name: 'WithAlerts' } },
        { attributes: { name: 'NoAlerts' } },
        { attributes: { name: 'MissingFromCounts' } },
      ],
    }
    ;(service.getComponentsForProducts as jest.Mock).mockResolvedValue(mockProductComponentMap)

    const mockAlertCounts = {
      WithAlerts: 5,
      NoAlerts: 0,
      // MissingFromCounts intentionally omitted
    }
    ;(service.getFiringAlertCountsForComponents as jest.Mock).mockResolvedValue(mockAlertCounts)

    const result = await service.getTeamAlertSummary('team-gamma', mockAlertsService)

    expect(result).toEqual({
      'Product X': {
        WithAlerts: 5,
        NoAlerts: 0,
        MissingFromCounts: 0, // Should default to 0
      },
    })
  })
})
describe('TeamsSummaryCountService.getFiringAlertCountsForComponents', () => {
  let service: InstanceType<typeof TeamsSummaryCountService>
  let mockAlertsService: { getAlerts: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService()
    mockAlertsService = { getAlerts: jest.fn() }
  })

  it('should count active alerts for matching components', async () => {
    const componentNames = ['component-1', 'component-2', 'component-3']

    // Mock alerts with different states and labels
    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'component-1' } },
      { status: { state: 'active' }, labels: { component: 'component-1' } }, // Second alert for component-1
      { status: { state: 'active' }, labels: { application: 'component-2' } }, // Using application label
      { status: { state: 'inactive' }, labels: { component: 'component-1' } }, // Inactive, should be ignored
      { status: { state: 'active' }, labels: { component: 'other-component' } }, // Not in our components list
      { status: { state: 'active' }, labels: { component: 'component-3' } },
    ]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getFiringAlertCountsForComponents(componentNames, mockAlertsService)

    expect(result).toEqual({
      'component-1': 2, // Two active alerts
      'component-2': 1, // One active alert using application label
      'component-3': 1, // One active alert
    })

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Total alerts fetched: ${mockAlerts.length}`))
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Component component-1: 2 firing alerts'))
  })

  it('should handle component names with no active alerts', async () => {
    const componentNames = ['no-alerts-component', 'component-with-alert']

    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'component-with-alert' } },
      { status: { state: 'inactive' }, labels: { component: 'no-alerts-component' } }, // Inactive
    ]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getFiringAlertCountsForComponents(componentNames, mockAlertsService)

    expect(result).toEqual({
      'no-alerts-component': 0, // No active alerts
      'component-with-alert': 1, // One active alert
    })
  })

  it('should handle component names not present in any alert', async () => {
    const componentNames = ['unknown-component-1', 'unknown-component-2']

    const mockAlerts = [{ status: { state: 'active' }, labels: { component: 'some-other-component' } }]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getFiringAlertCountsForComponents(componentNames, mockAlertsService)

    expect(result).toEqual({
      'unknown-component-1': 0,
      'unknown-component-2': 0,
    })
  })

  it('should handle alerts with missing labels or status', async () => {
    const componentNames = ['component-1', 'component-2']

    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'component-1' } }, // Normal alert
      { status: {}, labels: { component: 'component-1' } }, // Missing state
      { status: { state: 'active' } }, // Missing labels
      { labels: { component: 'component-2' } }, // Missing status
      {}, // Completely empty alert
    ]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getFiringAlertCountsForComponents(componentNames, mockAlertsService)

    expect(result).toEqual({
      'component-1': 1, // Only one valid active alert
      'component-2': 0, // No valid active alerts
    })
  })

  it('should handle empty alerts array', async () => {
    const componentNames = ['component-1', 'component-2']

    mockAlertsService.getAlerts.mockResolvedValue([])

    const result = await service.getFiringAlertCountsForComponents(componentNames, mockAlertsService)

    expect(result).toEqual({
      'component-1': 0,
      'component-2': 0,
    })

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Total alerts fetched: 0'))
  })

  it('should handle errors from alerts service', async () => {
    const componentNames = ['component-1', 'component-2']

    mockAlertsService.getAlerts.mockRejectedValue(new Error('Failed to fetch alerts'))

    const result = await service.getFiringAlertCountsForComponents(componentNames, mockAlertsService)

    expect(result).toEqual({}) // Empty object on error

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[getFiringAlertCountsForComponents] Error:'),
      expect.any(Error),
    )
  })
})
