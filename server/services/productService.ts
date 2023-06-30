import { ApiClient, RestClientBuilder } from '../data'
import { Product } from '../data/strapiApiTypes'

export default class ProductService {
  constructor(private readonly apiClientFactory: RestClientBuilder<ApiClient>) {}

  async getProducts(): Promise<Product[]> {
    const apiClient = this.apiClientFactory('')
    const productData = await apiClient.getProducts()

    const products = productData.data.map(product => product.attributes)

    return products
  }
}
