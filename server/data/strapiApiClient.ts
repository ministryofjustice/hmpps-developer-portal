import { URLSearchParams } from 'url'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ProductResponse,
  TeamResponse,
  ComponentResponse,
  ServiceAreaResponse,
  ProductSetResponse,
  CustomComponentResponse,
  GithubRepoRequestResponse,
  GithubRepoRequestRequest,
  GithubTeamResponse,
  ListResponse,
  ProductListResponseDataItem,
  ComponentListResponseDataItem,
  NamespaceListResponseDataItem,
  ProductSetListResponseDataItem,
  ServiceAreaListResponseDataItem,
  CustomComponentListResponseDataItem,
  GithubRepoRequestListResponseDataItem,
  GithubTeamListResponseDataItem,
  TeamListResponseDataItem,
  ScheduledJobListResponseDataItem,
  ScheduledJobResponse,
  Environment,
} from './strapiApiTypes'
import { convertServiceArea } from './converters/serviceArea'
import type { ServiceArea } from './converters/modelTypes'

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
  }): Promise<ListResponse<ProductListResponseDataItem>> {
    const populate = ['product_set']

    if (withComponents) {
      populate.push('components')
    }

    if (withEnvironments) {
      populate.push('components.environments')
    }

    return this.restClient.get({
      path: '/v1/products',
      query: `${new URLSearchParams({ populate: populate.join(',') }).toString()}`,
    })
  }

  async getProduct({
    productSlug = '',
    productId = 0,
    withEnvironments = false,
  }: {
    productSlug?: string
    productId?: number
    withEnvironments?: boolean
  }): Promise<ProductResponse> {
    const populateList = ['product_set', 'team', 'components', 'service_area']

    if (withEnvironments) {
      populateList.push('components.environments')
    }

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = productSlug ? `filters[slug][$eq]=${productSlug}&${populate}` : populate
    const path = productSlug ? '/v1/products' : `/v1/products/${productId}`

    return this.restClient.get({ path, query })
  }

  async getComponents(
    exemptionFilters: string[] = [],
    includeTeams: boolean = true,
    includeLatestCommit: boolean = false,
  ): Promise<ListResponse<ComponentListResponseDataItem>> {
    const populate = new URLSearchParams({
      populate: `product${includeTeams ? '.team' : ''},environments${includeLatestCommit ? ',latest_commit' : ''}`,
    }).toString()
    const filters = exemptionFilters.map((filterValue, index) => {
      return `filters[veracode_exempt][$in][${index}]=${filterValue}`
    })

    return this.restClient.get({
      path: '/v1/components',
      query: `${populate}&${filters.join('&')}`,
    })
  }

  async getComponent({ componentName }: { componentName: string }): Promise<ComponentResponse> {
    const populate = new URLSearchParams({ populate: 'product.team,environments' }).toString()

    return this.restClient.get({
      path: '/v1/components',
      query: `filters[name][$eq]=${componentName}&${populate}`,
    })
  }

  async getTeams(): Promise<ListResponse<TeamListResponseDataItem>> {
    return this.restClient.get({
      path: '/v1/teams',
      query: 'populate=products',
    })
  }

  async getTeam({
    teamId = 0,
    teamSlug = '',
    withEnvironments = false,
  }: {
    teamId?: number
    teamSlug?: string
    withEnvironments?: boolean
  }): Promise<TeamResponse> {
    const populateList = ['products']

    if (withEnvironments) {
      populateList.push('products.components.environments')
    }

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = teamSlug ? `filters[slug][$eq]=${teamSlug}&${populate}` : populate
    const path = teamSlug ? '/v1/teams' : `/v1/teams/${teamId}`

    return this.restClient.get({ path, query })
  }

  async getNamespaces(): Promise<ListResponse<NamespaceListResponseDataItem>> {
    return this.restClient.get({
      path: '/v1/namespaces',
      query: 'populate=rds_instance,elasticache_cluster',
    })
  }

  async getNamespace({
    namespaceId = 0,
    namespaceSlug = '',
  }: {
    namespaceId?: number
    namespaceSlug?: string
  }): Promise<TeamResponse> {
    const populateList = ['rds_instance']

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = namespaceSlug ? `filters[name][$eq]=${namespaceSlug}&${populate}` : populate
    const path = namespaceSlug ? '/v1/namespaces' : `/v1/namespaces/${namespaceId}`

    return this.restClient.get({ path, query })
  }

  async getProductSets(): Promise<ListResponse<ProductSetListResponseDataItem>> {
    return this.restClient.get({
      path: '/v1/product-sets',
      query: 'populate=products',
    })
  }

  async getProductSet({ productSetId = 0 }: { productSetId: number }): Promise<ProductSetResponse> {
    return this.restClient.get({
      path: `/v1/product-sets/${productSetId}`,
      query: new URLSearchParams({ populate: 'products' }).toString(),
    })
  }

  async getServiceAreas(): Promise<ServiceArea[]> {
    const results = await this.restClient.get<ListResponse<ServiceAreaListResponseDataItem>>({
      path: '/v1/service-areas',
      query: 'populate=products',
    })

    return results.data.map(convertServiceArea)
  }

  async getServiceArea({
    serviceAreaId = 0,
    serviceAreaSlug = '',
    withProducts = false,
  }: {
    serviceAreaId?: number
    serviceAreaSlug?: string
    withProducts?: boolean
  }): Promise<ServiceAreaResponse> {
    const populateList = ['products']

    if (withProducts) {
      populateList.push('products.components.environments')
    }

    const populate = new URLSearchParams({ populate: populateList }).toString()
    const query = serviceAreaSlug ? `filters[slug][$eq]=${serviceAreaSlug}&${populate}` : populate
    const path = serviceAreaSlug ? '/v1/service-areas' : `/v1/service-areas/${serviceAreaId}`

    return this.restClient.get({ path, query })
  }

  async getCustomComponentViews({
    withEnvironments = false,
  }: {
    withEnvironments?: boolean
  }): Promise<ListResponse<CustomComponentListResponseDataItem>> {
    const populate = ['components']

    if (withEnvironments) {
      populate.push('components.environments')
    }

    return this.restClient.get({
      path: '/v1/custom-component-views',
      query: new URLSearchParams({
        populate: populate.join(','),
      }).toString(),
    })
  }

  async getCustomComponentView({
    customComponentId = 0,
    withEnvironments = false,
  }: {
    customComponentId: number
    withEnvironments?: boolean
  }): Promise<CustomComponentResponse> {
    const populate = ['components', 'components.product']

    if (withEnvironments) {
      populate.push('components.environments')
    }

    return this.restClient.get({
      path: `/v1/custom-component-views/${customComponentId}`,
      query: new URLSearchParams({
        populate: populate.join(','),
      }).toString(),
    })
  }

  async getGithubRepoRequests(): Promise<ListResponse<GithubRepoRequestListResponseDataItem>> {
    return this.restClient.get({
      path: '/v1/github-repo-requests',
      query: 'populate=github_repo',
    })
  }

  async getGithubRepoRequest({ repoName }: { repoName: string }): Promise<GithubRepoRequestResponse> {
    return this.restClient.get({
      path: '/v1/github-repo-requests',
      query: `filters[github_repo][$eq]=${repoName}`,
    })
  }

  async postGithubRepoRequest(request: GithubRepoRequestRequest): Promise<GithubRepoRequestResponse> {
    return this.restClient.post({
      path: '/v1/github-repo-requests',
      data: request,
    })
  }

  async getGithubTeams(): Promise<ListResponse<GithubTeamListResponseDataItem>> {
    return this.restClient.get({
      path: '/v1/github-teams',
    })
  }

  async getGithubTeam({ teamName }: { teamName: string }): Promise<GithubTeamResponse> {
    return this.restClient.get({
      path: '/v1/github-teams',
      query: `filters[team_name][$eq]=${teamName}`,
    })
  }

  async getScheduledJobs(): Promise<ListResponse<ScheduledJobListResponseDataItem>> {
    return this.restClient.get({
      path: '/v1/scheduled-jobs',
    })
  }

  async getSchuledJobs({ name }: { name: string }): Promise<ScheduledJobResponse> {
    return this.restClient.get({
      path: '/v1/scheduled-jobs',
      query: `filters[name][$eq]=${name}`,
    })
  }

  async getEnvironments() {
    return this.restClient.get<ListResponse<Environment>>({
      path: '/v1/environments',
      query: 'populate=component',
    })
  }
}
