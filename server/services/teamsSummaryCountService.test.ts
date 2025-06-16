import TeamsSummaryCountService from './teamsSummaryCountService'
import AlertsService from './alertsService'
import logger from '../../logger'
import { StrapiApiClient } from '../data'
import {
  TeamResponse,
  ProductResponse,
  ComponentListResponseDataItem,
  ProductListResponseDataItem,
} from '../data/strapiApiTypes'

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
    service = new TeamsSummaryCountService(mockAlertsService, mockStrapiClient)
  })

  it('should return products from array response', async () => {
    const mockProducts = [
      { id: 1, attributes: { name: 'Product 1', p_id: 'p1' } },
      { id: 2, attributes: { name: 'Product 2', p_id: 'p2' } },
    ]

    strapiApiClient.getTeam.mockResolvedValue({
      data: [
        {
          id: 1,
          attributes: {
            name: 'Team Name',
            t_id: 'team-id',
            products: {
              data: mockProducts,
            },
            createdAt: '2023-01-01T00:00:00Z',
            createdBy: { data: { attributes: {}, id: 1 } },
            updatedAt: '2023-01-01T00:00:00Z',
            updatedBy: { data: { attributes: {}, id: 1 } },
          },
        },
      ],
    } as TeamResponse)

    const result = await service.getProductsForTeam('team-slug')

    expect(strapiApiClient.getTeam).toHaveBeenCalledWith({ teamSlug: 'team-slug' })
    expect(result).toEqual(mockProducts)
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Found 2 products for team team-slug'))
  })

  it('should return products from object response', async () => {
    const mockProducts = [{ id: 1, attributes: { name: 'Product 1', p_id: 'p1' } }]

    strapiApiClient.getTeam.mockResolvedValue({
      data: {
        attributes: {
          name: 'Team Name',
          t_id: 'team-id',
          products: {
            data: mockProducts,
          },
          createdAt: '2023-01-01T00:00:00Z',
          createdBy: { data: { attributes: {}, id: 1 } },
          updatedAt: '2023-01-01T00:00:00Z',
          updatedBy: { data: { attributes: {}, id: 1 } },
        },
      },
    } as TeamResponse)

    const result = await service.getProductsForTeam('team-slug')

    expect(result).toEqual(mockProducts)
  })

  it('should return empty array when no products found', async () => {
    strapiApiClient.getTeam.mockResolvedValue({
      data: [
        {
          id: 1,
          attributes: {
            name: 'Team Name',
            t_id: 'team-id',
            products: {
              data: [],
            },
            createdAt: '2023-01-01T00:00:00Z',
            createdBy: { data: { attributes: {}, id: 1 } },
            updatedAt: '2023-01-01T00:00:00Z',
            updatedBy: { data: { attributes: {}, id: 1 } },
          },
        },
      ],
    } as TeamResponse)

    const result = await service.getProductsForTeam('team-slug')

    expect(result).toEqual([])
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Found 0 products for team team-slug'))
  })

  it('should return empty array on error', async () => {
    strapiApiClient.getTeam.mockRejectedValue(new Error('API Error'))

    const result = await service.getProductsForTeam('team-slug')

    expect(result).toEqual([])
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching products for team team-slug'),
      expect.any(Error),
    )
  })
})

describe('TeamsSummaryCountService.getComponentsForProducts', () => {
  let service: TeamsSummaryCountService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService(mockAlertsService, mockStrapiClient)
  })

  it('should fetch components for multiple products', async () => {
    const mockProducts = [
      { attributes: { name: 'Product 1', slug: 'product-1', p_id: 'p1' } },
      { attributes: { name: 'Product 2', slug: 'product-2', p_id: 'p2' } },
    ] as ProductListResponseDataItem[]

    const mockComponents1: ComponentListResponseDataItem[] = [
      { id: 1, attributes: { name: 'Comp1A' } },
      { id: 2, attributes: { name: 'Comp1B' } },
    ]

    const mockComponents2: ComponentListResponseDataItem[] = [{ id: 3, attributes: { name: 'Comp2A' } }]

    strapiApiClient.getProduct.mockImplementation((params: ProductParams) => {
      if (params.productSlug === 'product-1') {
        return Promise.resolve({
          data: [{ attributes: { components: { data: mockComponents1 } } }],
        } as unknown as ProductResponse)
      }
      if (params.productSlug === 'product-2') {
        return Promise.resolve({
          data: [{ attributes: { components: { data: mockComponents2 } } }],
        } as unknown as ProductResponse)
      }
      return Promise.reject(new Error('Unknown product'))
    })

    const result = await service.getComponentsForProducts(mockProducts)

    expect(strapiApiClient.getProduct).toHaveBeenCalledTimes(2)
    expect(strapiApiClient.getProduct).toHaveBeenCalledWith({ productSlug: 'product-1' } as ProductParams)
    expect(strapiApiClient.getProduct).toHaveBeenCalledWith({ productSlug: 'product-2' } as ProductParams)

    expect(result).toEqual({
      'Product 1': mockComponents1,
      'Product 2': mockComponents2,
    })
  })

  it('should handle object response format', async () => {
    const mockProducts = [{ attributes: { name: 'Product 3', slug: 'product-3', p_id: 'p3' } }]

    const mockComponents = [{ id: 4, attributes: { name: 'Comp3A' } }]

    strapiApiClient.getProduct.mockResolvedValue({
      data: { attributes: { components: { data: mockComponents } } },
    } as unknown as ProductResponse)

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

    strapiApiClient.getProduct.mockImplementation(({ productSlug }) => {
      if (productSlug === 'good-product') {
        return Promise.resolve({
          data: [{ attributes: { components: { data: mockComponents1 } } }],
        } as unknown as ProductResponse)
      }
      return Promise.reject(new Error('API Error'))
    })

    const result = await service.getComponentsForProducts(mockProducts)

    expect(result).toEqual({
      'Good Product': mockComponents1,
      'Bad Product': [],
    })

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('[getComponentsForProducts] Error fetching components for product Bad Product'),
      expect.any(Error),
    )
  })

  it('should handle empty components array', async () => {
    const mockProducts = [{ attributes: { name: 'Empty Product', slug: 'empty-product', p_id: 'empty1' } }]

    strapiApiClient.getProduct.mockResolvedValue({
      data: [{ attributes: { components: { data: [] } } }],
    } as unknown as ProductResponse)

    const result = await service.getComponentsForProducts(mockProducts)

    expect(result).toEqual({
      'Empty Product': [],
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 0 components for product Empty Product'),
    )
  })

  it('should orchestrate data flow correctly to build product->component->alert mapping', async () => {
    const teamSlug = 'team-alpha'

    const mockProducts = [
      { id: 1, attributes: { name: 'Product A', slug: 'product-a', p_id: 'pa' } },
      { id: 2, attributes: { name: 'Product B', slug: 'product-b', p_id: 'pb' } },
    ]

    mockStrapiClient.getTeam.mockResolvedValue({
      data: [
        {
          id: 1,
          attributes: {
            t_id: 'team-alpha-id',
            name: 'Team Alpha',
            products: { data: mockProducts },
            createdAt: '2023-01-01T00:00:00Z',
            createdBy: { data: { attributes: {}, id: 1 } },
            updatedAt: '2023-01-01T00:00:00Z',
            updatedBy: { data: { attributes: {}, id: 1 } },
          },
        },
      ],
    } as unknown as TeamResponse)

    mockStrapiClient.getProduct.mockImplementation((params: ProductParams) => {
      if (params.productSlug === 'product-a') {
        return Promise.resolve({
          data: {
            id: 1,
            attributes: {
              name: 'Product A',
              slug: 'product-a',
              p_id: 'pa',
              components: {
                data: [
                  { id: 1, attributes: { name: 'ComponentA1' } },
                  { id: 2, attributes: { name: 'ComponentA2' } },
                ],
              },
            },
          },
        } as unknown as ProductResponse)
      }
      return Promise.resolve({
        data: {
          id: 2,
          attributes: {
            name: 'Product B',
            slug: 'product-b',
            p_id: 'pb',
            components: { data: [{ id: 3, attributes: { name: 'ComponentB1' } }] },
          },
        },
      } as unknown as ProductResponse)
    })

    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'ComponentA1' } },
      { status: { state: 'active' }, labels: { component: 'ComponentA1' } },
      { status: { state: 'active' }, labels: { component: 'ComponentA1' } },
      { status: { state: 'active' }, labels: { component: 'ComponentB1' } },
      { status: { state: 'active' }, labels: { component: 'ComponentB1' } },
    ]
    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getTeamAlertSummary(teamSlug)

    expect(mockStrapiClient.getTeam).toHaveBeenCalledWith({ teamSlug })
    expect(mockStrapiClient.getProduct).toHaveBeenCalledTimes(2)
    expect(mockAlertsService.getAlerts).toHaveBeenCalled()

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
    mockStrapiClient.getTeam.mockResolvedValue({
      data: [
        {
          attributes: {
            t_id: 'team-beta-id',
            name: 'Team Beta',
            products: { data: [] },
            createdAt: '2023-01-01T00:00:00Z',
            createdBy: { data: { attributes: {}, id: 1 } },
            updatedAt: '2023-01-01T00:00:00Z',
            updatedBy: { data: { attributes: {}, id: 1 } },
          },
        },
      ],
    } as unknown as TeamResponse)

    mockAlertsService.getAlerts.mockResolvedValue([])

    const result = await service.getTeamAlertSummary('empty-team')

    expect(result).toEqual({})
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Total components found: 0'))
  })

  it('should handle products with no components', async () => {
    const mockProducts = [{ attributes: { name: 'Empty Product', slug: 'empty', p_id: 'empty1' } }]

    mockStrapiClient.getTeam.mockResolvedValue({
      data: [
        {
          attributes: {
            t_id: 'team-gamma-id',
            name: 'Team Gamma',
            products: { data: mockProducts },
            createdAt: '2023-01-01T00:00:00Z',
            createdBy: { data: { attributes: {}, id: 1 } },
            updatedAt: '2023-01-01T00:00:00Z',
            updatedBy: { data: { attributes: {}, id: 1 } },
          },
        },
      ],
    } as unknown as TeamResponse)

    mockStrapiClient.getProduct.mockResolvedValue({
      data: { attributes: { name: 'Test Product', p_id: 'test-prod-id', components: { data: [] } } },
    } as unknown as ProductResponse)

    mockAlertsService.getAlerts.mockResolvedValue([])

    const result = await service.getTeamAlertSummary('team-beta')

    expect(result).toEqual({
      'Empty Product': {},
    })
  })

  it('should handle various alert count scenarios', async () => {
    const mockProducts = [{ attributes: { name: 'Product X', slug: 'product-x', p_id: 'px' } }]

    mockStrapiClient.getTeam.mockResolvedValue({
      data: [
        {
          attributes: {
            t_id: 'team-gamma-id',
            name: 'Team Gamma',
            products: { data: mockProducts },
            createdAt: '2023-01-01T00:00:00Z',
            createdBy: { data: { attributes: {}, id: 1 } },
            updatedAt: '2023-01-01T00:00:00Z',
            updatedBy: { data: { attributes: {}, id: 1 } },
          },
        },
      ],
    } as unknown as TeamResponse)

    mockStrapiClient.getProduct.mockResolvedValue({
      data: {
        attributes: {
          name: 'Test Product',
          p_id: 'test-prod-id',
          components: {
            data: [
              { attributes: { name: 'CompWithAlerts' } },
              { attributes: { name: 'CompWithNoAlerts' } },
              { attributes: { name: 'CompMissingFromAlertMap' } },
            ],
          },
        },
      },
    } as unknown as ProductResponse)

    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
      { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
      { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
      { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
      { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
      { status: { state: 'inactive' }, labels: { component: 'CompWithNoAlerts' } },
    ]
    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getTeamAlertSummary('team-gamma')

    expect(result).toEqual({
      'Product X': {
        CompWithAlerts: 5,
        CompWithNoAlerts: 0,
        CompMissingFromAlertMap: 0,
      },
    })
  })
})

describe('TeamsSummaryCountService.getFiringAlertCountsForComponents', () => {
  let service: TeamsSummaryCountService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TeamsSummaryCountService(mockAlertsService, mockStrapiClient)
    mockAlertsService.getAlerts.mockReset()
  })

  it('should count active alerts for matching components', async () => {
    const componentNames = ['component-1', 'component-2', 'component-3']

    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'component-1' } },
      { status: { state: 'active' }, labels: { component: 'component-1' } },
      { status: { state: 'active' }, labels: { application: 'component-2' } },
      { status: { state: 'inactive' }, labels: { component: 'component-1' } },
      { status: { state: 'active' }, labels: { component: 'other-component' } },
      { status: { state: 'active' }, labels: { component: 'component-3' } },
    ]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'component-1': 2,
      'component-2': 1,
      'component-3': 1,
    })

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Total alerts fetched: ${mockAlerts.length}`))
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Component component-1: 2 firing alerts'))
  })

  it('should handle component names with no active alerts', async () => {
    const componentNames = ['no-alerts-component', 'component-with-alert']

    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'component-with-alert' } },
      { status: { state: 'inactive' }, labels: { component: 'no-alerts-component' } },
    ]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'no-alerts-component': 0,
      'component-with-alert': 1,
    })
  })

  it('should handle component names not present in any alert', async () => {
    const componentNames = ['unknown-component-1', 'unknown-component-2']

    const mockAlerts = [{ status: { state: 'active' }, labels: { component: 'some-other-component' } }]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

    const result = await service.getFiringAlertCountsForComponents(componentNames)

    expect(result).toEqual({
      'unknown-component-1': 0,
      'unknown-component-2': 0,
    })
  })

  it('should handle alerts with missing labels or status', async () => {
    const componentNames = ['component-1', 'component-2']

    const mockAlerts = [
      { status: { state: 'active' }, labels: { component: 'component-1' } },
      { status: {}, labels: { component: 'component-1' } },
      { status: { state: 'active' } },
      { labels: { component: 'component-2' } },
      {},
    ]

    mockAlertsService.getAlerts.mockResolvedValue(mockAlerts)

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

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Total alerts fetched: 0'))
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
