import StrapiApiClient from '../data/strapiApiClient'
import {
  Component,
  Team,
  Product,
  CustomComponentView,
  GithubRepoRequest,
  ServiceArea,
  Unwrapped,
} from '../data/strapiApiTypes'
import ComponentNameService from './componentNameService'

jest.mock('../data/strapiApiClient')

const serviceAreasResponse = [
  {
    id: 2,
    name: 'service-area-1',
    owner: 'The Owner',
    sa_id: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        name: 'A Product name',
        phase: 'Private Beta',
        product_manager: 'Product Manager',
        slug: 'a-product-name-1',
      } as Unwrapped<Product>,
    ],
  },
] as Unwrapped<ServiceArea>[]

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
    const testComponentsResponse = [
      { name: 'comp-3', envs: [{ name: 'prod' }] },
      { name: 'comp-1', envs: [{ name: 'env' }] },
      { name: 'comp-2' },
    ] as Unwrapped<Component>[]

    it('should return all deployed components sorted', async () => {
      strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.getAllDeployedComponents()

      expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('Teams', () => {
    const testTeamsResponse = [
      {
        id: 2,
        name: 'testteam',
      },
    ] as Unwrapped<Team>[]

    const testTeamResponse = {
      id: 1,
      name: 'testteam',
      products: [
        {
          id: 2,
          components: [
            { id: 1, name: 'comp-3', envs: [{ name: 'prod' }] },
            { id: 2, name: 'comp-1', envs: [{ name: 'env' }] },
            { id: 3, name: 'comp-2' },
          ],
        },
      ],
    } as Unwrapped<Team>

    it('should return deployed components sorted for the selected team', async () => {
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)
      strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

      const results = await componentNameService.getAllDeployedComponentsForTeam('testteam')

      expect(strapiApiClient.getTeam).toHaveBeenCalledWith({ teamId: 2, withEnvironments: true })
      expect(results).toEqual(['comp-3', 'comp-1'])
    })
  })

  describe('Service area', () => {
    const serviceAreaResponse = {
      id: 2,
      name: 'service-area-1',
      products: [
        {
          components: [
            { id: 1, name: 'comp-3', envs: [{ name: 'prod' }] },
            { id: 2, name: 'comp-1', envs: [{ name: 'env' }] },
            { id: 3, name: 'comp-2' },
          ],
        },
      ],
    } as Unwrapped<ServiceArea>

    it('should return deployed components sorted for the selected service area', async () => {
      strapiApiClient.getServiceAreas.mockResolvedValue(serviceAreasResponse)
      strapiApiClient.getServiceArea.mockResolvedValue(serviceAreaResponse)

      const results = await componentNameService.getAllDeployedComponentsForServiceArea('service-area-1')

      expect(strapiApiClient.getServiceArea).toHaveBeenCalledWith({ serviceAreaId: 2, withProducts: true })
      expect(results).toStrictEqual(['comp-3', 'comp-1'])
    })
  })

  describe('Products', () => {
    const productsResponse = [
      {
        id: 2,
        name: 'product-1',
        components: [
          { id: 1, name: 'comp-3', envs: [{ name: 'prod' }] },
          { id: 2, name: 'comp-1', envs: [{ name: 'env' }] },
          { id: 3, name: 'comp-2' },
        ],
      },
    ] as Unwrapped<Product>[]

    it('should return deployed components sorted for the selected product', async () => {
      strapiApiClient.getProducts.mockResolvedValue(productsResponse)

      const results = await componentNameService.getAllDeployedComponentsForProduct('product-1')

      expect(strapiApiClient.getProducts).toHaveBeenCalledWith({ withEnvironments: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('Custom Components', () => {
    const customComponentsResponse = [
      {
        id: 2,
        name: 'custom-component-1',
        components: [
          { id: 1, name: 'comp-3', envs: [{ id: 9, name: 'prod' }] },
          { id: 2, name: 'comp-1', envs: [{ id: 10, name: 'env' }] },
          { id: 3, name: 'comp-2' },
        ],
      },
    ] as Unwrapped<CustomComponentView>[]

    it('should return deployed components sorted for the selected custom component', async () => {
      strapiApiClient.getCustomComponentViews.mockResolvedValue(customComponentsResponse)

      const results = await componentNameService.getAllDeployedComponentsForCustomComponents('custom-component-1')

      expect(strapiApiClient.getCustomComponentViews).toHaveBeenCalledWith({ withEnvironments: true })
      expect(results).toStrictEqual(['comp-1', 'comp-3'])
    })
  })

  describe('checkComponentExists()', () => {
    const testComponentsResponse = [
      { name: 'comp-3', envs: [{ name: 'prod' }] },
      { name: 'comp-1', envs: [{ name: 'env' }] },
      { name: 'comp-2' },
    ] as Unwrapped<Component>[]

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
    const testComponentsResponse = [
      { github_repo: 'comp-3' },
      { github_repo: 'comp-1' },
      { github_repo: 'comp-2' },
    ] as Unwrapped<GithubRepoRequest>[]

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
