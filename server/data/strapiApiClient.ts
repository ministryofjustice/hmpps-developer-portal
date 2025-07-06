import { URLSearchParams } from 'url'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  GithubRepoRequestRequest,
  ListResponse,
  Product,
  Component,
  Team,
  Namespace,
  ProductSet,
  ServiceArea,
  CustomComponentView,
  GithubRepoRequest,
  GithubTeam,
  ScheduledJob,
  TrivyScan,
  Environment,
  SingleResponse,
  Unwrapped,
} from './strapiApiTypes'
import { unwrapListResponse, unwrapSingleResponse } from '../utils/strapi4Utils'
import type { TrivyScanType } from './converters/modelTypes'
import convertTrivyScan from './converters/trivyScans'

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
  }): Promise<Unwrapped<Product>[]> {
    const populate = ['product_set']

    if (withComponents) {
      populate.push('components')
    }

    if (withEnvironments) {
      populate.push('components.envs')
    }

    return this.restClient
      .get<ListResponse<Product>>({
        path: '/v1/products',
        query: `${new URLSearchParams({ populate: populate.join(',') }).toString()}`,
      })
      .then(unwrapListResponse)
  }

  async getProduct({
    productSlug = '',
    productId = 0,
    withEnvironments = false,
  }: {
    productSlug?: string
    productId?: number
    withEnvironments?: boolean
  }): Promise<Unwrapped<Product>> {
    const populateList = ['product_set', 'team', 'components', 'service_area']

    if (withEnvironments) {
      populateList.push('components.envs')
    }

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = productSlug ? `filters[slug][$eq]=${productSlug}&${populate}` : populate
    const path = productSlug ? '/v1/products' : `/v1/products/${productId}`

    return this.restClient.get<SingleResponse<Product>>({ path, query }).then(unwrapSingleResponse)
  }

  async getComponents(
    exemptionFilters: string[] = [],
    includeTeams: boolean = true,
    includeLatestCommit: boolean = false,
  ): Promise<Unwrapped<Component>[]> {
    const populate = new URLSearchParams({
      populate: `product${includeTeams ? '.team' : ''},envs${includeLatestCommit ? ',latest_commit' : ''}`,
    }).toString()
    const filters = exemptionFilters.map((filterValue, index) => {
      return `filters[veracode_exempt][$in][${index}]=${filterValue}`
    })

    return this.restClient
      .get<ListResponse<Component>>({
        path: '/v1/components',
        query: `${populate}&${filters.join('&')}`,
      })
      .then(unwrapListResponse)
  }

  async getComponent({ componentName }: { componentName: string }): Promise<Unwrapped<Component>> {
    const populate = new URLSearchParams({ populate: 'product.team,envs.trivy_scan' }).toString()

    return this.restClient
      .get<SingleResponse<Component>>({
        path: '/v1/components',
        query: `filters[name][$eq]=${componentName}&${populate}`,
      })
      .then(unwrapSingleResponse)
  }

  async getTeams(): Promise<Unwrapped<Team>[]> {
    return this.restClient
      .get<ListResponse<Team>>({
        path: '/v1/teams',
        query: 'populate=products',
      })
      .then(unwrapListResponse)
  }

  async getTeam({
    teamId = 0,
    teamSlug = '',
    withEnvironments = false,
  }: {
    teamId?: number
    teamSlug?: string
    withEnvironments?: boolean
  }): Promise<Unwrapped<Team>> {
    const populateList = ['products']

    if (withEnvironments) {
      populateList.push('products.components.envs')
    }

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = teamSlug ? `filters[slug][$eq]=${teamSlug}&${populate}` : populate
    const path = teamSlug ? '/v1/teams' : `/v1/teams/${teamId}`

    return this.restClient.get<SingleResponse<Team>>({ path, query }).then(unwrapSingleResponse)
  }

  async getNamespaces(): Promise<Unwrapped<Namespace>[]> {
    return this.restClient
      .get<ListResponse<Namespace>>({
        path: '/v1/namespaces',
        query: 'populate=rds_instance,elasticache_cluster,pingdom_check,hmpps_template',
      })
      .then(unwrapListResponse)
  }

  async getNamespace({
    namespaceId = 0,
    namespaceSlug = '',
  }: {
    namespaceId?: number
    namespaceSlug?: string
  }): Promise<Unwrapped<Namespace>> {
    const populateList = ['rds_instance', 'elasticache_cluster', 'pingdom_check', 'hmpps_template']

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = namespaceSlug ? `filters[name][$eq]=${namespaceSlug}&${populate}` : populate
    const path = namespaceSlug ? '/v1/namespaces' : `/v1/namespaces/${namespaceId}`

    return this.restClient
      .get<SingleResponse<Namespace>>({ path, query })
      .then(response => unwrapSingleResponse<Namespace>(response))
  }

  async getProductSets(): Promise<Unwrapped<ProductSet>[]> {
    return this.restClient
      .get<ListResponse<ProductSet>>({
        path: '/v1/product-sets',
        query: 'populate=products',
      })
      .then(unwrapListResponse)
  }

  async getProductSet({ productSetId = 0 }: { productSetId: number }): Promise<Unwrapped<ProductSet>> {
    return this.restClient
      .get<SingleResponse<ProductSet>>({
        path: `/v1/product-sets/${productSetId}`,
        query: new URLSearchParams({ populate: 'products' }).toString(),
      })
      .then(unwrapSingleResponse)
  }

  async getServiceAreas(): Promise<Unwrapped<ServiceArea>[]> {
    return this.restClient
      .get<ListResponse<ServiceArea>>({
        path: '/v1/service-areas',
        query: 'populate=products',
      })
      .then(unwrapListResponse)
  }

  async getServiceArea({
    serviceAreaId = 0,
    serviceAreaSlug = '',
    withProducts = false,
  }: {
    serviceAreaId?: number
    serviceAreaSlug?: string
    withProducts?: boolean
  }): Promise<Unwrapped<ServiceArea>> {
    const populateList = ['products']

    if (withProducts) {
      populateList.push('products.components.envs')
    }

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = serviceAreaSlug ? `filters[slug][$eq]=${serviceAreaSlug}&${populate}` : populate
    const path = serviceAreaSlug ? '/v1/service-areas' : `/v1/service-areas/${serviceAreaId}`

    return this.restClient.get<SingleResponse<ServiceArea>>({ path, query }).then(unwrapSingleResponse)
  }

  async getCustomComponentViews({
    withEnvironments = false,
  }: {
    withEnvironments?: boolean
  }): Promise<Unwrapped<CustomComponentView>[]> {
    const populate = ['components']

    if (withEnvironments) {
      populate.push('components.envs')
    }

    return this.restClient
      .get<ListResponse<CustomComponentView>>({
        path: '/v1/custom-component-views',
        query: new URLSearchParams({
          populate: populate.join(','),
        }).toString(),
      })
      .then(unwrapListResponse)
  }

  async getCustomComponentView({
    customComponentId = 0,
    withEnvironments = false,
  }: {
    customComponentId: number
    withEnvironments?: boolean
  }): Promise<Unwrapped<CustomComponentView>> {
    const populate = ['components', 'components.product']

    if (withEnvironments) {
      populate.push('components.envs')
    }

    return this.restClient
      .get<SingleResponse<CustomComponentView>>({
        path: `/v1/custom-component-views/${customComponentId}`,
        query: new URLSearchParams({
          populate: populate.join(','),
        }).toString(),
      })
      .then(unwrapSingleResponse)
  }

  async getGithubRepoRequests(): Promise<Unwrapped<GithubRepoRequest>[]> {
    return this.restClient
      .get<ListResponse<GithubRepoRequest>>({
        path: '/v1/github-repo-requests',
        query: 'populate=github_repo',
      })
      .then(unwrapListResponse)
  }

  async getGithubRepoRequest({ repoName }: { repoName: string }): Promise<Unwrapped<GithubRepoRequest>> {
    return this.restClient
      .get<SingleResponse<GithubRepoRequest>>({
        path: '/v1/github-repo-requests',
        query: `filters[github_repo][$eq]=${repoName}`,
      })
      .then(response => unwrapSingleResponse<GithubRepoRequest>(response))
  }

  async postGithubRepoRequest(request: GithubRepoRequestRequest): Promise<void> {
    await this.restClient.post<SingleResponse<GithubRepoRequest>>({
      path: '/v1/github-repo-requests',
      data: request,
    })
  }

  async getGithubTeams(): Promise<Unwrapped<GithubTeam>[]> {
    return this.restClient
      .get<ListResponse<GithubTeam>>({
        path: '/v1/github-teams',
      })
      .then(unwrapListResponse)
  }

  async getGithubTeam({ teamName }: { teamName: string }): Promise<Unwrapped<GithubTeam>> {
    return this.restClient
      .get<SingleResponse<GithubTeam>>({
        path: '/v1/github-teams',
        query: `filters[team_name][$eq]=${teamName}`,
      })
      .then(unwrapSingleResponse)
  }

  async getGithubSubTeams({ parentTeamName }: { parentTeamName: string }): Promise<Unwrapped<GithubTeam>[]> {
    return this.restClient
      .get<ListResponse<GithubTeam>>({
        path: '/v1/github-teams',
        query: `filters[parent_team_name][$eq]=${parentTeamName}`,
      })
      .then(unwrapListResponse)
  }

  async getScheduledJobs(): Promise<Unwrapped<ScheduledJob>[]> {
    return this.restClient
      .get<ListResponse<ScheduledJob>>({
        path: '/v1/scheduled-jobs',
      })
      .then(unwrapListResponse)
  }

  async getScheduledJob({ name }: { name: string }): Promise<Unwrapped<ScheduledJob>> {
    return this.restClient
      .get<SingleResponse<ScheduledJob>>({
        path: '/v1/scheduled-jobs',
        query: `filters[name][$eq]=${name}`,
      })
      .then(response => unwrapSingleResponse<ScheduledJob>(response))
  }

  async getTrivyScans(): Promise<TrivyScanType[]> {
    const results = await this.restClient.get<ListResponse<TrivyScan>>({
      path: '/v1/trivy-scans',
    })
    return results.data.map(convertTrivyScan)
  }

  async getTrivyScan({ name }: { name: string }): Promise<Unwrapped<TrivyScan>> {
    return this.restClient
      .get<SingleResponse<TrivyScan>>({
        path: '/v1/trivy-scans',
        query: `filters[name][$eq]=${name}`,
      })
      .then(unwrapSingleResponse)
  }

  async getEnvironments() {
    return this.restClient.get<ListResponse<Environment>>({
      path: '/v1/environments',
      query: 'populate=component',
    })
  }
}
