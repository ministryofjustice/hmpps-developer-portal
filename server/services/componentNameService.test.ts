import StrapiApiClient from '../data/strapiApiClient'
import {
  ComponentListResponse,
  TeamResponse,
  TeamListResponse,
  ServiceAreaListResponse,
  ServiceAreaResponse,
  ProductListResponse,
} from '../data/strapiApiTypes'
import ComponentNameService from './componentNameService'

jest.mock('../data/strapiApiClient')

describe('Component name service', () => {
  const strapiApiClient = new StrapiApiClient() as jest.Mocked<StrapiApiClient>

  let componentNameService: ComponentNameService

  const StrapiApiClientFactory = jest.fn()

  beforeEach(() => {
    StrapiApiClientFactory.mockReturnValue(strapiApiClient)
    componentNameService = new ComponentNameService(StrapiApiClientFactory)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('All components', () => {
    const testComponentsResponse = {
      data: [
        { attributes: { name: 'comp-3', environments: [{ name: 'prod' }] } },
        { attributes: { name: 'comp-1', environments: [{ name: 'env' }] } },
        { attributes: { name: 'comp-2' } },
      ],
    } as ComponentListResponse

    it('should return all deployed components sorted', async () => {
      strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.getAllDeployedComponents()

      expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('Teams', () => {
    const testTeamsResponse = {
      data: [
        {
          id: 2,
          attributes: { name: 'testteam' },
        },
      ],
    } as TeamListResponse

    const testTeamResponse = {
      data: {
        id: 1,
        attributes: {
          name: 'testteam',
          products: {
            data: [
              {
                attributes: {
                  components: {
                    data: [
                      { attributes: { name: 'comp-3', environments: [{ name: 'prod' }] } },
                      { attributes: { name: 'comp-1', environments: [{ name: 'env' }] } },
                      { attributes: { name: 'comp-2' } },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    } as TeamResponse

    it('should return deployed components sorted for the selected team', async () => {
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)
      strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

      const results = await componentNameService.getAllDeployedComponentsForTeam('testteam')

      expect(strapiApiClient.getTeam).toHaveBeenCalledWith({ teamId: 2, withEnvironments: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('Service area', () => {
    const serviceAreasResponse = {
      data: [
        {
          id: 2,
          attributes: { name: 'service-area-1' },
        },
      ],
    } as ServiceAreaListResponse

    const serviceAreaResponse = {
      data: {
        id: 2,
        attributes: {
          name: 'service-area-1',
          products: {
            data: [
              {
                attributes: {
                  components: {
                    data: [
                      { attributes: { name: 'comp-3', environments: [{ name: 'prod' }] } },
                      { attributes: { name: 'comp-1', environments: [{ name: 'env' }] } },
                      { attributes: { name: 'comp-2' } },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    } as ServiceAreaResponse

    it('should return deployed components sorted for the selected service area', async () => {
      strapiApiClient.getServiceAreas.mockResolvedValue(serviceAreasResponse)
      strapiApiClient.getServiceArea.mockResolvedValue(serviceAreaResponse)

      const results = await componentNameService.getAllDeployedComponentsForServiceArea('service-area-1')

      expect(strapiApiClient.getServiceArea).toHaveBeenCalledWith({ serviceAreaId: 2, withProducts: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('Products', () => {
    const productsResponse = {
      data: [
        {
          id: 2,
          attributes: {
            name: 'product-1',
            components: {
              data: [
                { attributes: { name: 'comp-3', environments: [{ name: 'prod' }] } },
                { attributes: { name: 'comp-1', environments: [{ name: 'env' }] } },
                { attributes: { name: 'comp-2' } },
              ],
            },
          },
        },
      ],
    } as unknown as ProductListResponse

    it('should return deployed components sorted for the selected product', async () => {
      strapiApiClient.getProducts.mockResolvedValue(productsResponse)

      const results = await componentNameService.getAllDeployedComponentsForProduct('product-1')

      expect(strapiApiClient.getProducts).toHaveBeenCalledWith({ withEnvironments: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })
})
