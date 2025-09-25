import { URLSearchParams } from 'url'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import * as Strapi from './strapiApiTypes'
import { unwrapListResponse, unwrapSingleResponse } from '../utils/utils'
import type {
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
  TrivyScan,
  TrivyScanType,
} from './modelTypes'
import convertTrivyScan from './converters/trivyScans'
import { ListResponse, SingleResponse } from './strapiClientTypes'

function createStrapiQuery({ populate }: { populate?: string[] }): string {
  const populateParams: Record<string, unknown> = {}

  populate?.sort((a, b) => b.split('.').length - a.split('.').length)

  populate?.forEach(path => {
    const keys = path.split('.')
    let current = populateParams

    keys.forEach((key, index) => {
      if (!current[key]) {
        // Ensure the last key is set to true, and intermediate keys have a `populate` object
        current[key] = index === keys.length - 1 ? true : { populate: {} as Record<string, unknown> }
      }
      current =
        typeof current[key] === 'object' && current[key] !== null
          ? (current[key] as { populate?: Record<string, unknown> }).populate ||
            (current[key] as Record<string, unknown>)
          : current
    })
  })

  const queryString = new URLSearchParams()

  function buildQuery(obj: Record<string, unknown>, prefix = 'populate') {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = `${prefix}[${key}]`
      if (typeof value === 'object' && value !== null) {
        buildQuery(value as Record<string, unknown>, fullKey)
      } else if (value === true) {
        queryString.append(fullKey, 'true')
      }
    })
  }

  buildQuery(populateParams)
  return queryString.toString()
}

export default class StrapiApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient(
      'strapiApiClient',
      config.apis.serviceCatalogue as ApiConfig,
      config.apis.serviceCatalogue.token,
    )
  }

  async getProducts({
    withEnvironments = false,
    withComponents = false,
  }: {
    withEnvironments?: boolean
    withComponents?: boolean
  }): Promise<Product[]> {
    const populate = ['product_set']

    if (withComponents) {
      populate.push('components')
    }

    if (withEnvironments) {
      populate.push('components.envs')
    }

    return this.restClient
      .get<ListResponse<Strapi.Product>>({
        path: '/v1/products',
        query: `${createStrapiQuery({ populate })}`,
      })
      .then(unwrapListResponse)
  }

  async getProduct({
    productSlug = '',
    productDocumentId = '',
    withEnvironments = false,
  }: {
    productSlug?: string
    productDocumentId?: string
    withEnvironments?: boolean
  }): Promise<Product> {
    const populateList = ['product_set', 'team', 'components', 'service_area']

    if (withEnvironments) {
      populateList.push('components.envs')
    }

    const populate = createStrapiQuery({ populate: populateList })
    const query = productSlug ? `filters[slug][$eq]=${productSlug}&${populate}` : populate
    const path = productSlug ? '/v1/products' : `/v1/products/${productDocumentId}`

    return this.restClient.get<SingleResponse<Strapi.Product>>({ path, query }).then(unwrapSingleResponse)
  }

  async getComponents(
    exemptionFilters: string[] = [],
    includeTeams: boolean = true,
    includeLatestCommit: boolean = false,
  ): Promise<Component[]> {
    const populate = createStrapiQuery({
      populate: [`product${includeTeams ? '.team' : ''}`, 'envs', ...(includeLatestCommit ? ['latest_commit'] : [])],
    })
    const filters = exemptionFilters.map((filterValue, index) => {
      return `filters[veracode_exempt][$in][${index}]=${filterValue}`
    })

    return this.restClient
      .get<ListResponse<Strapi.Component>>({
        path: '/v1/components',
        query: `${populate}&${filters.join('&')}`,
      })
      .then(unwrapListResponse)
  }

  async getComponent({ componentName }: { componentName: string }): Promise<Component> {
    const populate = createStrapiQuery({ populate: ['product.team', 'envs.trivy_scan'] })

    return this.restClient
      .get<SingleResponse<Strapi.Component>>({
        path: '/v1/components',
        query: `filters[name][$eq]=${componentName}&${populate}`,
      })
      .then(unwrapSingleResponse)
  }

  async getTeams({ withComponents = false }: { withComponents?: boolean }): Promise<Team[]> {
    const populateList = ['products']
    if (withComponents) {
      populateList.push('products.components')
    }
    const path = '/v1/teams'
    const populate = createStrapiQuery({ populate: populateList })
    const query = populate
    return this.restClient
      .get<ListResponse<Strapi.Team>>({
        path,
        query,
      })
      .then(unwrapListResponse)
  }

  async getTeam({
    teamDocumentId = '',
    teamSlug = '',
    withEnvironments = false,
  }: {
    teamDocumentId?: string
    teamSlug?: string
    withEnvironments?: boolean
  }): Promise<Team> {
    const populateList = ['products']

    if (withEnvironments) {
      populateList.push('products.components.envs')
    }

    const populate = createStrapiQuery({ populate: populateList })
    const query = teamSlug ? `filters[slug][$eq]=${teamSlug}&${populate}` : populate
    const path = teamSlug ? '/v1/teams' : `/v1/teams/${teamDocumentId}`

    return this.restClient.get<SingleResponse<Strapi.Team>>({ path, query }).then(unwrapSingleResponse)
  }

  async getNamespaces(): Promise<Namespace[]> {
    return this.restClient
      .get<ListResponse<Strapi.Namespace>>({
        path: '/v1/namespaces',
        query: 'populate=*',
      })
      .then(unwrapListResponse)
  }

  async getNamespace({
    namespaceDocumentId = '',
    namespaceSlug = '',
  }: {
    namespaceDocumentId?: string
    namespaceSlug?: string
  }): Promise<Namespace> {
    const populateList = ['rds_instance', 'elasticache_cluster', 'pingdom_check', 'hmpps_template']

    const populate = createStrapiQuery({ populate: populateList })
    const query = namespaceSlug ? `filters[name][$eq]=${namespaceSlug}&${populate}` : populate
    const path = namespaceSlug ? '/v1/namespaces' : `/v1/namespaces/${namespaceDocumentId}`

    return this.restClient.get<SingleResponse<Strapi.Namespace>>({ path, query }).then(unwrapSingleResponse)
  }

  async getProductSets(): Promise<ProductSet[]> {
    return this.restClient
      .get<ListResponse<Strapi.ProductSet>>({
        path: '/v1/product-sets',
        query: 'populate[products]=true',
      })
      .then(unwrapListResponse)
  }

  async getProductSet({ productSetDocumentId = '' }: { productSetDocumentId: string }): Promise<ProductSet> {
    return this.restClient
      .get<SingleResponse<Strapi.ProductSet>>({
        path: `/v1/product-sets/${productSetDocumentId}`,
        query: createStrapiQuery({ populate: ['products'] }),
      })
      .then(unwrapSingleResponse)
  }

  async getServiceAreas(): Promise<ServiceArea[]> {
    return this.restClient
      .get<ListResponse<Strapi.ServiceArea>>({
        path: '/v1/service-areas',
        query: 'populate[products]=true',
      })
      .then(unwrapListResponse)
  }

  async getServiceArea({
    serviceAreaDocumentId = '',
    serviceAreaSlug = '',
    withProducts = false,
  }: {
    serviceAreaDocumentId?: string
    serviceAreaSlug?: string
    withProducts?: boolean
  }): Promise<ServiceArea> {
    const populateList = ['products']

    if (withProducts) {
      populateList.push('products.components.envs')
    }
    const populate = createStrapiQuery({ populate: populateList })
    const query = serviceAreaSlug ? `filters[slug][$eq]=${serviceAreaSlug}&${populate}` : populate
    const path = serviceAreaSlug ? '/v1/service-areas' : `/v1/service-areas/${serviceAreaDocumentId}`
    return this.restClient.get<SingleResponse<Strapi.ServiceArea>>({ path, query }).then(unwrapSingleResponse)
  }

  async getCustomComponentViews({
    withEnvironments = false,
  }: {
    withEnvironments?: boolean
  }): Promise<CustomComponentView[]> {
    const populate = ['components']

    if (withEnvironments) {
      populate.push('components.envs')
    }

    return this.restClient
      .get<ListResponse<Strapi.CustomComponentView>>({
        path: '/v1/custom-component-views',
        query: createStrapiQuery({ populate }),
      })
      .then(unwrapListResponse)
  }

  async getCustomComponentView({
    customComponentDocumentId = '',
    withEnvironments = false,
  }: {
    customComponentDocumentId: string
    withEnvironments?: boolean
  }): Promise<CustomComponentView> {
    const populate = ['components', 'components.product']

    if (withEnvironments) {
      populate.push('components.envs')
    }

    return this.restClient
      .get<SingleResponse<CustomComponentView>>({
        path: `/v1/custom-component-views/${customComponentDocumentId}`,
        query: createStrapiQuery({ populate }),
      })
      .then(unwrapSingleResponse)
  }

  async getGithubRepoRequests(): Promise<GithubRepoRequest[]> {
    return this.restClient
      .get<ListResponse<Strapi.GithubRepoRequest>>({
        path: '/v1/github-repo-requests',
      })
      .then(unwrapListResponse)
  }

  async getGithubRepoRequest({ repoName }: { repoName: string }): Promise<GithubRepoRequest> {
    return this.restClient
      .get<SingleResponse<Strapi.GithubRepoRequest>>({
        path: '/v1/github-repo-requests',
        query: `filters[github_repo][$eq]=${repoName}`,
      })
      .then(unwrapSingleResponse)
  }

  async postGithubRepoRequest(request: GithubRepoRequestRequest): Promise<void> {
    await this.restClient.post<SingleResponse<Strapi.GithubRepoRequest>>({
      path: '/v1/github-repo-requests',
      data: request,
    })
  }

  async getGithubTeams(): Promise<GithubTeam[]> {
    return this.restClient
      .get<ListResponse<Strapi.GithubTeam>>({
        path: '/v1/github-teams',
      })
      .then(unwrapListResponse)
  }

  async getGithubTeam({ teamName }: { teamName: string }): Promise<GithubTeam> {
    return this.restClient
      .get<SingleResponse<Strapi.GithubTeam>>({
        path: '/v1/github-teams',
        query: `filters[team_name][$eq]=${teamName}`,
      })
      .then(unwrapSingleResponse)
  }

  async getGithubSubTeams({ parentTeamName }: { parentTeamName: string }): Promise<GithubTeam[]> {
    return this.restClient
      .get<ListResponse<Strapi.GithubTeam>>({
        path: '/v1/github-teams',
        query: `filters[parent_team_name][$eq]=${parentTeamName}`,
      })
      .then(unwrapListResponse)
  }

  async getScheduledJobs(): Promise<ScheduledJob[]> {
    return this.restClient
      .get<ListResponse<Strapi.ScheduledJob>>({
        path: '/v1/scheduled-jobs',
      })
      .then(unwrapListResponse)
  }

  async getScheduledJob({ name }: { name: string }): Promise<ScheduledJob> {
    return this.restClient
      .get<SingleResponse<Strapi.ScheduledJob>>({
        path: '/v1/scheduled-jobs',
        query: `filters[name][$eq]=${name}`,
      })
      .then(unwrapSingleResponse)
  }

  async getTrivyScans(): Promise<TrivyScanType[]> {
    const results = await this.restClient.get<ListResponse<Strapi.TrivyScan>>({
      path: '/v1/trivy-scans',
    })
    return results.data.map(convertTrivyScan)
  }

  async getTrivyScan({ name }: { name: string }): Promise<TrivyScan> {
    return this.restClient
      .get<SingleResponse<Strapi.TrivyScan>>({
        path: '/v1/trivy-scans',
        query: `filters[name][$eq]=${name}`,
      })
      .then(unwrapSingleResponse)
  }

  async getEnvironments(): Promise<ListResponse<Strapi.Environment>> {
    return this.restClient.get<ListResponse<Strapi.Environment>>({
      path: '/v1/environments',
      query: 'populate[component]=true',
    })
  }
}
