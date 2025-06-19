import {
  ComponentListResponseDataItem,
  ProductListResponseDataItem,
  ProductResponse,
  TeamResponse,
} from '../data/strapiApiTypes'

export const mockProducts = [
  { id: 1, attributes: { name: 'Product 1', p_id: 'p1' } },
  { id: 2, attributes: { name: 'Product 2', p_id: 'p2' } },
]

export const mockOneProduct = [{ id: 3, attributes: { name: 'Product 3', slug: 'product-3', p_id: 'p3' } }]

export const mockTwoProduct = [
  { id: 1, attributes: { name: 'Product A', slug: 'product-a', p_id: 'pa' } },
  { id: 2, attributes: { name: 'Product B', slug: 'product-b', p_id: 'pb' } },
]

export const mockEmptyProduct = [{ attributes: { name: 'Empty Product', slug: 'empty-product', p_id: 'empty1' } }]

export const mockProductList = [
  { attributes: { name: 'Product 1', slug: 'product-1', p_id: 'p1' } },
  { attributes: { name: 'Product 2', slug: 'product-2', p_id: 'p2' } },
] as ProductListResponseDataItem[]

export const mockComponents1: ComponentListResponseDataItem[] = [
  { id: 1, attributes: { name: 'Comp1A' } },
  { id: 2, attributes: { name: 'Comp1B' } },
]

export const mockComponents2: ComponentListResponseDataItem[] = [{ id: 3, attributes: { name: 'Comp2A' } }]

export const mockProductResponse1 = {
  data: [{ attributes: { components: { data: mockComponents1 } } }],
} as unknown as ProductResponse

export const mockProductResponse2 = {
  data: [{ attributes: { components: { data: mockComponents2 } } }],
} as unknown as ProductResponse

export const mockProductResponseEmpty = {
  data: [{ attributes: { components: { data: [] } } }],
} as unknown as ProductResponse

export const mockTeamResponseWithProducts = {
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
} as TeamResponse

export const mockTeamResponseWithoutProducts = {
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
} as TeamResponse

export const mockTeamResponseWithTwoProducts = {
  data: [
    {
      id: 1,
      attributes: {
        t_id: 'team-alpha-id',
        name: 'Team Alpha',
        products: { data: mockTwoProduct },
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: { data: { attributes: {}, id: 1 } },
        updatedAt: '2023-01-01T00:00:00Z',
        updatedBy: { data: { attributes: {}, id: 1 } },
      },
    },
  ],
} as TeamResponse

export const mockTeamResponseWithOneProduct = {
  data: [
    {
      attributes: {
        t_id: 'team-gamma-id',
        name: 'Team Gamma',
        products: { data: mockOneProduct },
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: { data: { attributes: {}, id: 1 } },
        updatedAt: '2023-01-01T00:00:00Z',
        updatedBy: { data: { attributes: {}, id: 1 } },
      },
    },
  ],
} as unknown as TeamResponse

export const mockProductResponseWithComponents = {
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
} as unknown as ProductResponse

export const mockTeamResponseWithEmptyProduct = {
  data: [
    {
      attributes: {
        t_id: 'team-gamma-id',
        name: 'Team Gamma',
        products: { data: mockEmptyProduct },
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: { data: { attributes: {}, id: 1 } },
        updatedAt: '2023-01-01T00:00:00Z',
        updatedBy: { data: { attributes: {}, id: 1 } },
      },
    },
  ],
} as unknown as TeamResponse

export const mockProductResponseWithComponents2 = {
  data: {
    id: 2,
    attributes: {
      name: 'Product B',
      slug: 'product-b',
      p_id: 'pb',
      components: { data: [{ id: 3, attributes: { name: 'ComponentB1' } }] },
    },
  },
} as unknown as ProductResponse

export const mockProductResponseWithNoComponents = {
  data: { attributes: { name: 'Test Product', p_id: 'test-prod-id', components: { data: [] } } },
} as unknown as ProductResponse

export const mockTeamAlertSummary = {
  products: {
    'Product A': {
      ComponentA1: 3,
      ComponentA2: 0,
    },
    'Product B': {
      ComponentB1: 2,
    },
  },
  total: 5,
}

export const mockProductComponentMapResponse = {
  'Product 1': mockComponents1,
  'Product 2': mockComponents2,
}

export const mockProductSingleComponentMapResponse = {
  'Product 3': mockComponents2,
}

export const mockAlerts = [
  { status: { state: 'active' }, labels: { component: 'ComponentA1' } },
  { status: { state: 'active' }, labels: { component: 'ComponentA1' } },
  { status: { state: 'active' }, labels: { component: 'ComponentA1' } },
  { status: { state: 'active' }, labels: { component: 'ComponentB1' } },
  { status: { state: 'active' }, labels: { component: 'ComponentB1' } },
]

export const mockProductResponseWithComponentsAndAlerts = {
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
} as unknown as ProductResponse

export const mockAlertsForProductWithComponentsAndAlerts = [
  { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
  { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
  { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
  { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
  { status: { state: 'active' }, labels: { component: 'CompWithAlerts' } },
  { status: { state: 'inactive' }, labels: { component: 'CompWithNoAlerts' } },
]

export const mockTeamAlertSummaryForProductWithComponentsAndAlerts = {
  products: {
    'Product 3': {
      CompWithAlerts: 5,
      CompWithNoAlerts: 0,
      CompMissingFromAlertMap: 0,
    },
  },
  total: 5,
}
