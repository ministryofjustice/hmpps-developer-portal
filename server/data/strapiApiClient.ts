import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { ProductListResponse } from './strapiApiTypes'

export default class StrapiApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient('apiClient', config.apis.strapi.products as ApiConfig, '')
  }

  async getProducts(): Promise<ProductListResponse> {
    return this.restClient.get({
      path: '/products',
    })
  }
}