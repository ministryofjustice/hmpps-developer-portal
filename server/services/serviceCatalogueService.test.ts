import StrapiApiClient from '../data/strapiApiClient'
import {
  Component,
  ComponentResponse,
  ComponentListResponse,
  ComponentListResponseDataItem,
  Product,
  ProductResponse,
  ProductListResponse,
  ProductListResponseDataItem,
  ProductSet,
  ProductSetResponse,
  ProductSetListResponse,
  ProductSetListResponseDataItem,
  ServiceArea,
  ServiceAreaResponse,
  ServiceAreaListResponse,
  ServiceAreaListResponseDataItem,
  Team,
  TeamResponse,
  TeamListResponse,
  TeamListResponseDataItem,
} from '../data/strapiApiTypes'
import ServiceCatalogueService from './serviceCatalogueService'

jest.mock('../data/strapiApiClient')

describe('Strapi service', () => {
  const strapiApiClient = new StrapiApiClient() as jest.Mocked<StrapiApiClient>

  let serviceCatalogueService: ServiceCatalogueService

  const StrapiApiClientFactory = jest.fn()

  beforeEach(() => {
    StrapiApiClientFactory.mockReturnValue(strapiApiClient)
    serviceCatalogueService = new ServiceCatalogueService(StrapiApiClientFactory)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Products', () => {
    describe('getProducts', () => {
      const testProductsResponse = {
        data: [
          {
            id: 1,
            attributes: { name: 'Product 1', p_id: '1' },
          },
          {
            id: 2,
            attributes: { name: 'Product 2', p_id: '2' },
          },
        ],
      } as ProductListResponse
      const testProducts = [
        {
          id: 1,
          attributes: { name: 'Product 1', p_id: '1' },
        },
        {
          id: 2,
          attributes: { name: 'Product 2', p_id: '2' },
        },
      ] as ProductListResponseDataItem[]

      it('should return an ordered array of products', async () => {
        strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

        const results = await serviceCatalogueService.getProducts({})

        expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProducts)
      })
    })

    describe('getProduct', () => {
      const testProductResponse = {
        data: {
          id: 1,
          attributes: { name: 'Product 1', p_id: '1' },
        },
      } as ProductResponse
      const testProduct = { name: 'Product 1', p_id: '1' } as Product

      it('should return the selected product', async () => {
        strapiApiClient.getProduct.mockResolvedValue(testProductResponse)

        const results = await serviceCatalogueService.getProduct({ productId: 1 })

        expect(strapiApiClient.getProduct).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProduct)
      })
    })
  })

  describe('Teams', () => {
    describe('getTeams', () => {
      const testTeamsResponse = {
        data: [
          {
            id: 1,
            attributes: { name: 'Team 1' },
          },
          {
            id: 2,
            attributes: { name: 'Team 2' },
          },
        ],
      } as TeamListResponse
      const testTeams = [
        {
          id: 1,
          attributes: { name: 'Team 1' },
        },
        {
          id: 2,
          attributes: { name: 'Team 2' },
        },
      ] as TeamListResponseDataItem[]

      it('should return an ordered array of teams', async () => {
        strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

        const results = await serviceCatalogueService.getTeams()

        expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeams)
      })
    })

    describe('getTeam', () => {
      const testTeamResponse = {
        data: {
          id: 1,
          attributes: { name: 'Team 1' },
        },
      } as TeamResponse
      const testTeam = { name: 'Team 1' } as Team

      it('should return the selected team', async () => {
        strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

        const results = await serviceCatalogueService.getTeam({ teamId: 1 })

        expect(strapiApiClient.getTeam).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeam)
      })
    })
  })

  describe('Components', () => {
    describe('getComponents', () => {
      const testComponentsResponse = {
        data: [
          {
            id: 1,
            attributes: { name: 'Component 1' },
          },
          {
            id: 2,
            attributes: { name: 'Component 2' },
          },
        ],
      } as ComponentListResponse
      const testComponents = [
        { id: 1, attributes: { name: 'Component 1' } },
        { id: 2, attributes: { name: 'Component 2' } },
      ] as ComponentListResponseDataItem[]

      it('should return an ordered array of components', async () => {
        strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

        const results = await serviceCatalogueService.getComponents()

        expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testComponents)
      })
    })

    describe('getComponent', () => {
      const testComponentResponse = {
        data: [
          {
            id: 1,
            attributes: { name: 'Component 1' },
          },
        ],
      } as ComponentResponse
      const testComponent = { name: 'Component 1' } as Component

      it('should return the selected component', async () => {
        strapiApiClient.getComponent.mockResolvedValue(testComponentResponse)

        const results = await serviceCatalogueService.getComponent({ componentName: '1' })

        expect(strapiApiClient.getComponent).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testComponent)
      })
    })

    describe('getDependencies', () => {
      const testComponentsResponse = {
        data: [
          {
            id: 1,
            attributes: {
              name: 'Component 1',
              versions: {
                helm: {
                  'generic-service': '2.6.5',
                  'generic-prometheus-alerts': '1.3.2',
                },
                circleci: {
                  hmpps: '7',
                },
                dockerfile: {
                  base_image: 'node:18.18-bullseye-slim',
                },
              },
            },
          },
          {
            id: 2,
            attributes: {
              name: 'Component 2',
            },
          },
        ],
      } as ComponentListResponse
      const dependencies = [
        'circleci::hmpps',
        'dockerfile::base_image',
        'helm::generic-prometheus-alerts',
        'helm::generic-service',
      ]

      it('should return an ordered array of dependency type::name', async () => {
        strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

        const results = await serviceCatalogueService.getDependencies()

        expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(dependencies)
      })
    })
  })

  describe('Service Areas', () => {
    describe('getServiceAreas', () => {
      const testServiceAreasResponse = {
        data: [
          {
            id: 1,
            attributes: { name: 'Service Area 1' },
          },
          {
            id: 2,
            attributes: { name: 'Service Area 2' },
          },
        ],
      } as ServiceAreaListResponse
      const testServiceAreas = [
        { id: 1, attributes: { name: 'Service Area 1' } },
        { id: 2, attributes: { name: 'Service Area 2' } },
      ] as ServiceAreaListResponseDataItem[]

      it('should return an ordered array of product sets', async () => {
        strapiApiClient.getServiceAreas.mockResolvedValue(testServiceAreasResponse)

        const results = await serviceCatalogueService.getServiceAreas()

        expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testServiceAreas)
      })
    })

    describe('getServiceArea', () => {
      const testServiceAreaResponse = {
        data: {
          id: 1,
          attributes: { name: 'Service Area 1' },
        },
      } as ServiceAreaResponse
      const testServiceArea = { name: 'Service Area 1' } as ServiceArea

      it('should return the selected service area', async () => {
        strapiApiClient.getServiceArea.mockResolvedValue(testServiceAreaResponse)

        const results = await serviceCatalogueService.getServiceArea({ serviceAreaId: 1 })

        expect(strapiApiClient.getServiceArea).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testServiceArea)
      })
    })
  })

  describe('Product Sets', () => {
    describe('getProductSets', () => {
      const testProductSetsResponse = {
        data: [
          {
            id: 1,
            attributes: { name: 'Product Set 1' },
          },
          {
            id: 2,
            attributes: { name: 'Product Set 2' },
          },
        ],
      } as ProductSetListResponse
      const testProductSets = [
        { id: 1, attributes: { name: 'Product Set 1' } },
        { id: 2, attributes: { name: 'Product Set 2' } },
      ] as ProductSetListResponseDataItem[]

      it('should return an ordered array of product sets', async () => {
        strapiApiClient.getProductSets.mockResolvedValue(testProductSetsResponse)

        const results = await serviceCatalogueService.getProductSets()

        expect(strapiApiClient.getProductSets).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductSets)
      })
    })

    describe('getProductSet', () => {
      const testProductSetResponse = {
        data: {
          id: 1,
          attributes: { name: 'Product Set 1' },
        },
      } as ProductSetResponse
      const testProductSet = { name: 'Product Set 1' } as ProductSet

      it('should return the selected product set', async () => {
        strapiApiClient.getProductSet.mockResolvedValue(testProductSetResponse)

        const results = await serviceCatalogueService.getProductSet({ productSetId: 1 })

        expect(strapiApiClient.getProductSet).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductSet)
      })
    })
  })
})
