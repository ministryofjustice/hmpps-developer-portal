import { TrivyScanType } from '../data/converters/modelTypes'
import { Component, Product, Team, Unwrapped } from '../data/strapiApiTypes'

export const mockProducts = [
  { id: 1, name: 'Product 1', p_id: 'p1' },
  { id: 2, name: 'Product 2', p_id: 'p2' },
] as Unwrapped<Product>[]

export const mockOneProduct = [{ id: 3, name: 'Product 3', slug: 'product-3', p_id: 'p3' }] as Unwrapped<Product>[]

export const mockTwoProduct = [
  { id: 1, name: 'Product A', slug: 'product-a', p_id: 'pa' },
  { id: 2, name: 'Product B', slug: 'product-b', p_id: 'pb' },
] as Unwrapped<Product>[]

export const mockEmptyProducts = [
  { name: 'Empty Product', slug: 'empty-product', p_id: 'empty1' },
] as Unwrapped<Product>[]

export const mockProductList = [
  { name: 'Product 1', slug: 'product-1', p_id: 'p1' },
  { name: 'Product 2', slug: 'product-2', p_id: 'p2' },
] as Unwrapped<Product>[]

export const mockComponents1 = [
  { id: 1, name: 'Comp1A' },
  { id: 2, name: 'Comp1B' },
] as Unwrapped<Component>[]

export const mockComponents2 = [{ id: 3, name: 'Comp2A' }] as Unwrapped<Component>[]

export const mockProductResponse1 = { components: mockComponents1 } as Unwrapped<Product>

export const mockProductResponse2 = { components: mockComponents2 } as Unwrapped<Product>

export const mockProductResponseEmpty = { components: [] } as Unwrapped<Product>

export const mockTeamResponseWithProducts = {
  id: 1,
  name: 'Team Name',
  t_id: 'team-id',
  products: mockProducts,
} as Unwrapped<Team>

export const mockTeamResponseWithoutProducts = {
  id: 1,
  name: 'Team Name',
  t_id: 'team-id',
  products: [] as Unwrapped<Product>[],
  createdAt: '2023-01-01T00:00:00Z',
  createdBy: { id: 1 },
  updatedAt: '2023-01-01T00:00:00Z',
  updatedBy: { id: 1 },
} as Unwrapped<Team>

export const mockTeamResponseWithTwoProducts = {
  id: 1,
  t_id: 'team-alpha-id',
  name: 'Team Alpha',
  products: mockTwoProduct,
  createdAt: '2023-01-01T00:00:00Z',
  createdBy: { id: 1 },
  updatedAt: '2023-01-01T00:00:00Z',
  updatedBy: { id: 1 },
} as Unwrapped<Team>

export const mockTeamResponseWithOneProduct = {
  id: 1,
  t_id: 'team-gamma-id',
  name: 'Team Gamma',
  products: mockOneProduct,
  createdAt: '2023-01-01T00:00:00Z',
  createdBy: { id: 1 },
  updatedAt: '2023-01-01T00:00:00Z',
  updatedBy: { id: 1 },
} as Unwrapped<Team>

export const mockProductResponseWithComponents = {
  id: 1,
  name: 'Product A',
  slug: 'product-a',
  p_id: 'pa',
  components: [
    { id: 1, name: 'ComponentA1' },
    { id: 2, name: 'ComponentA2' },
  ],
} as Unwrapped<Product>

export const mockTeamResponseWithEmptyProduct = {
  id: 1,
  t_id: 'team-gamma-id',
  name: 'Team Gamma',
  products: mockEmptyProducts,
  createdAt: '2023-01-01T00:00:00Z',
  createdBy: { id: 1 },
  updatedAt: '2023-01-01T00:00:00Z',
  updatedBy: { id: 1 },
} as Unwrapped<Team>

export const mockProductResponseWithComponents2 = {
  id: 2,
  name: 'Product B',
  slug: 'product-b',
  p_id: 'pb',
  components: [{ id: 3, name: 'ComponentB1' }],
} as Unwrapped<Product>

export const mockProductResponseWithNoComponents = {
  name: 'Test Product',
  p_id: 'test-prod-id',
  components: [],
} as Unwrapped<Product>

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
  name: 'Test Product',
  p_id: 'test-prod-id',
  components: [{ name: 'CompWithAlerts' }, { name: 'CompWithNoAlerts' }, { name: 'CompMissingFromAlertMap' }],
} as Unwrapped<Product>

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
] as Unwrapped<Component>[]

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
] as Unwrapped<Component>[]

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
] as TrivyScanType[]
