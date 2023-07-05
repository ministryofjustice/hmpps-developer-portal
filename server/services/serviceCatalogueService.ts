import type { StrapiApiClient, RestClientBuilder } from '../data'
import { Product } from '../data/strapiApiTypes'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts(): Promise<Product[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts()

    const products = productData.data
      .map(product => product.attributes)
      .sort((product, compareProduct) => {
        if (product.name < compareProduct.name) {
          return -1
        }
        if (product.name > compareProduct.name) {
          return 1
        }

        return 0
      })

    return products
  }
}
