import nock from 'nock'
import config from '../config'
import StrapiApiClient from './strapiApiClient'
import * as Strapi from './strapiApiTypes'
import { Component, Product, ProductSet, ServiceArea, Team } from './modelTypes'
import { ListResponse, SingleResponse } from './strapiClientTypes'

const exampleServiceArea = {
  id: 123,
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
          data: [{ id: 1, attributes: { name: 'Product', p_id: '1' } }],
        } as ListResponse<Strapi.Product>
        const productsResponse = [{ id: 1, name: 'Product', p_id: '1' }] as Product[]
        fakeStrapiApi.get('/products?populate=product_set').reply(200, allProducts)
        const output = await strapiApiClient.getProducts({})
        expect(output).toEqual(productsResponse)
      })

      it('should return products with environments if selected', async () => {
        const allProducts = {
          data: [{ id: 1, attributes: { name: 'Product', p_id: '1' } }],
        } as ListResponse<Strapi.Product>
        const productsResponse = [{ id: 1, name: 'Product', p_id: '1' }] as Product[]
        fakeStrapiApi.get('/products?populate=product_set%2Ccomponents.envs').reply(200, allProducts)
        const output = await strapiApiClient.getProducts({ withEnvironments: true })
        expect(output).toEqual(productsResponse)
      })
    })

    describe('getProduct', () => {
      describe('with productId', () => {
        it('should return a single product', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as SingleResponse<Strapi.Product>
          const productsResponse = { id: 1, name: 'Product', p_id: '1', slug: 'product' } as Product
          fakeStrapiApi.get('/products/1?populate=product_set%2Cteam%2Ccomponents%2Cservice_area').reply(200, product)
          const output = await strapiApiClient.getProduct({ productId: 1 })
          expect(output).toEqual(productsResponse)
        })

        it('should return a single product with environments if selected', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as SingleResponse<Strapi.Product>
          const productsResponse = { id: 1, name: 'Product', p_id: '1', slug: 'product' } as Product
          fakeStrapiApi
            .get('/products/1?populate=product_set%2Cteam%2Ccomponents%2Cservice_area%2Ccomponents.envs')
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productId: 1, withEnvironments: true })
          expect(output).toEqual(productsResponse)
        })
      })
      describe('with productSlug', () => {
        it('should return a single product', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as SingleResponse<Strapi.Product>
          const productsResponse = { id: 1, name: 'Product', p_id: '1', slug: 'product' } as Product
          fakeStrapiApi
            .get('/products?filters[slug][$eq]=product&populate=product_set%2Cteam%2Ccomponents%2Cservice_area')
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productSlug: 'product' })
          expect(output).toEqual(productsResponse)
        })

        it('should return a single product with environments if selected', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as SingleResponse<Strapi.Product>
          const productsResponse = { id: 1, name: 'Product', p_id: '1', slug: 'product' } as Product
          fakeStrapiApi
            .get(
              '/products?filters[slug][$eq]=product&populate=product_set%2Cteam%2Ccomponents%2Cservice_area%2Ccomponents.envs',
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
          data: [{ id: 1, attributes: { name: 'Component' } }],
        } as ListResponse<Strapi.Component>
        const componentsResponse = [{ id: 1, name: 'Component' }] as Component[]
        fakeStrapiApi.get('/components?populate=product.team%2Cenvs&').reply(200, allComponents)
        const output = await strapiApiClient.getComponents()

        expect(output).toEqual(componentsResponse)
      })
    })

    describe('getComponent', () => {
      it('should return a single component', async () => {
        const component = {
          data: { id: 1, attributes: { name: 'component' } },
        } as SingleResponse<Strapi.Component>
        const componentResponse = { id: 1, name: 'component' } as Component
        fakeStrapiApi
          .get('/components?filters[name][$eq]=component&populate=product.team%2Cenvs.trivy_scan')
          .reply(200, component)
        const output = await strapiApiClient.getComponent({ componentName: 'component' })
        expect(output).toEqual(componentResponse)
      })
    })
  })

  describe('Teams', () => {
    describe('getTeams', () => {
      it('should return all teams', async () => {
        const allTeams = { data: [{ attributes: { name: 'Team' } }] } as ListResponse<Strapi.Team>
        const teamsResponse = [{ name: 'Team' }] as Team[]
        fakeStrapiApi.get('/teams?populate=products').reply(200, allTeams)
        const output = await strapiApiClient.getTeams({})
        expect(output).toEqual(teamsResponse)
      })
    })

    describe('getTeam', () => {
      it('should return a single team', async () => {
        const team = { data: { id: 1, attributes: { name: 'Team' } } } as SingleResponse<Strapi.Team>
        const teamResponse = { id: 1, name: 'Team' } as Team
        fakeStrapiApi.get('/teams/1?populate=products').reply(200, team)
        const output = await strapiApiClient.getTeam({ teamId: 1 })
        expect(output).toEqual(teamResponse)
      })

      it('should return a single team with environments if selected', async () => {
        const team = { data: { id: 1, attributes: { name: 'Team' } } } as SingleResponse<Strapi.Team>
        const teamResponse = { id: 1, name: 'Team' } as Team
        fakeStrapiApi.get('/teams/1?populate=products%2Cproducts.components.envs').reply(200, team)
        const output = await strapiApiClient.getTeam({ teamId: 1, withEnvironments: true })
        expect(output).toEqual(teamResponse)
      })
    })
  })

  describe('Product Sets', () => {
    describe('getProductSets', () => {
      it('should return all product sets', async () => {
        const allProductSets = {
          data: [{ attributes: { name: 'Product Set' } }],
        } as ListResponse<Strapi.ProductSet>
        const productSetsResponse = [{ name: 'Product Set' }] as ProductSet[]
        fakeStrapiApi.get('/product-sets?populate=products').reply(200, allProductSets)
        const output = await strapiApiClient.getProductSets()
        expect(output).toEqual(productSetsResponse)
      })
    })

    describe('getProductSet', () => {
      it('should return a single product set', async () => {
        const productSet = {
          data: { id: 1, attributes: { name: 'Product Set' } },
        } as SingleResponse<Strapi.ProductSet>
        const productSetResponse = { id: 1, name: 'Product Set' } as ProductSet
        fakeStrapiApi.get('/product-sets/1?populate=products').reply(200, productSet)
        const output = await strapiApiClient.getProductSet({ productSetId: 1 })
        expect(output).toEqual(productSetResponse)
      })
    })
  })

  describe('Service Areas', () => {
    describe('getServiceAreas', () => {
      it('should return all service areas', async () => {
        const allServiceAreas = { data: [exampleServiceArea] }
        fakeStrapiApi.get('/service-areas?populate=products').reply(200, allServiceAreas)
        const output = await strapiApiClient.getServiceAreas()

        expect(output.map(serviceArea => serviceArea.name)).toContain(exampleServiceArea.name)
      })
    })

    describe('getServiceArea', () => {
      it('should return a single service area', async () => {
        const serviceArea = {
          data: { id: 1, attributes: { name: 'Service Area' } },
        } as SingleResponse<Strapi.ServiceArea>
        const serviceAreaResponse = { id: 1, name: 'Service Area' } as ServiceArea
        fakeStrapiApi.get('/service-areas/1?populate=products').reply(200, serviceArea)
        const output = await strapiApiClient.getServiceArea({ serviceAreaId: 1 })

        expect(output).toEqual(serviceAreaResponse)
      })
    })
  })

  describe('postGithubRepoRequest', () => {
    it('should insert a single form request', async () => {
      const response = {
        data: { id: 1, attributes: { name: 'GIthub repo request form' } },
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

  describe('Environments', () => {
    describe('getEnvironments', () => {
      it('should return all environments', async () => {
        const allEnvironments = {
          data: [{ attributes: { name: 'Environment' } }],
        } as ListResponse<Strapi.Environment>
        fakeStrapiApi.get('/environments?populate=component').reply(200, allEnvironments)
        const output = await strapiApiClient.getEnvironments()
        expect(output).toEqual(allEnvironments)
      })
    })
  })
})
