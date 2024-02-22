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
    productIds = [],
    withEnvironments = false,
  }: {
    productIds?: number[]
    withEnvironments?: boolean
  }): Promise<ProductListResponse> {
    const populate = ['product_set']

    if (withEnvironments) {
      populate.push('components')
      populate.push('components.environments')
    }

    const filters = productIds
      ? productIds
          .reduce((filterList, productId, index) => {
            return `filters[id][$in][${index}]=${productId},${filterList}`
          }, '')
          .slice(0, -1)
      : ''

    return this.restClient.get({
      path: '/v1/products',
      query: `${new URLSearchParams({ populate: populate.join(',') }).toString()}&${filters}`,
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

  async getComponents(): Promise<ComponentListResponse> {
    return this.restClient.get({
      path: '/v1/components',
      query: new URLSearchParams({ populate: 'product,environments' }).toString(),
    })
  }

  async getComponent(componentName: string): Promise<ComponentResponse> {
    const populate = new URLSearchParams({ populate: 'product,environments' }).toString()

    return this.restClient.get({
      path: '/v1/components',
      query: `filters[name][$eq]=${componentName}&${populate}`,
    })
  }

  async getTeams(expandProperties?: { products: boolean }): Promise<TeamListResponse> {
    const getParams = {
      path: '/v1/teams',
      query: '',
    }

    if (expandProperties?.products) {
      getParams.query = new URLSearchParams({ populate: 'products' }).toString()
    }

    return this.restClient.get(getParams)
  }

  async getTeam({
    teamId = 0,
    withEnvironments = false,
  }: {
    teamId: number
    withEnvironments?: boolean
  }): Promise<TeamResponse> {
    const populate = ['products']

    if (withEnvironments) {
      populate.push('products.components')
      populate.push('products.components.environments')
    }

    return this.restClient.get({
      path: `/v1/teams/${teamId}`,
      query: new URLSearchParams({
        populate: populate.join(','),
      }).toString(),
    })
  }

  async getProductSets(): Promise<ProductSetListResponse> {
    return this.restClient.get({
      path: '/v1/product-sets',
    })
  }

  async getProductSet(productSetId: number): Promise<ProductSetResponse> {
    return this.restClient.get({
      path: `/v1/product-sets/${productSetId}`,
      query: new URLSearchParams({ populate: 'products' }).toString(),
    })
  }

  async getServiceAreas(expandProperties?: { products: boolean }): Promise<ServiceAreaListResponse> {
    const getParams = {
      path: '/v1/service-areas',
      query: '',
    }

    if (expandProperties?.products) {
      getParams.query = new URLSearchParams({ populate: 'products' }).toString()
    }

    return this.restClient.get(getParams)
  }

  async getServiceArea(serviceAreaId: number, withProducts?: boolean): Promise<ServiceAreaResponse> {
    const populate = ['products']

    if (withProducts) {
      populate.push('products.components')
      populate.push('products.components.environments')
    }

    return this.restClient.get({
      path: `/v1/service-areas/${serviceAreaId}`,
      query: new URLSearchParams({
        populate: populate.join(','),
      }).toString(),
    })
  }

  async getCustomComponents(withProducts?: boolean): Promise<CustomComponentListResponse> {
    const populate = ['components']

    if (withProducts) {
      populate.push('components.environments')
    }

    return this.restClient.get({
      path: '/v1/custom-component-views',
      query: new URLSearchParams({
        populate: populate.join(','),
      }).toString(),
    })
  }

  async getCustomComponent(customComponentId: number, withProducts?: boolean): Promise<CustomComponentResponse> {
    const populate = ['components']

    if (withProducts) {
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
