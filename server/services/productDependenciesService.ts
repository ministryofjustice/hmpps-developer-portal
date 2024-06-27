import type { StrapiApiClient, RestClientBuilder } from '../data'
import { formatMonitorName } from '../utils/utils'
import type RedisService from './redisService'

type ProductReference = {
  productCode: string
  productName: string
  componentNames: string[]
}

export type ProductDependencies = {
  productName: string
  productCode: string
  componentNames: string[]
  dependencies: ProductReference[]
  dependents: ProductReference[]
}

export default class ServiceCatalogueService {
  constructor(
    private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>,
    private readonly redisService: RedisService,
  ) {}

  async getProducts(): Promise<ProductDependencies[]> {
    const products = (await this.strapiApiClientFactory('').getProducts({ withComponents: true })).data
      .filter(product => product.attributes.components?.data.length)
      .map(product => ({
        productName: product.attributes.name,
        productCode: formatMonitorName(product.attributes.name),
        componentNames: product.attributes.components.data.map(components => components.attributes.name),
      }))

    const componentToProduct = Object.fromEntries(
      products.flatMap(product => product.componentNames.map(component => [component, product])),
    )

    const allDependencies = await this.redisService.getAllDependencies()

    return products.map(product => {
      const productDependencies = allDependencies.getDependenciesForComponents(product.componentNames)
      const dependencies = this.getProductsToComponents(
        product.productCode,
        productDependencies.dependencies,
        componentToProduct,
      )
      const dependents = this.getProductsToComponents(
        product.productCode,
        productDependencies.dependents,
        componentToProduct,
      )
      return { ...product, dependencies, dependents }
    })
  }

  async getComponentsWithUnknownProducts(): Promise<string[]> {
    const products = (await this.strapiApiClientFactory('').getProducts({ withComponents: true })).data
      .filter(product => product.attributes.components?.data.length)
      .map(product => ({
        productName: product.attributes.name,
        productCode: formatMonitorName(product.attributes.name),
        componentNames: product.attributes.components.data.map(components => components.attributes.name),
      }))

    const componentToProduct = Object.fromEntries(
      products.flatMap(product => product.componentNames.map(component => [component, product])),
    )

    const allDependencies = await this.redisService.getAllDependencies()

    const componentNames = products.flatMap(product => {
      const productDependencies = allDependencies.getDependenciesForComponents(product.componentNames)
      const dependencies = this.getProductsToComponents(
        product.productCode,
        productDependencies.dependencies,
        componentToProduct,
      )
      const dependents = this.getProductsToComponents(
        product.productCode,
        productDependencies.dependents,
        componentToProduct,
      )
      return [...dependents, ...dependencies].filter(p => p.productCode === 'UNKNOWN').flatMap(p => p.componentNames)
    })
    return Array.from(new Set(componentNames)).sort()
  }

  async getHostNamesMissingComponents(): Promise<string[]> {
    const allDependencies = await this.redisService.getAllDependencies()
    return Array.from(new Set(allDependencies.getAllUnknownHosts())).sort()
  }

  private getProductsToComponents(
    owningProductCode: string,
    components: Record<string, boolean>,
    componentToProduct: { [component: string]: ProductReference },
  ): ProductReference[] {
    return Object.entries(components)
      .filter(([, known]) => known)
      .map(([component]) => ({ component, product: componentToProduct[component] }))
      .reduce((acc, i) => {
        const productCode = i.product?.productCode || 'UNKNOWN'
        if (owningProductCode === productCode) {
          // prevent loops
          return acc
        }

        const productName = i.product?.productName || 'Unknown'
        const reference = acc.find(product => product.productCode === productCode)
        if (!reference) {
          acc.push({
            productCode,
            productName,
            componentNames: [i.component],
          })
        } else {
          reference.componentNames.push(i.component)
        }

        return acc
      }, [] as ProductReference[])
  }
}
