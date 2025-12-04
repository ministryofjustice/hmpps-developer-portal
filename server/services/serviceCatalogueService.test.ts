import { RdsEntry } from '../@types'
import {
  Component,
  CustomComponentView,
  GithubRepoRequest,
  GithubRepoRequestRequest,
  GithubTeam,
  Namespace,
  Product,
  ProductSet,
  ScheduledJob,
  ServiceArea,
  Team,
  TrivyScanType,
} from '../data/modelTypes'
import StrapiApiClient from '../data/strapiApiClient'
import { Environment } from '../data/strapiApiTypes'
import { ListResponse } from '../data/strapiClientTypes'
import ServiceCatalogueService from './serviceCatalogueService'

jest.mock('../data/strapiApiClient')

const serviceAreas = [
  {
    documentId: 'documentid1',
    name: 'service-1',
    owner: 'The Owner',
    sa_id: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        description: 'A description of the project',
        id: 456,
        name: 'A Product name',
        p_id: 'DPS000',
        slug: 'a-product-name-1',
      },
    ],
  },
  {
    documentId: 'documentid6',
    name: 'service-2',
    owner: 'The Owner',
    sa_id: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        description: 'A description of the project',
        documentId: 'documentid5',
        name: 'A Product name',
        p_id: 'DPS000',
        slug: 'a-product-name-1',
      },
    ],
  },
] as ServiceArea[]
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
          documentId: 'documentid1',
          name: 'Product 1',
          p_id: '1',
        },
        {
          documentId: 'documentid3',
          name: 'Product 2',
          p_id: '2',
        },
      ] as Product[]

      it('should return an ordered array of products', async () => {
        strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

        const results = await serviceCatalogueService.getProducts({})

        expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
        expect(strapiApiClient.getProducts).toHaveBeenCalledWith({
          withEnvironments: false,
          withComponents: false,
        })
        expect(results).toEqual(testProductsResponse)
      })

      it('should pass through withComponents=true and withEnvironments=false by default', async () => {
        strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

        await serviceCatalogueService.getProducts({ withComponents: true })

        expect(strapiApiClient.getProducts).toHaveBeenCalledWith({
          withEnvironments: false,
          withComponents: true,
        })
      })

      it('should pass through withEnvironments=true and withComponents=false by default', async () => {
        strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

        await serviceCatalogueService.getProducts({ withEnvironments: true })

        expect(strapiApiClient.getProducts).toHaveBeenCalledWith({
          withEnvironments: true,
          withComponents: false,
        })
      })

      it('should pass both flags when provided', async () => {
        strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

        await serviceCatalogueService.getProducts({
          withEnvironments: true,
          withComponents: true,
        })

        expect(strapiApiClient.getProducts).toHaveBeenCalledWith({
          withEnvironments: true,
          withComponents: true,
        })
      })
    })

    describe('getProduct', () => {
      const testProductResponse = {
        documentId: 'documentid1',
        name: 'Product 1',
        p_id: '1',
        slug: 'product-1',
      } as Product

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
          documentId: 'documentid1',
          name: 'Team 1',
        },
        {
          documentId: 'documentid3',
          name: 'Team 2',
        },
      ] as Team[]

      it('should return an ordered array of teams', async () => {
        strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

        const results = await serviceCatalogueService.getTeams({})

        expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeamsResponse)
      })
    })

    describe('getTeam', () => {
      const testTeam = { documentId: 'documentid1', name: 'Team 1', slug: 'team-1' } as Team

      it('should return the selected team by ID', async () => {
        const testTeamResponse = {
          documentId: 'documentid1',
          name: 'Team 1',
          slug: 'team-1',
        } as Team

        strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

        const results = await serviceCatalogueService.getTeam({ teamDocumentId: 'documentid1' })

        expect(strapiApiClient.getTeam).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTeam)
      })

      it('should return the selected team by slug', async () => {
        const testTeamResponse = {
          documentId: 'documentid1',
          name: 'Team 1',
          slug: 'team-1',
        } as Team

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
          documentId: 'documentid1',
          name: 'Component 1',
        },
        {
          documentId: 'documentid3',
          name: 'Component 2',
        },
      ] as Component[]
      const testComponents = [
        { documentId: 'documentid1', name: 'Component 1' },
        { documentId: 'documentid3', name: 'Component 2' },
      ] as Component[]

      it('should return an ordered array of components', async () => {
        strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

        const results = await serviceCatalogueService.getComponents()

        expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testComponents)
      })
    })

    describe('getComponent', () => {
      const testComponentResponse = {
        documentId: 'documentid1',
        name: 'Component 1',
      } as Component

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
          documentId: 'documentid1',
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
          documentId: 'documentid3',
          name: 'Component 2',
        },
      ] as Component[]
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

        const results = await serviceCatalogueService.getServiceAreas({})

        expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
        expect(results).toEqual(serviceAreas)
      })
    })

    describe('getServiceArea', () => {
      const testServiceArea = {
        documentId: 'documentid1',
        name: 'Service Area 1',
        slug: 'service-area-1',
      } as ServiceArea

      it('should return the selected service area by ID', async () => {
        const testServiceAreaResponse = {
          documentId: 'documentid1',
          name: 'Service Area 1',
          slug: 'service-area-1',
        } as ServiceArea

        strapiApiClient.getServiceArea.mockResolvedValue(testServiceAreaResponse)

        const results = await serviceCatalogueService.getServiceArea({ serviceAreaDocumentId: 'documentid1' })

        expect(strapiApiClient.getServiceArea).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testServiceArea)
      })

      it('should return the selected service area by slug', async () => {
        const testServiceAreaResponse = {
          documentId: 'documentid1',
          name: 'Service Area 1',
          slug: 'service-area-1',
        } as ServiceArea

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
          documentId: 'documentid1',
          name: 'Product Set 1',
        },
        {
          id: 2,
          name: 'Product Set 2',
        },
      ] as ProductSet[]
      const testProductSets = [
        { documentId: 'documentid1', name: 'Product Set 1' },
        { id: 2, name: 'Product Set 2' },
      ] as ProductSet[]

      it('should return an ordered array of product sets', async () => {
        strapiApiClient.getProductSets.mockResolvedValue(testProductSetsResponse)

        const results = await serviceCatalogueService.getProductSets()

        expect(strapiApiClient.getProductSets).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductSets)
      })
    })

    describe('getProductSet', () => {
      const testProductSetResponse = {
        documentId: 'documentid1',
        name: 'Product Set 1',
      } as ProductSet
      const testProductSet = { documentId: 'documentid1', name: 'Product Set 1' } as ProductSet

      it('should return the selected product set', async () => {
        strapiApiClient.getProductSet.mockResolvedValue(testProductSetResponse)

        const results = await serviceCatalogueService.getProductSet({ productSetDocumentId: 'documentid1' })

        expect(strapiApiClient.getProductSet).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testProductSet)
      })
    })
  })

  describe('Namespaces', () => {
    describe('getNamespaces', () => {
      const testNamespacesResponse = [{ name: 'Namespace 1' }, { name: 'Namespace 2' }] as Namespace[]
      const testNamespaces = [{ name: 'Namespace 1' }, { name: 'Namespace 2' }] as Namespace[]

      it('should return an ordered array of namespaces', async () => {
        strapiApiClient.getNamespaces.mockResolvedValue(testNamespacesResponse)

        const results = await serviceCatalogueService.getNamespaces()

        expect(strapiApiClient.getNamespaces).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testNamespaces)
      })
    })

    describe('getNamespace', () => {
      const testNamespaceResponse = { documentId: 'documentid1', name: 'Namespace 1' } as Namespace
      const testNamespace = { documentId: 'documentid1', name: 'Namespace 1' } as Namespace

      it('should return the selected namespace', async () => {
        strapiApiClient.getNamespace.mockResolvedValue(testNamespaceResponse)

        const results = await serviceCatalogueService.getNamespace({ namespaceDocumentId: 'documentid1' })

        expect(strapiApiClient.getNamespace).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testNamespace)
      })
    })

    describe('getRdsInstances', () => {
      const testNamespacesResponse = [
        {
          rds_instance: [{ tf_label: 'test 2' }, { tf_label: 'test 1' }],
        },
      ] as Namespace[]
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
      ] as GithubTeam[]

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
      } as GithubTeam
      const testGithubTeam = { team_name: 'Github Team 1' } as GithubTeam

      it('should return the selected github team', async () => {
        strapiApiClient.getGithubTeam.mockResolvedValue(testGithubTeamResponse)

        const results = await serviceCatalogueService.getGithubTeam({ teamName: 'Github Team 1' })

        expect(strapiApiClient.getGithubTeam).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testGithubTeam)
      })
    })

    describe('getGithubSubTeams', () => {
      const testGithubSubTeamsResponse = [
        { team_name: 'Github Team 1' },
        { team_name: 'Github Team 2' },
      ] as GithubTeam[]

      it('should return an ordered array of github subteams', async () => {
        strapiApiClient.getGithubSubTeams.mockResolvedValue(testGithubSubTeamsResponse)

        const results = await serviceCatalogueService.getGithubSubTeams({ parentTeamName: 'parent-team-one' })

        expect(strapiApiClient.getGithubSubTeams).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testGithubSubTeamsResponse)
      })
    })
  })

  describe('Scheduled Jobs', () => {
    describe('getScheduledJobs', () => {
      const testScheduledJobsResponse = [
        { id: 1, name: 'Job 1' },
        { id: 2, name: 'Job 2' },
      ] as ScheduledJob[]

      it('should return an ordered array of scheduled jobs', async () => {
        strapiApiClient.getScheduledJobs.mockResolvedValue(testScheduledJobsResponse)

        const results = await serviceCatalogueService.getScheduledJobs()

        expect(strapiApiClient.getScheduledJobs).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testScheduledJobsResponse)
      })
    })

    describe('getScheduledJob', () => {
      const testScheduledJobResponse = { id: 1, name: 'Job 1' } as ScheduledJob

      it('should return the selected scheduled job', async () => {
        strapiApiClient.getScheduledJob.mockResolvedValue(testScheduledJobResponse)

        const results = await serviceCatalogueService.getScheduledJob({ name: 'Job 1' })

        expect(strapiApiClient.getScheduledJob).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testScheduledJobResponse)
      })
    })
  })

  describe('Trivy Scans', () => {
    describe('getTrivyScans', () => {
      const testTrivyScansResponse = [
        { id: 1, name: 'Scan 1' },
        { id: 2, name: 'Scan 2' },
      ] as TrivyScanType[]

      it('should return an ordered array of trivy scans by name', async () => {
        strapiApiClient.getTrivyScans.mockResolvedValue(testTrivyScansResponse)

        const results = await serviceCatalogueService.getTrivyScans()

        expect(strapiApiClient.getTrivyScans).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTrivyScansResponse)
      })
    })

    describe('getTrivyScan', () => {
      const testTrivyScanResponse = { id: 1, name: 'Scan 1' } as TrivyScanType

      it('should return the selected trivy scan', async () => {
        strapiApiClient.getTrivyScan.mockResolvedValue(testTrivyScanResponse)

        const results = await serviceCatalogueService.getTrivyScan({ name: 'Scan 1' })

        expect(strapiApiClient.getTrivyScan).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testTrivyScanResponse)
      })
    })
  })

  describe('getCustomComponentView', () => {
    const testCustomComponentResponse = {
      documentId: 'documentid1',
      name: 'custom component 1',
    } as CustomComponentView
    const testCustomComponentView = {
      documentId: 'documentid1',
      name: 'custom component 1',
    } as CustomComponentView

    it('should return the selected github team', async () => {
      strapiApiClient.getCustomComponentView.mockResolvedValue(testCustomComponentResponse)

      const results = await serviceCatalogueService.getCustomComponentView({
        customComponentDocumentId: 'documentid1',
      })

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
      ] as GithubRepoRequest[]

      it('should return an ordered array of repo requests', async () => {
        strapiApiClient.getGithubRepoRequests.mockResolvedValue(githubResponses)

        const results = await serviceCatalogueService.getGithubRepoRequests()

        expect(strapiApiClient.getGithubRepoRequests).toHaveBeenCalledTimes(1)
        expect(results).toEqual(githubResponses)
      })
    })

    describe('getGithubRepoRequest', () => {
      const githubRequestResponse = [
        {
          id: 57,
          github_repo: 'github_repo-1',
        },
      ] as GithubRepoRequest[]

      it('should return the selected repo request', async () => {
        strapiApiClient.getGithubRepoRequest.mockResolvedValue(githubRequestResponse)

        const results = await serviceCatalogueService.getGithubRepoRequest({ repoName: 'github_repo-1' })

        expect(strapiApiClient.getGithubRepoRequest).toHaveBeenCalledTimes(1)
        expect(results).toEqual(githubRequestResponse)
      })
    })

    describe('postGithubRepoRequest', () => {
      const testPostGithubRequest = { data: { github_repo: 'github_repo-1' } } as GithubRepoRequestRequest

      it('should post a github repo request', async () => {
        strapiApiClient.postGithubRepoRequest.mockResolvedValue(undefined)

        await serviceCatalogueService.postGithubRepoRequest(testPostGithubRequest)

        expect(strapiApiClient.postGithubRepoRequest).toHaveBeenCalledTimes(1)
        expect(strapiApiClient.postGithubRepoRequest).toHaveBeenCalledWith(testPostGithubRequest)
      })
    })
  })

  describe('Environments', () => {
    describe('getEnvironments', () => {
      const testEnvironmentsResponse = {
        data: [
          { documentId: 'documentid1', name: 'Environment 1' },
          { id: 2, name: 'Environment 2' },
        ],
      } as ListResponse<Environment>

      it('should return an ordered array of environments', async () => {
        strapiApiClient.getEnvironments.mockResolvedValue(testEnvironmentsResponse)

        const results = await serviceCatalogueService.getEnvironments()

        expect(strapiApiClient.getEnvironments).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testEnvironmentsResponse.data)
      })
    })
  })
})
