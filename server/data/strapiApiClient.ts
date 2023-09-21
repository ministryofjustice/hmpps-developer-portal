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
} from './strapiApiTypes'

export default class StrapiApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient('strapiApiClient', config.apis.serviceCatalogue as ApiConfig, '')
  }

  async getProducts(productIds?: number[]): Promise<ProductListResponse> {
    const filters = productIds
      ? productIds.reduce((filterList, productId, index) => {
          return `&${filterList},filters[id][$in][${index}]=${productId}`
        }, '')
      : ''

    return this.restClient.get({
      path: '/v1/products',
      query: `populate=product_set${filters}`,
    })
  }

  async getProduct(productId: string, withEnvironments?: boolean): Promise<ProductResponse> {
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

  async getComponent(componentId: string): Promise<ComponentResponse> {
    return this.restClient.get({
      path: `/v1/components/${componentId}`,
      query: new URLSearchParams({ populate: 'product,environments' }).toString(),
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

  async getTeam(teamId: string, withProducts?: boolean): Promise<TeamResponse> {
    const populate = ['products']

    if (withProducts) {
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

  async getProductSet(productSetId: string): Promise<ProductSetResponse> {
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

  async getServiceArea(serviceAreaId: string, withProducts?: boolean): Promise<ServiceAreaResponse> {
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
}
