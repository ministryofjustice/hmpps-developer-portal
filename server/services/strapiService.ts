import { StrapiApiClient, RestClientBuilder } from '../data'
import { Product } from '../data/strapiApiTypes'

export default class StrapiService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts(): Promise<Product[]> {
    const strapiAClient = this.strapiApiClientFactory('')
    const productData = await strapiAClient.getProducts()

    const products = productData.data.map(product => product.attributes)

    return products
  }
}
