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
} from './strapiApiTypes'

export default class StrapiApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient('strapiApiClient', config.apis.serviceCatalogue as ApiConfig, '')
  }

  async getProducts(): Promise<ProductListResponse> {
    return this.restClient.get({
      path: '/v1/products',
    })
  }

  async getProduct(productId: string): Promise<ProductResponse> {
    return this.restClient.get({
      path: `/v1/products/${productId}`,
    })
  }

  async getComponents(): Promise<ComponentListResponse> {
    return this.restClient.get({
      path: '/v1/components',
    })
  }

  async getComponent(componentId: string): Promise<ComponentResponse> {
    return this.restClient.get({
      path: `/v1/components/${componentId}`,
    })
  }

  async getTeams(): Promise<TeamListResponse> {
    return this.restClient.get({
      path: '/v1/teams',
    })
  }

  async getTeam(teamId: string): Promise<TeamResponse> {
    return this.restClient.get({
      path: `/v1/teams/${teamId}`,
    })
  }

  async getProductSets(): Promise<ProductSetListResponse> {
    return this.restClient.get({
      path: '/v1/product-sets',
    })
  }

  async getServiceAreas(): Promise<ServiceAreaListResponse> {
    return this.restClient.get({
      path: '/v1/service-areas',
    })
  }
}
