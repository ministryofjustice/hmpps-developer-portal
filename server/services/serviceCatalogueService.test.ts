import { RdsEntry } from '../@types'
import { createModelServiceArea } from '../data/converters/serviceArea.test'
import StrapiApiClient from '../data/strapiApiClient'
import {
  Component,
  Product,
  ProductSet,
  StrapiServiceArea,
  Team,
  Namespace,
  GithubTeam,
  CustomComponentView,
  GithubRepoRequest,
  ListResponse,
  DataItem,
  Environment,
  SingleResponse,
  Unwrapped,
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
      } as ListResponse<Product>
      const testProducts = [
        {
          id: 1,
          attributes: { name: 'Product 1', p_id: '1' },
        },
        {
          id: 2,
          attributes: { name: 'Product 2', p_id: '2' },
        },
      ] as DataItem<Product>[]

      it('should return an ordered array of products', async () => {
        strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

        const results = await serviceCatalogueService.getProducts({})

        expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProducts)
      })
    })

    describe('getProduct', () => {
      const testProductResponse = {
        data: [
          {
            id: 1,
            attributes: { name: 'Product 1', p_id: '1', slug: 'product-1' },
          },
        ],
      } as SingleResponse<Product>
      const testProduct = { name: 'Product 1', p_id: '1', slug: 'product-1' } as Product

      it('should return the selected product', async () => {
        strapiApiClient.getProduct.mockResolvedValue(testProductResponse)

        const results = await serviceCatalogueService.getProduct({ productSlug: 'product-1' })

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
      } as ListResponse<Team>
      const testTeams = [
        {
          id: 1,
          attributes: { name: 'Team 1' },
        },
        {
          id: 2,
          attributes: { name: 'Team 2' },
        },
      ] as DataItem<Team>[]

      it('should return an ordered array of teams', async () => {
        strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

        const results = await serviceCatalogueService.getTeams()

        expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeams)
      })
    })

    describe('getTeam', () => {
      const testTeam = { name: 'Team 1', slug: 'team-1' } as Team

      it('should return the selected team by ID', async () => {
        const testTeamResponse = {
          data: {
            id: 1,
            attributes: { name: 'Team 1', slug: 'team-1' },
          },
        } as SingleResponse<Team>

        strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

        const results = await serviceCatalogueService.getTeam({ teamId: 1 })

        expect(strapiApiClient.getTeam).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeam)
      })

      it('should return the selected team by slug', async () => {
        const testTeamResponse = {
          data: [
            {
              id: 1,
              attributes: { name: 'Team 1', slug: 'team-1' },
            },
          ],
        } as SingleResponse<Team>

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
        const serviceAreas = [createModelServiceArea(123, 'service-1'), createModelServiceArea(234, 'service-2')]
        strapiApiClient.getServiceAreas.mockResolvedValue(serviceAreas)

        const results = await serviceCatalogueService.getServiceAreas()

        expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
        expect(results).toEqual(serviceAreas)
      })
    })

    describe('getServiceArea', () => {
      const testServiceArea = { name: 'Service Area 1', slug: 'service-area-1' } as StrapiServiceArea

      it('should return the selected service area by ID', async () => {
        const testServiceAreaResponse = {
          data: {
            id: 1,
            attributes: { name: 'Service Area 1', slug: 'service-area-1' },
          },
        } as SingleResponse<StrapiServiceArea>

        strapiApiClient.getServiceArea.mockResolvedValue(testServiceAreaResponse)

        const results = await serviceCatalogueService.getServiceArea({ serviceAreaId: 1 })

        expect(strapiApiClient.getServiceArea).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testServiceArea)
      })

      it('should return the selected service area by slug', async () => {
        const testServiceAreaResponse = {
          data: [
            {
              id: 1,
              attributes: { name: 'Service Area 1', slug: 'service-area-1' },
            },
          ],
        } as SingleResponse<StrapiServiceArea>

        strapiApiClient.getServiceArea.mockResolvedValue(testServiceAreaResponse)

        const results = await serviceCatalogueService.getServiceArea({ serviceAreaSlug: 'service-area-1' })

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
      } as ListResponse<ProductSet>
      const testProductSets = [
        { id: 1, attributes: { name: 'Product Set 1' } },
        { id: 2, attributes: { name: 'Product Set 2' } },
      ] as DataItem<ProductSet>[]

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
      } as SingleResponse<ProductSet>
      const testProductSet = { name: 'Product Set 1' } as ProductSet

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
      data: {
        id: 1,
        attributes: {
          name: 'custom component 1',
        },
      },
    } as SingleResponse<CustomComponentView>
    const testCustomComponentView = {
      name: 'custom component 1',
    } as CustomComponentView

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
