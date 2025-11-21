import { Component, CustomComponentView, GithubRepoRequest, Product, ServiceArea, Team } from '../data/modelTypes'
import StrapiApiClient from '../data/strapiApiClient'
import ComponentNameService from './componentNameService'

jest.mock('../data/strapiApiClient')

const serviceAreasResponse = [
  {
    documentId: 'documentid1',
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
      } as Product,
    ],
  },
] as ServiceArea[]

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
    ] as Component[]

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
        documentId: 'documentid3',
        name: 'testteam',
      },
    ] as Team[]

    const testTeamResponse = {
      id: 1,
      name: 'testteam',
      products: [
        {
          documentId: 'documentid9',
          components: [
            { documentId: 'documentid3', name: 'comp-3', envs: [{ name: 'prod' }] },
            { documentId: 'documentid1', name: 'comp-1', envs: [{ name: 'env' }] },
            { documentId: 'documentid3', name: 'comp-2' },
          ],
        },
      ],
    } as Team

    it('should return deployed components sorted for the selected team', async () => {
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)
      strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

      const results = await componentNameService.getAllDeployedComponentsForTeam('testteam')

      expect(strapiApiClient.getTeam).toHaveBeenCalledWith({ teamDocumentId: 'documentid3', withEnvironments: true })
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
            { documentId: 'documentid3', name: 'comp-3', envs: [{ name: 'prod' }] },
            { documentId: 'documentid1', name: 'comp-1', envs: [{ name: 'env' }] },
            { documentId: 'documentid3', name: 'comp-2' },
          ],
        },
      ],
    } as ServiceArea

    it('should return deployed components sorted for the selected service area', async () => {
      strapiApiClient.getServiceAreas.mockResolvedValue(serviceAreasResponse)
      strapiApiClient.getServiceArea.mockResolvedValue(serviceAreaResponse)

      const results = await componentNameService.getAllDeployedComponentsForServiceArea('service-area-1')

      expect(strapiApiClient.getServiceArea).toHaveBeenCalledWith({
        serviceAreaDocumentId: 'documentid1',
        withProducts: true,
      })
      expect(results).toStrictEqual(['comp-3', 'comp-1'])
    })
  })

  describe('Products', () => {
    const productsResponse = [
      {
        documentId: 'documentid8',
        name: 'product-1',
        components: [
          { documentId: 'documentid3', name: 'comp-3', envs: [{ name: 'prod' }] },
          { documentId: 'documentid1', name: 'comp-1', envs: [{ name: 'env' }] },
          { documentId: 'documentid2', name: 'comp-2' },
        ],
      },
    ] as Product[]

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
        documentId: 'documentid8',
        name: 'custom-component-1',
        components: [
          { documentId: 'documentid3', name: 'comp-3', envs: [{ documentId: 'documentid7', name: 'prod' }] },
          { documentId: 'documentid1', name: 'comp-1', envs: [{ documentId: 'documentid9', name: 'env' }] },
          { documentId: 'documentid3', name: 'comp-2' },
        ],
      },
    ] as CustomComponentView[]

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
    ] as Component[]

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
      { github_repo: 'comp-3', request_type: 'Add' },
      { github_repo: 'comp-1', request_type: 'Archive' },
      { github_repo: 'comp-2', request_type: 'Add' },
    ] as GithubRepoRequest[]

    it('should return true if component exists', async () => {
      strapiApiClient.getGithubRepoRequests.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.checkComponentRequestExists('comp-3', 'Add')

      expect(strapiApiClient.getGithubRepoRequests).toHaveBeenCalledTimes(1)
      expect(results).toBe(true)
    })

    it('should return false if component does not exist', async () => {
      strapiApiClient.getGithubRepoRequests.mockResolvedValue(testComponentsResponse)

      const results = await componentNameService.checkComponentRequestExists('comp-4', 'Add')

      expect(strapiApiClient.getGithubRepoRequests).toHaveBeenCalledTimes(1)
      expect(results).toBe(false)
    })
  })
})
