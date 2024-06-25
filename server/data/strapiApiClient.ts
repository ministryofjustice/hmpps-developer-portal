import { URLSearchParams } from 'url'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import {
  ProductListResponse,
  ComponentListResponse,
  TeamListResponse,
  ProductSetListResponse,
  ServiceAreaListResponse,
  ProductResponse,
  TeamResponse,
  ComponentResponse,
  ServiceAreaResponse,
  ProductSetResponse,
  CustomComponentListResponse,
  CustomComponentResponse,
} from './strapiApiTypes'

export default class StrapiApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient('strapiApiClient', config.apis.serviceCatalogue as ApiConfig, '')
  }

  async getProducts({
    withEnvironments = false,
    withComponents = false,
  }: {
    withEnvironments?: boolean
    withComponents?: boolean
  }): Promise<ProductListResponse> {
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
    productId = 0,
    withEnvironments = false,
  }: {
    productId: number
    withEnvironments?: boolean
  }): Promise<ProductResponse> {
    const populate = ['product_set', 'team', 'components', 'service_area']

    if (withEnvironments) {
      populate.push('components.environments')
    }

    return this.restClient.get({
      path: `/v1/products/${productId}`,
      query: new URLSearchParams({ populate: populate.join(',') }).toString(),
    })
  }

  async getComponents(exemptionFilters: string[] = []): Promise<ComponentListResponse> {
    const populate = new URLSearchParams({ populate: 'product,environments' }).toString()
    const filters = exemptionFilters.map((filterValue, index) => {
      return `filters[veracode_exempt][$in][${index}]=${filterValue}`
    })

    return this.restClient.get({
      path: '/v1/components',
      query: `${populate}&${filters.join('&')}`,
    })
  }

  async getComponent({ componentName }: { componentName: string }): Promise<ComponentResponse> {
    const populate = new URLSearchParams({ populate: 'product,environments' }).toString()

    return this.restClient.get({
      path: '/v1/components',
      query: `filters[name][$eq]=${componentName}&${populate}`,
    })
  }

  async getTeams(): Promise<TeamListResponse> {
    return this.restClient.get({
      path: '/v1/teams',
      query: '',
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

  async getProductSets(): Promise<ProductSetListResponse> {
    return this.restClient.get({
      path: '/v1/product-sets',
    })
  }

  async getProductSet({ productSetId = 0 }: { productSetId: number }): Promise<ProductSetResponse> {
    return this.restClient.get({
      path: `/v1/product-sets/${productSetId}`,
      query: new URLSearchParams({ populate: 'products' }).toString(),
    })
  }

  async getServiceAreas(): Promise<ServiceAreaListResponse> {
    return this.restClient.get({
      path: '/v1/service-areas',
      query: '',
    })
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
  }): Promise<CustomComponentListResponse> {
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
}
