import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { ProductListResponse, ComponentListResponse, TeamListResponse, ProductSetListResponse } from './strapiApiTypes'

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

  async getComponents(): Promise<ComponentListResponse> {
    return this.restClient.get({
      path: '/v1/components',
    })
  }

  async getTeams(): Promise<TeamListResponse> {
    return this.restClient.get({
      path: '/v1/teams',
    })
  }

  async getProductSets(): Promise<ProductSetListResponse> {
    return this.restClient.get({
      path: '/v1/product-sets',
    })
  }
}
