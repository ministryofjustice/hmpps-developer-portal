import { createModelServiceArea } from '../data/converters/serviceArea.test'
import StrapiApiClient from '../data/strapiApiClient'
import {
  ListResponse,
  Component,
  Team,
  Product,
  CustomComponentView,
  GithubRepoRequest,
  SingleResponse,
  StrapiServiceArea,
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
    } as ListResponse<Component>

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
    } as ListResponse<Team>

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
    } as SingleResponse<Team>

    it('should return deployed components sorted for the selected team', async () => {
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)
      strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

      const results = await componentNameService.getAllDeployedComponentsForTeam('testteam')

      expect(strapiApiClient.getTeam).toHaveBeenCalledWith({ teamId: 2, withEnvironments: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('Service area', () => {
    const serviceAreasResponse = [createModelServiceArea(2, 'service-area-1')]

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
    } as SingleResponse<StrapiServiceArea>

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
    } as unknown as ListResponse<Product>

    it('should return deployed components sorted for the selected product', async () => {
      strapiApiClient.getProducts.mockResolvedValue(productsResponse)

      const results = await componentNameService.getAllDeployedComponentsForProduct('product-1')

      expect(strapiApiClient.getProducts).toHaveBeenCalledWith({ withEnvironments: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('Custom Components', () => {
    const customComponentsResponse = {
      data: [
        {
          id: 2,
          attributes: {
            name: 'custom-component-1',
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
    } as unknown as ListResponse<CustomComponentView>

    it('should return deployed components sorted for the selected custom component', async () => {
      strapiApiClient.getCustomComponentViews.mockResolvedValue(customComponentsResponse)

      const results = await componentNameService.getAllDeployedComponentsForCustomComponents('custom-component-1')

      expect(strapiApiClient.getCustomComponentViews).toHaveBeenCalledWith({ withEnvironments: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('checkComponentExists()', () => {
    const testComponentsResponse = {
      data: [
        { attributes: { name: 'comp-3', environments: [{ name: 'prod' }] } },
        { attributes: { name: 'comp-1', environments: [{ name: 'env' }] } },
        { attributes: { name: 'comp-2' } },
      ],
    } as ListResponse<Component>

    it('should return true if component exists', async () => {
      strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.checkComponentExists('comp-3')

      expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
      expect(results).toBe(true)
    })

    it('should return false if component does not exist', async () => {
      strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.checkComponentExists('comp-4')

      expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
      expect(results).toBe(false)
    })
  })

  describe('checkComponentRequestExists()', () => {
    const testComponentsResponse = {
      data: [
        { attributes: { github_repo: 'comp-3' } },
        { attributes: { github_repo: 'comp-1' } },
        { attributes: { github_repo: 'comp-2' } },
      ],
    } as ListResponse<GithubRepoRequest>

    it('should return true if component exists', async () => {
      strapiApiClient.getGithubRepoRequests.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.checkComponentRequestExists('comp-3')

      expect(strapiApiClient.getGithubRepoRequests).toHaveBeenCalledTimes(1)
      expect(results).toBe(true)
    })

    it('should return false if component does not exist', async () => {
      strapiApiClient.getGithubRepoRequests.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.checkComponentRequestExists('comp-4')

      expect(strapiApiClient.getGithubRepoRequests).toHaveBeenCalledTimes(1)
      expect(results).toBe(false)
    })
  })
})
