import type { StrapiApiClient, RestClientBuilder } from '../data'
import { Product, Component } from '../data/strapiApiTypes'

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

  async getComponents(): Promise<Component[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents()

    const components = componentData.data
      .map(component => component.attributes)
      .sort((component, compareComponent) => {
        if (component.name < compareComponent.name) {
          return -1
        }
        if (component.name > compareComponent.name) {
          return 1
        }

        return 0
      })

    return components
  }
}
