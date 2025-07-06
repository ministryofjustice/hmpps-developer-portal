import { RdsEntry } from '../@types'
import StrapiApiClient from '../data/strapiApiClient'
import {
  Component,
  Product,
  ProductSet,
  ServiceArea,
  Team,
  Namespace,
  GithubTeam,
  CustomComponentView,
  GithubRepoRequest,
  ListResponse,
  DataItem,
  Environment,
  Unwrapped,
} from '../data/strapiApiTypes'
import ServiceCatalogueService from './serviceCatalogueService'

jest.mock('../data/strapiApiClient')

const serviceAreas = [
  {
    id: 123,
    name: 'service-1',
    owner: 'The Owner',
    serviceAreaId: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        confluenceLink: 'https://atlassian.net/wiki/spaces/SOME/overview',
        deliveryManager: 'Delivery Manager',
        description: 'A description of the project',
        gDriveLink: '',
        id: 456,
        leadDeveloper: 'Lead Developer',
        legacy: false,
        name: 'A Product name',
        phase: 'Private Beta',
        productId: 'DPS000',
        productManager: 'Product Manager',
        slackChannelId: 'C01ABC0ABCD',
        slackChannelName: 'some-slack-channel',
        slug: 'a-product-name-1',
        subproduct: false,
      },
    ],
  },
  {
    id: 234,
    name: 'service-2',
    owner: 'The Owner',
    serviceAreaId: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        confluenceLink: 'https://atlassian.net/wiki/spaces/SOME/overview',
        deliveryManager: 'Delivery Manager',
        description: 'A description of the project',
        gDriveLink: '',
        id: 456,
        leadDeveloper: 'Lead Developer',
        legacy: false,
        name: 'A Product name',
        phase: 'Private Beta',
        productId: 'DPS000',
        productManager: 'Product Manager',
        slackChannelId: 'C01ABC0ABCD',
        slackChannelName: 'some-slack-channel',
        slug: 'a-product-name-1',
        subproduct: false,
      },
    ],
  },
] as unknown as Unwrapped<ServiceArea>[]
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
      const testProductsResponse = [
        {
          id: 1,
          name: 'Product 1',
          p_id: '1',
        },
        {
          id: 2,
          name: 'Product 2',
          p_id: '2',
        },
      ] as Unwrapped<Product>[]
      // const testProducts = [
      //   {
      //     id: 1,
      //     attributes: { name: 'Product 1', p_id: '1' },
      //   },
      //   {
      //     id: 2,
      //     attributes: { name: 'Product 2', p_id: '2' },
      //   },
      // ] as DataItem<Product>[]

      it('should return an ordered array of products', async () => {
        strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

        const results = await serviceCatalogueService.getProducts({})

        expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductsResponse)
      })
    })

    describe('getProduct', () => {
      const testProductResponse = {
        id: 1,
        name: 'Product 1',
        p_id: '1',
        slug: 'product-1',
      } as Unwrapped<Product>
      // const testProduct = { name: 'Product 1', p_id: '1', slug: 'product-1' } as Product

      it('should return the selected product', async () => {
        strapiApiClient.getProduct.mockResolvedValue(testProductResponse)

        const results = await serviceCatalogueService.getProduct({ productSlug: 'product-1' })

        expect(strapiApiClient.getProduct).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductResponse)
      })
    })
  })

  describe('Teams', () => {
    describe('getTeams', () => {
      const testTeamsResponse = [
        {
          id: 1,
          name: 'Team 1',
        },
        {
          id: 2,
          name: 'Team 2',
        },
      ] as Unwrapped<Team>[]

      it('should return an ordered array of teams', async () => {
        strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

        const results = await serviceCatalogueService.getTeams()

        expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeamsResponse)
      })
    })

    describe('getTeam', () => {
      const testTeam = { id: 1, name: 'Team 1', slug: 'team-1' } as Unwrapped<Team>

      it('should return the selected team by ID', async () => {
        const testTeamResponse = {
          id: 1,
          name: 'Team 1',
          slug: 'team-1',
        } as Unwrapped<Team>

        strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

        const results = await serviceCatalogueService.getTeam({ teamId: 1 })

        expect(strapiApiClient.getTeam).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeam)
      })

      it('should return the selected team by slug', async () => {
        const testTeamResponse = {
          id: 1,
          name: 'Team 1',
          slug: 'team-1',
        } as Unwrapped<Team>

        strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

        const results = await serviceCatalogueService.getTeam({ teamSlug: 'team-1' })

        expect(strapiApiClient.getTeam).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeam)
      })
    })
  })

  describe('Components', () => {
    describe('getComponents', () => {
      const testComponentsResponse = [
        {
          id: 1,
          name: 'Component 1',
        },
        {
          id: 2,
          name: 'Component 2',
        },
      ] as Unwrapped<Component>[]
      const testComponents = [
        { id: 1, name: 'Component 1' },
        { id: 2, name: 'Component 2' },
      ] as Unwrapped<Component>[]

      it('should return an ordered array of components', async () => {
        strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

        const results = await serviceCatalogueService.getComponents()

        expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testComponents)
      })
    })

    describe('getComponent', () => {
      const testComponentResponse = {
        id: 1,
        name: 'Component 1',
      } as Unwrapped<Component>

      it('should return the selected component', async () => {
        strapiApiClient.getComponent.mockResolvedValue(testComponentResponse)

        const results = await serviceCatalogueService.getComponent({ componentName: 'Component 1' })

        expect(strapiApiClient.getComponent).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testComponentResponse)
      })
    })

    describe('getDependencies', () => {
      const testComponentsResponse = [
        {
          id: 1,
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
        {
          id: 2,
          name: 'Component 2',
        },
      ] as Unwrapped<Component>[]
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
      it('should return an ordered array of product sets', async () => {
        strapiApiClient.getServiceAreas.mockResolvedValue(serviceAreas)

        const results = await serviceCatalogueService.getServiceAreas()

        expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
        expect(results).toEqual(serviceAreas)
      })
    })

    describe('getServiceArea', () => {
      const testServiceArea = { id: 1, name: 'Service Area 1', slug: 'service-area-1' } as Unwrapped<ServiceArea>

      it('should return the selected service area by ID', async () => {
        const testServiceAreaResponse = {
          id: 1,
          name: 'Service Area 1',
          slug: 'service-area-1',
        } as Unwrapped<ServiceArea>

        strapiApiClient.getServiceArea.mockResolvedValue(testServiceAreaResponse)

        const results = await serviceCatalogueService.getServiceArea({ serviceAreaId: 1 })

        expect(strapiApiClient.getServiceArea).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testServiceArea)
      })

      it('should return the selected service area by slug', async () => {
        const testServiceAreaResponse = {
          id: 1,
          name: 'Service Area 1',
          slug: 'service-area-1',
        } as Unwrapped<ServiceArea>

        strapiApiClient.getServiceArea.mockResolvedValue(testServiceAreaResponse)

        const results = await serviceCatalogueService.getServiceArea({ serviceAreaSlug: 'service-area-1' })

        expect(strapiApiClient.getServiceArea).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testServiceArea)
      })
    })
  })

  describe('Product Sets', () => {
    describe('getProductSets', () => {
      const testProductSetsResponse = [
        {
          id: 1,
          name: 'Product Set 1',
        },
        {
          id: 2,
          name: 'Product Set 2',
        },
      ] as Unwrapped<ProductSet>[]
      const testProductSets = [
        { id: 1, name: 'Product Set 1' },
        { id: 2, name: 'Product Set 2' },
      ] as Unwrapped<ProductSet>[]

      it('should return an ordered array of product sets', async () => {
        strapiApiClient.getProductSets.mockResolvedValue(testProductSetsResponse)

        const results = await serviceCatalogueService.getProductSets()

        expect(strapiApiClient.getProductSets).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductSets)
      })
    })

    describe('getProductSet', () => {
      const testProductSetResponse = {
        id: 1,
        name: 'Product Set 1',
      } as Unwrapped<ProductSet>
      const testProductSet = { id: 1, name: 'Product Set 1' } as Unwrapped<ProductSet>

      it('should return the selected product set', async () => {
        strapiApiClient.getProductSet.mockResolvedValue(testProductSetResponse)

        const results = await serviceCatalogueService.getProductSet({ productSetId: 1 })

        expect(strapiApiClient.getProductSet).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductSet)
      })
    })
  })

  describe('Namespaces', () => {
    describe('getNamespaces', () => {
      const testNamespacesResponse = [{ name: 'Namespace 1' }, { name: 'Namespace 2' }] as Unwrapped<Namespace>[]
      const testNamespaces = [{ name: 'Namespace 1' }, { name: 'Namespace 2' }] as Unwrapped<Namespace>[]

      it('should return an ordered array of namespaces', async () => {
        strapiApiClient.getNamespaces.mockResolvedValue(testNamespacesResponse)

        const results = await serviceCatalogueService.getNamespaces()

        expect(strapiApiClient.getNamespaces).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testNamespaces)
      })
    })

    describe('getNamespace', () => {
      const testNamespaceResponse = { name: 'Namespace 1' } as Unwrapped<Namespace>
      const testNamespace = { name: 'Namespace 1' } as Namespace

      it('should return the selected namespace', async () => {
        strapiApiClient.getNamespace.mockResolvedValue(testNamespaceResponse)

        const results = await serviceCatalogueService.getNamespace({ namespaceId: 1 })

        expect(strapiApiClient.getNamespace).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testNamespace)
      })
    })

    describe('getRdsInstances', () => {
      const testNamespacesResponse = [
        {
          rds_instance: [{ tf_label: 'test 2' }, { tf_label: 'test 1' }],
        },
      ] as Unwrapped<Namespace>[]
      const testRdsInstances = [{ tf_label: 'test 1' }, { tf_label: 'test 2' }] as RdsEntry[]

      it('should return an ordered array of rds instances', async () => {
        strapiApiClient.getNamespaces.mockResolvedValue(testNamespacesResponse)

        const results = await serviceCatalogueService.getRdsInstances()

        expect(strapiApiClient.getNamespaces).toHaveBeenCalledTimes(1)
        expect(results).toStrictEqual(testRdsInstances)
      })
    })
  })

  describe('GithubTeams', () => {
    describe('getGithubTeams', () => {
      const testGithubTeamResponse = [
        {
          team_name: 'Github Team 1',
        },
        {
          team_name: 'Github Team 2',
        },
      ] as Unwrapped<GithubTeam>[]

      it('should return an ordered array of github teams', async () => {
        strapiApiClient.getGithubTeams.mockResolvedValue(testGithubTeamResponse)

        const results = await serviceCatalogueService.getGithubTeams()

        expect(strapiApiClient.getGithubTeams).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testGithubTeamResponse)
      })
    })

    describe('getGithubTeam', () => {
      const testGithubTeamResponse = {
        team_name: 'Github Team 1',
      } as Unwrapped<GithubTeam>
      const testGithubTeam = { team_name: 'Github Team 1' } as GithubTeam

      it('should return the selected github team', async () => {
        strapiApiClient.getGithubTeam.mockResolvedValue(testGithubTeamResponse)

        const results = await serviceCatalogueService.getGithubTeam({ teamName: 'Github Team 1' })

        expect(strapiApiClient.getGithubTeam).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testGithubTeam)
      })
    })
  })

  describe('getCustomComponentView', () => {
    const testCustomComponentResponse = {
      id: 1,
      name: 'custom component 1',
    } as Unwrapped<CustomComponentView>
    const testCustomComponentView = {
      id: 1,
      name: 'custom component 1',
    } as Unwrapped<CustomComponentView>

    it('should return the selected github team', async () => {
      strapiApiClient.getCustomComponentView.mockResolvedValue(testCustomComponentResponse)

      const results = await serviceCatalogueService.getCustomComponentView({ customComponentId: 1 })

      expect(strapiApiClient.getCustomComponentView).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testCustomComponentView)
    })
  })

  describe('Repo Requests', () => {
    describe('getGithubRepoRequests', () => {
      const githubResponses = [
        {
          github_repo: 'github_repo-1',
        },
        {
          github_repo: 'github_repo-2',
        },
      ] as Unwrapped<GithubRepoRequest>[]

      it('should return an ordered array of repo requests', async () => {
        strapiApiClient.getGithubRepoRequests.mockResolvedValue(githubResponses)

        const results = await serviceCatalogueService.getGithubRepoRequests()

        expect(strapiApiClient.getGithubRepoRequests).toHaveBeenCalledTimes(1)
        expect(results).toEqual(githubResponses)
      })
    })

    describe('getGithubRepoRequest', () => {
      const githubRequestResponse = {
        id: 57,
        github_repo: 'github_repo-1',
      } as Unwrapped<GithubRepoRequest> & { id: number }

      it('should return the selected repo request', async () => {
        strapiApiClient.getGithubRepoRequest.mockResolvedValue(githubRequestResponse)

        const results = await serviceCatalogueService.getGithubRepoRequest({ repoName: 'github_repo-1' })

        expect(strapiApiClient.getGithubRepoRequest).toHaveBeenCalledTimes(1)
        expect(results).toEqual(githubRequestResponse)
      })
    })
  })
  describe('Environments', () => {
    describe('getEnvironments', () => {
      const testEnvironmentsResponse = {
        data: [
          { id: 1, attributes: { name: 'Environment 1' } },
          { id: 2, attributes: { name: 'Environment 2' } },
        ],
      } as ListResponse<Environment>
      const testEnvironments = [
        { id: 1, attributes: { name: 'Environment 1' } },
        { id: 2, attributes: { name: 'Environment 2' } },
      ] as DataItem<Environment>[]

      it('should return an ordered array of environments', async () => {
        strapiApiClient.getEnvironments.mockResolvedValue(testEnvironmentsResponse)

        const results = await serviceCatalogueService.getEnvironments()

        expect(strapiApiClient.getEnvironments).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testEnvironments)
      })
    })
  })
})
