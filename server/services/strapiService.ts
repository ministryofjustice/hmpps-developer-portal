import type { StrapiApiClient, RestClientBuilder } from '../data'
import { Product } from '../data/strapiApiTypes'

export default class StrapiService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts(): Promise<Product[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts()

    const products = productData.data.map(product => product.attributes)

    return products
  }
}
