import nock from 'nock'
import config from '../config'
import StrapiApiClient from './strapiApiClient'
import * as Strapi from './strapiApiTypes'
import {
  Component,
  Product,
  ProductSet,
  ServiceArea,
  Team,
  Namespace,
  CustomComponentView,
  GithubRepoRequest,
  GithubTeam,
  ScheduledJob,
  TrivyScan,
  TrivyScanType,
} from './modelTypes'
import { ListResponse, SingleResponse } from './strapiClientTypes'

const exampleServiceArea = {
  documentId: 'documentid1',
  name: 'A Service Area name',
  owner: 'The Owner',
  createdAt: '2023-07-04T10:44:59.491Z',
  updatedAt: '2025-03-28T09:33:19.417Z',
  publishedAt: '2023-07-04T10:44:59.489Z',
  sa_id: 'SA01',
  slug: 'a-service-area-name',
  products: [
    {
      id: 456,
      name: 'A Product name',
      subproduct: false,
      legacy: false,
      description: 'A description of the project',
      phase: 'Private Beta',
      delivery_manager: 'Delivery Manager',
      product_manager: 'Product Manager',
      confluence_link: 'https://atlassian.net/wiki/spaces/SOME/overview',
      gdrive_link: '',
      createdAt: '2024-06-26T10:09:15.667Z',
      updatedAt: '2025-03-28T09:33:49.200Z',
      publishedAt: '2024-06-26T10:09:15.663Z',
      p_id: 'DPS000',
      slack_channel_id: 'C01ABC0ABCD',
      slug: 'a-product-name-1',
      slack_channel_name: 'some-slack-channel',
      lead_developer: 'Lead Developer',
      components: [],
      team: undefined,
      service_area: undefined,
      product_set: undefined,
    },
  ],
} as ServiceArea

describe('strapiApiClient', () => {
  let fakeStrapiApi: nock.Scope
  let strapiApiClient: StrapiApiClient

  beforeEach(() => {
    fakeStrapiApi = nock(`${config.apis.serviceCatalogue.url}/v1`)
    strapiApiClient = new StrapiApiClient()
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('Products', () => {
    describe('getProducts', () => {
      it('should return all products by default', async () => {
        const allProducts = {
          data: [{ documentId: 'documentid1', name: 'Product', p_id: '1' }],
        } as ListResponse<Strapi.Product>
        const productsResponse = [{ documentId: 'documentid1', name: 'Product', p_id: '1' }] as Product[]
        fakeStrapiApi.get('/products?populate[product_set]=true').reply(200, allProducts)
        const output = await strapiApiClient.getProducts({})
        expect(output).toEqual(productsResponse)
      })

      it('should return products with environments if selected', async () => {
        const allProducts = {
          data: [{ documentId: 'documentid1', name: 'Product', p_id: '1' }],
        } as ListResponse<Strapi.Product>
        const productsResponse = [{ documentId: 'documentid1', name: 'Product', p_id: '1' }] as Product[]
        fakeStrapiApi
          .get('/products?populate[product_set]=true&populate[components][populate][envs]=true')
          .reply(200, allProducts)
        const output = await strapiApiClient.getProducts({ withEnvironments: true })
        expect(output).toEqual(productsResponse)
      })
    })

    describe('getProduct', () => {
      describe('with productDocumentId', () => {
        it('should return a single product', async () => {
          const product = {
            data: { documentId: 'documentid1', name: 'Product', p_id: '1', slug: 'product' },
          } as SingleResponse<Strapi.Product>
          const productsResponse = {
            documentId: 'documentid1',
            name: 'Product',
            p_id: '1',
            slug: 'product',
          } as Product
          fakeStrapiApi
            .get(
              '/products/documentid1?populate[product_set]=true&populate[team]=true&populate[components]=true&populate[service_area]=true',
            )
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productDocumentId: 'documentid1' })
          expect(output).toEqual(productsResponse)
        })

        it('should return a single product with environments if selected', async () => {
          const product = {
            data: { documentId: 'documentid1', name: 'Product', p_id: '1', slug: 'product' },
          } as SingleResponse<Strapi.Product>
          const productsResponse = {
            documentId: 'documentid1',
            name: 'Product',
            p_id: '1',
            slug: 'product',
          } as Product
          fakeStrapiApi
            .get(
              '/products/documentid1?populate[product_set]=true&populate[team]=true&populate[components][populate][envs]=true&populate[service_area]=true',
            )
            .reply(200, product)
          const output = await strapiApiClient.getProduct({
            productDocumentId: 'documentid1',
            withEnvironments: true,
          })
          expect(output).toEqual(productsResponse)
        })
      })
      describe('with productSlug', () => {
        it('should return a single product', async () => {
          const product = {
            data: { documentId: 'documentid1', name: 'Product', p_id: '1', slug: 'product' },
          } as SingleResponse<Strapi.Product>
          const productsResponse = {
            documentId: 'documentid1',
            name: 'Product',
            p_id: '1',
            slug: 'product',
          } as Product
          fakeStrapiApi
            .get(
              '/products?filters[slug][$eq]=product&populate[product_set]=true&populate[team]=true&populate[components]=true&populate[service_area]=true',
            )
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productSlug: 'product' })
          expect(output).toEqual(productsResponse)
        })

        it('should return a single product with environments if selected', async () => {
          const product = {
            data: { documentId: 'documentid1', name: 'Product', p_id: '1', slug: 'product' },
          } as SingleResponse<Strapi.Product>
          const productsResponse = {
            documentId: 'documentid1',
            name: 'Product',
            p_id: '1',
            slug: 'product',
          } as Product
          fakeStrapiApi
            .get(
              '/products?filters[slug][$eq]=product&populate[product_set]=true&populate[team]=true&populate[components][populate][envs]=true&populate[service_area]=true',
            )
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productSlug: 'product', withEnvironments: true })
          expect(output).toEqual(productsResponse)
        })
      })
    })
  })

  describe('Components', () => {
    describe('getComponents', () => {
      it('should return all components', async () => {
        const allComponents = {
          data: [{ documentId: 'documentid1', name: 'Component' }],
        } as ListResponse<Strapi.Component>
        const componentsResponse = [{ documentId: 'documentid1', name: 'Component' }] as Component[]
        fakeStrapiApi
          .get('/components?populate[product][populate][team]=true&populate[envs]=true&')
          .reply(200, allComponents)
        const output = await strapiApiClient.getComponents()

        expect(output).toEqual(componentsResponse)
      })
    })

    describe('getComponent', () => {
      it('should return a single component', async () => {
        const component = {
          data: { documentId: 'documentid1', name: 'component' },
        } as SingleResponse<Strapi.Component>
        const componentResponse = { documentId: 'documentid1', name: 'component' } as Component
        fakeStrapiApi
          .get(
            '/components?filters[name][$eq]=component&populate[product][populate][team]=true&populate[envs][populate][trivy_scan]=true',
          )
          .reply(200, component)
        const output = await strapiApiClient.getComponent({ componentName: 'component' })
        expect(output).toEqual(componentResponse)
      })
    })
  })

  describe('Teams', () => {
    describe('getTeams', () => {
      it('should return all teams', async () => {
        const allTeams = { data: [{ name: 'Team' }] } as ListResponse<Strapi.Team>
        const teamsResponse = [{ name: 'Team' }] as Team[]
        fakeStrapiApi.get('/teams?populate[products]=true').reply(200, allTeams)
        const output = await strapiApiClient.getTeams({})
        expect(output).toEqual(teamsResponse)
      })
    })

    describe('getTeam', () => {
      it('should return a single team', async () => {
        const team = { data: { documentId: 'documentid1', name: 'Team' } } as SingleResponse<Strapi.Team>
        const teamResponse = { documentId: 'documentid1', name: 'Team' } as Team
        fakeStrapiApi.get('/teams/documentid1?populate[products]=true').reply(200, team)
        const output = await strapiApiClient.getTeam({ teamDocumentId: 'documentid1' })
        expect(output).toEqual(teamResponse)
      })

      it('should return a single team with environments if selected', async () => {
        const team = { data: { documentId: 'documentid1', name: 'Team' } } as SingleResponse<Strapi.Team>
        const teamResponse = { documentId: 'documentid1', name: 'Team' } as Team
        fakeStrapiApi
          .get('/teams/documentid1?populate[products][populate][components][populate][envs]=true')
          .reply(200, team)
        const output = await strapiApiClient.getTeam({ teamDocumentId: 'documentid1', withEnvironments: true })
        expect(output).toEqual(teamResponse)
      })
    })
  })

  describe('Product Sets', () => {
    describe('getProductSets', () => {
      it('should return all product sets', async () => {
        const allProductSets = {
          data: [{ name: 'Product Set' }],
        } as ListResponse<Strapi.ProductSet>
        const productSetsResponse = [{ name: 'Product Set' }] as ProductSet[]
        fakeStrapiApi.get('/product-sets?populate[products]=true').reply(200, allProductSets)
        const output = await strapiApiClient.getProductSets()
        expect(output).toEqual(productSetsResponse)
      })
    })

    describe('getProductSet', () => {
      it('should return a single product set', async () => {
        const productSet = {
          data: { documentId: 'documentid1', name: 'Product Set' },
        } as SingleResponse<Strapi.ProductSet>
        const productSetResponse = { documentId: 'documentid1', name: 'Product Set' } as ProductSet
        fakeStrapiApi.get('/product-sets/documentid1?populate[products]=true').reply(200, productSet)
        const output = await strapiApiClient.getProductSet({ productSetDocumentId: 'documentid1' })
        expect(output).toEqual(productSetResponse)
      })
    })
  })

  describe('Service Areas', () => {
    describe('getServiceAreas', () => {
      it('should return all service areas', async () => {
        const allServiceAreas = { data: [exampleServiceArea] }
        fakeStrapiApi.get('/service-areas?populate[products]=true').reply(200, allServiceAreas)
        const output = await strapiApiClient.getServiceAreas()

        expect(output.map(serviceArea => serviceArea.name)).toContain(exampleServiceArea.name)
      })
    })

    describe('getServiceArea', () => {
      it('should return a single service area', async () => {
        const serviceArea = {
          data: { documentId: 'documentid1', name: 'Service Area' },
        } as SingleResponse<Strapi.ServiceArea>
        const serviceAreaResponse = { documentId: 'documentid1', name: 'Service Area' } as ServiceArea
        fakeStrapiApi.get('/service-areas/documentid1?populate[products]=true').reply(200, serviceArea)
        const output = await strapiApiClient.getServiceArea({ serviceAreaDocumentId: 'documentid1' })

        expect(output).toEqual(serviceAreaResponse)
      })
    })
  })

  describe('postGithubRepoRequest', () => {
    it('should insert a single form request', async () => {
      const response = {
        data: { documentId: 'documentid1', name: 'GIthub repo request form' },
      } as Strapi.GithubRepoRequestRequest
      fakeStrapiApi.post('/github-repo-requests').reply(200, response)

      await strapiApiClient.postGithubRepoRequest({
        data: {
          github_repo: 'Test01',
          repo_description: 'Test Data',
          base_template: 'abc',
          jira_project_keys: 'abc',
          github_project_visibility: 'public',
          product: 'abc',
          github_project_teams_write: 'hmpps-sre',
          github_projects_teams_admin: 'hmpps-sre',
          github_project_branch_protection_restricted_teams: 'hmpps-sre',
          slack_channel_nonprod_release_notify: 'hmpps-sre-nonprod-slack-channel',
          slack_channel_security_scans_notify: 'hmpps-sre-nonprod-slack-channel',
          prod_alerts_severity_label: 'hmpps-sre-prod-slack-channel',
          nonprod_alerts_severity_label: 'hmpps-sre-nonprod-slack-channel',
        },
      })
    })
  })

  describe('Namespaces', () => {
    describe('getNamespaces', () => {
      it('should return all namespaces', async () => {
        const allNamespaces = {
          data: [{ documentId: 'documentid1', name: 'Namespace' }],
        } as ListResponse<Strapi.Namespace>
        const namespacesResponse = [{ documentId: 'documentid1', name: 'Namespace' }] as Namespace[]
        fakeStrapiApi.get('/namespaces?populate=*').reply(200, allNamespaces)
        const output = await strapiApiClient.getNamespaces()
        expect(output).toEqual(namespacesResponse)
      })
    })

    describe('getNamespace', () => {
      it('should return a single namespace by documentId', async () => {
        const namespace = {
          data: { documentId: 'documentid1', name: 'Namespace' },
        } as SingleResponse<Strapi.Namespace>
        const namespaceResponse = { documentId: 'documentid1', name: 'Namespace' } as Namespace
        fakeStrapiApi.get('/namespaces/documentid1').query(true).reply(200, namespace)
        const output = await strapiApiClient.getNamespace({ namespaceDocumentId: 'documentid1' })
        expect(output).toEqual(namespaceResponse)
      })

      it('should return a single namespace by slug', async () => {
        const namespace = {
          data: { documentId: 'documentid1', name: 'Namespace', slug: 'namespace-slug' },
        } as SingleResponse<Strapi.Namespace>
        const namespaceResponse = { documentId: 'documentid1', name: 'Namespace', slug: 'namespace-slug' } as Namespace
        fakeStrapiApi.get('/namespaces').query(true).reply(200, namespace)
        const output = await strapiApiClient.getNamespace({ namespaceSlug: 'namespace-slug' })
        expect(output).toEqual(namespaceResponse)
      })
    })
  })

  describe('Custom Component Views', () => {
    describe('getCustomComponentViews', () => {
      it('should return all custom component views', async () => {
        const allCustomComponents = {
          data: [{ documentId: 'documentid1', name: 'Custom Component' }],
        } as ListResponse<Strapi.CustomComponentView>
        const customComponentsResponse = [
          { documentId: 'documentid1', name: 'Custom Component' },
        ] as CustomComponentView[]
        fakeStrapiApi.get('/custom-component-views?populate[components]=true').reply(200, allCustomComponents)
        const output = await strapiApiClient.getCustomComponentViews({})
        expect(output).toEqual(customComponentsResponse)
      })

      it('should return custom component views with environments if selected', async () => {
        const allCustomComponents = {
          data: [{ documentId: 'documentid1', name: 'Custom Component' }],
        } as ListResponse<Strapi.CustomComponentView>
        const customComponentsResponse = [
          { documentId: 'documentid1', name: 'Custom Component' },
        ] as CustomComponentView[]
        fakeStrapiApi
          .get('/custom-component-views?populate[components][populate][envs]=true')
          .reply(200, allCustomComponents)
        const output = await strapiApiClient.getCustomComponentViews({ withEnvironments: true })
        expect(output).toEqual(customComponentsResponse)
      })
    })

    describe('getCustomComponentView', () => {
      it('should return a single custom component view', async () => {
        const customComponent = {
          data: { documentId: 'documentid1', name: 'Custom Component' },
        } as SingleResponse<Strapi.CustomComponentView>
        const customComponentResponse = { documentId: 'documentid1', name: 'Custom Component' } as CustomComponentView
        fakeStrapiApi
          .get('/custom-component-views?filters[id][$eq]=documentid1&populate[components][populate][product]=true')
          .reply(200, customComponent)
        const output = await strapiApiClient.getCustomComponentView({ customComponentDocumentId: 'documentid1' })
        expect(output).toEqual(customComponentResponse)
      })

      it('should return a single custom component view with environments if selected', async () => {
        const customComponent = {
          data: { documentId: 'documentid1', name: 'Custom Component' },
        } as SingleResponse<Strapi.CustomComponentView>
        const customComponentResponse = { documentId: 'documentid1', name: 'Custom Component' } as CustomComponentView
        fakeStrapiApi
          .get(
            '/custom-component-views?filters[id][$eq]=documentid1&populate[components][populate][product]=true&populate[components][populate][envs]=true',
          )
          .reply(200, customComponent)
        const output = await strapiApiClient.getCustomComponentView({
          customComponentDocumentId: 'documentid1',
          withEnvironments: true,
        })
        expect(output).toEqual(customComponentResponse)
      })
    })
  })

  describe('Github Repo Requests', () => {
    describe('getGithubRepoRequests', () => {
      it('should return all github repo requests', async () => {
        const allGithubRepoRequests = {
          data: [{ documentId: 'documentid1', github_repo: 'test-repo' }],
        } as ListResponse<Strapi.GithubRepoRequest>
        const githubRepoRequestsResponse = [
          { documentId: 'documentid1', github_repo: 'test-repo' },
        ] as GithubRepoRequest[]
        fakeStrapiApi.get('/github-repo-requests').reply(200, allGithubRepoRequests)
        const output = await strapiApiClient.getGithubRepoRequests()
        expect(output).toEqual(githubRepoRequestsResponse)
      })
    })

    describe('getGithubRepoRequest', () => {
      it('should return a single github repo request', async () => {
        const githubRepoRequest = {
          data: { documentId: 'documentid1', github_repo: 'test-repo' },
        } as SingleResponse<Strapi.GithubRepoRequest>
        const githubRepoRequestResponse = { documentId: 'documentid1', github_repo: 'test-repo' } as GithubRepoRequest
        fakeStrapiApi.get('/github-repo-requests?filters[github_repo][$eq]=test-repo').reply(200, githubRepoRequest)
        const output = await strapiApiClient.getGithubRepoRequest({ repoName: 'test-repo' })
        expect(output).toEqual(githubRepoRequestResponse)
      })
    })
  })

  describe('Github Teams', () => {
    describe('getGithubTeams', () => {
      it('should return all github teams', async () => {
        const allGithubTeams = {
          data: [{ documentId: 'documentid1', name: 'test-team' }],
        } as unknown as ListResponse<Strapi.GithubTeam>
        const githubTeamsResponse = [{ documentId: 'documentid1', name: 'test-team' }] as unknown as GithubTeam[]
        fakeStrapiApi.get('/github-teams').reply(200, allGithubTeams)
        const output = await strapiApiClient.getGithubTeams()
        expect(output).toEqual(githubTeamsResponse)
      })
    })

    describe('getGithubTeam', () => {
      it('should return a single github team', async () => {
        const githubTeam = {
          data: { documentId: 'documentid1', name: 'test-team' },
        } as unknown as SingleResponse<Strapi.GithubTeam>
        const githubTeamResponse = { documentId: 'documentid1', name: 'test-team' } as unknown as GithubTeam
        fakeStrapiApi.get('/github-teams?filters[team_name][$eq]=test-team').reply(200, githubTeam)
        const output = await strapiApiClient.getGithubTeam({ teamName: 'test-team' })
        expect(output).toEqual(githubTeamResponse)
      })
    })

    describe('getGithubSubTeams', () => {
      it('should return github sub teams for a parent team', async () => {
        const githubSubTeams = {
          data: [{ documentId: 'documentid1', name: 'sub-team', parent_team: 'parent-team' }],
        } as unknown as ListResponse<Strapi.GithubTeam>
        const githubSubTeamsResponse = [
          { documentId: 'documentid1', name: 'sub-team', parent_team: 'parent-team' },
        ] as unknown as GithubTeam[]
        fakeStrapiApi.get('/github-teams?filters[parent_team_name][$eq]=parent-team').reply(200, githubSubTeams)
        const output = await strapiApiClient.getGithubSubTeams({ parentTeamName: 'parent-team' })
        expect(output).toEqual(githubSubTeamsResponse)
      })
    })
  })

  describe('Scheduled Jobs', () => {
    describe('getScheduledJobs', () => {
      it('should return all scheduled jobs', async () => {
        const allScheduledJobs = {
          data: [{ documentId: 'documentid1', name: 'test-job' }],
        } as ListResponse<Strapi.ScheduledJob>
        const scheduledJobsResponse = [{ documentId: 'documentid1', name: 'test-job' }] as ScheduledJob[]
        fakeStrapiApi.get('/scheduled-jobs').reply(200, allScheduledJobs)
        const output = await strapiApiClient.getScheduledJobs()
        expect(output).toEqual(scheduledJobsResponse)
      })
    })

    describe('getScheduledJob', () => {
      it('should return a single scheduled job', async () => {
        const scheduledJob = {
          data: { documentId: 'documentid1', name: 'test-job' },
        } as SingleResponse<Strapi.ScheduledJob>
        const scheduledJobResponse = { documentId: 'documentid1', name: 'test-job' } as ScheduledJob
        fakeStrapiApi.get('/scheduled-jobs?filters[name][$eq]=test-job').reply(200, scheduledJob)
        const output = await strapiApiClient.getScheduledJob({ name: 'test-job' })
        expect(output).toEqual(scheduledJobResponse)
      })
    })
  })

  describe('Trivy Scans', () => {
    describe('getTrivyScans', () => {
      it('should return all trivy scans', async () => {
        const allTrivyScans = {
          data: [
            {
              id: 1,
              name: 'test-scan',
              trivy_scan_timestamp: '2023-01-01T00:00:00Z',
              build_image_tag: 'latest',
              scan_status: 'Succeeded',
              environments: ['dev'],
              scan_summary: {},
            },
          ],
        } as unknown as ListResponse<Strapi.TrivyScan>
        const trivyScansResponse = [
          {
            id: 1,
            name: 'test-scan',
            trivy_scan_timestamp: '2023-01-01T00:00:00Z',
            build_image_tag: 'latest',
            scan_status: 'Succeeded',
            environments: ['dev'],
            scan_summary: {},
          },
        ] as TrivyScanType[]
        fakeStrapiApi.get('/trivy-scans').reply(200, allTrivyScans)
        const output = await strapiApiClient.getTrivyScans()
        expect(output).toEqual(trivyScansResponse)
      })
    })

    describe('getTrivyScan', () => {
      it('should return a single trivy scan', async () => {
        const trivyScan = {
          data: {
            id: 1,
            name: 'test-scan',
            trivy_scan_timestamp: '2023-01-01T00:00:00Z',
            build_image_tag: 'latest',
            scan_status: 'Succeeded',
            environments: ['dev'],
            scan_summary: {},
          },
        } as unknown as SingleResponse<Strapi.TrivyScan>
        const trivyScanResponse = {
          id: 1,
          name: 'test-scan',
          trivy_scan_timestamp: '2023-01-01T00:00:00Z',
          build_image_tag: 'latest',
          scan_status: 'Succeeded',
          environments: ['dev'],
          scan_summary: {},
        } as unknown as TrivyScan
        fakeStrapiApi.get('/trivy-scans?filters[name][$eq]=test-scan').reply(200, trivyScan)
        const output = await strapiApiClient.getTrivyScan({ name: 'test-scan' })
        expect(output).toEqual(trivyScanResponse)
      })
    })
  })

  describe('Environments', () => {
    describe('getEnvironments', () => {
      it('should return all environments', async () => {
        const allEnvironments = {
          data: [{ name: 'Environment' }],
        } as ListResponse<Strapi.Environment>
        fakeStrapiApi.get('/environments?populate[component]=true').reply(200, allEnvironments)
        const output = await strapiApiClient.getEnvironments()
        expect(output).toEqual(allEnvironments)
      })
    })
  })
})
