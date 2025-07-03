import { Component, Product, Team, DataItem, SingleResponse } from '../data/strapiApiTypes'

export const mockProducts = [
  { id: 1, attributes: { name: 'Product 1', p_id: 'p1' } },
  { id: 2, attributes: { name: 'Product 2', p_id: 'p2' } },
]

export const mockOneProduct = [
  { id: 3, attributes: { name: 'Product 3', slug: 'product-3', p_id: 'p3' } },
] as DataItem<Product>[]

export const mockTwoProduct = [
  { id: 1, attributes: { name: 'Product A', slug: 'product-a', p_id: 'pa' } },
  { id: 2, attributes: { name: 'Product B', slug: 'product-b', p_id: 'pb' } },
]

export const mockEmptyProducts = [
  { attributes: { name: 'Empty Product', slug: 'empty-product', p_id: 'empty1' } },
] as DataItem<Product>[]

export const mockProductList = [
  { attributes: { name: 'Product 1', slug: 'product-1', p_id: 'p1' } },
  { attributes: { name: 'Product 2', slug: 'product-2', p_id: 'p2' } },
] as DataItem<Product>[]

export const mockComponents1 = [
  { id: 1, attributes: { name: 'Comp1A' } },
  { id: 2, attributes: { name: 'Comp1B' } },
] as DataItem<Component>[]

export const mockComponents2 = [{ id: 3, attributes: { name: 'Comp2A' } }] as DataItem<Component>[]

export const mockProductResponse1 = {
  data: [{ attributes: { components: { data: mockComponents1 } } }],
} as SingleResponse<Product>

export const mockProductResponse2 = {
  data: [{ attributes: { components: { data: mockComponents2 } } }],
} as SingleResponse<Product>

export const mockProductResponseEmpty = {
  data: [{ attributes: { components: { data: [] } } }],
} as SingleResponse<Product>

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
} as SingleResponse<Team>

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
} as SingleResponse<Team>

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
} as SingleResponse<Team>

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
} as SingleResponse<Team>

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
} as SingleResponse<Product>

export const mockTeamResponseWithEmptyProduct = {
  data: [
    {
      attributes: {
        t_id: 'team-gamma-id',
        name: 'Team Gamma',
        products: { data: mockEmptyProducts },
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: { data: { attributes: {}, id: 1 } },
        updatedAt: '2023-01-01T00:00:00Z',
        updatedBy: { data: { attributes: {}, id: 1 } },
      },
    },
  ],
} as SingleResponse<Team>

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
} as SingleResponse<Product>

export const mockProductResponseWithNoComponents = {
  data: { attributes: { name: 'Test Product', p_id: 'test-prod-id', components: { data: [] } } },
} as SingleResponse<Product>

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
} as SingleResponse<Product>

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

export const mockAlertsCount = [
  { status: { state: 'active' }, labels: { component: 'component-1' } },
  { status: { state: 'active' }, labels: { component: 'component-1' } },
  { status: { state: 'active' }, labels: { application: 'component-2' } },
  { status: { state: 'inactive' }, labels: { component: 'component-1' } },
  { status: { state: 'active' }, labels: { component: 'other-component' } },
  { status: { state: 'active' }, labels: { component: 'component-3' } },
]

export const mockActiveAndInactiveAlerts = [
  { status: { state: 'active' }, labels: { component: 'component-with-alert' } },
  { status: { state: 'inactive' }, labels: { component: 'no-alerts-component' } },
]

export const mockComponents = [
  { name: 'ComponentA', product: { id: 1 } },
  { name: 'ComponentB', product: { id: 2 } },
]

// Veracode mock components for getTeamVeracodeVulnerabilityCounts tests
export const mockVeracodeComponents = [
  {
    name: 'ComponentA',
    product: { id: 1 },
    veracode_results_summary: {
      severity: [
        {
          category: [
            { severity: 'VERY_HIGH', count: 2 },
            { severity: 'HIGH', count: 3 },
          ],
        },
        {
          category: [
            { severity: 'MEDIUM', count: 5 },
            { severity: 'LOW', count: 7 },
          ],
        },
      ],
    },
  },
  {
    name: 'ComponentB',
    product: { id: 2 },
    veracode_results_summary: {
      severity: [
        {
          category: [
            { severity: 'HIGH', count: 1 },
            { severity: 'LOW', count: 2 },
          ],
        },
      ],
    },
  },
  // Component with no veracode_results_summary
  {
    name: 'ComponentC',
    product: { id: 1 },
  },
  // Component with empty severity array
  {
    name: 'ComponentD',
    product: { id: 2 },
    veracode_results_summary: {
      severity: [],
    },
  },
  // Component with non-matching product id
  {
    name: 'ComponentE',
    product: { id: 99 },
    veracode_results_summary: {
      severity: [
        {
          category: [{ severity: 'VERY_HIGH', count: 10 }],
        },
      ],
    },
  },
]

export const mockTrivyScans = [
  {
    name: 'ComponentA',
    scan_summary: {
      scan_result: {
        'os-pkgs': [{ Severity: 'CRITICAL' }, { Severity: 'HIGH' }, { Severity: 'LOW' }],
        'lang-pkgs': [{ Severity: 'HIGH' }, { Severity: 'CRITICAL' }],
      },
    },
  },
  {
    name: 'ComponentB',
    scan_summary: {
      scan_result: {
        'os-pkgs': [{ Severity: 'HIGH' }, { Severity: 'HIGH' }],
        'lang-pkgs': [],
      },
    },
  },
  {
    name: 'NonMatchingComponent',
    scan_summary: {
      scan_result: {
        'os-pkgs': [{ Severity: 'CRITICAL' }],
        'lang-pkgs': [],
      },
    },
  },
]
