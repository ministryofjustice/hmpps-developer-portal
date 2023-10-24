import type { StrapiApiClient, RestClientBuilder } from '../data'
import {
  Product,
  Component,
  Team,
  ProductSet,
  ServiceArea,
  ProductListResponseDataItem,
  TeamListResponseDataItem,
  ComponentListResponseDataItem,
  ServiceAreaListResponseDataItem,
  ProductSetListResponseDataItem,
  ComponentListResponse,
} from '../data/strapiApiTypes'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts({
    productIds = [],
    withEnvironments = false,
  }: {
    productIds?: number[]
    withEnvironments?: boolean
  }): Promise<ProductListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts({ productIds, withEnvironments })

    const products = productData.data.sort(sortData)

    return products
  }

  async getComponents(): Promise<ComponentListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents()

    const components = componentData.data.sort(sortData)

    return components
  }

  async getDependencies(): Promise<string[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = (await strapiApiClient.getComponents()) as ComponentListResponse
    const components = componentData.data.sort(sortData)
    const dependencies: string[] = []

    components
      .filter(component => component.attributes.versions)
      .forEach(component => {
        if (component.attributes.versions.helm) {
          Object.keys(component.attributes.versions.helm.dependencies).forEach(dependency => {
            if (!dependencies.includes(`helm::${dependency}`)) {
              dependencies.push(`helm::${dependency}`)
            }
          })
        }
        if (component.attributes.versions.circleci) {
          Object.keys(component.attributes.versions.circleci.orbs).forEach(orb => {
            if (!dependencies.includes(`circleci::${orb}`)) {
              dependencies.push(`circleci::${orb}`)
            }
          })
        }
        if (component.attributes.versions.dockerfile) {
          Object.keys(component.attributes.versions.dockerfile).forEach(dockerfile => {
            if (!dependencies.includes(`dockerfile::${dockerfile}`)) {
              dependencies.push(`dockerfile::${dockerfile}`)
            }
          })
        }
      })

    return dependencies.sort()
  }

  async getTeams(expandProperties?: { products: boolean }): Promise<TeamListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeams(expandProperties)

    const teams = teamData.data.sort(sortData)

    return teams
  }

  async getProductSets(): Promise<ProductSetListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSets()

    const productSets = productSetData.data.sort(sortData)

    return productSets
  }

  async getServiceAreas(expandProperties?: { products: boolean }): Promise<ServiceAreaListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceAreas(expandProperties)

    const serviceAreas = serviceAreaData.data.sort(sortData)

    return serviceAreas
  }

  async getProduct({
    productId = '',
    withEnvironments = false,
  }: {
    productId: string
    withEnvironments?: boolean
  }): Promise<Product> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProduct({ productId, withEnvironments })

    const product = productData.data?.attributes

    return product
  }

  async getTeam({
    teamId = '',
    withEnvironments = false,
  }: {
    teamId: string
    withEnvironments?: boolean
  }): Promise<Team> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeam({ teamId, withEnvironments })

    const team = teamData.data?.attributes

    return team
  }

  async getComponent(componentName: string): Promise<Component> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponent(componentName)

    const component = componentData.data[0].attributes

    return component
  }

  async getServiceArea(serviceAreaId: string, withProducts?: boolean): Promise<ServiceArea> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceArea(serviceAreaId, withProducts)

    const serviceArea = serviceAreaData.data?.attributes

    return serviceArea
  }

  async getProductSet(productSetId: string): Promise<ProductSet> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSet(productSetId)

    const productSet = productSetData.data?.attributes

    return productSet
  }
}

const sortData = (
  dataItem:
    | ProductListResponseDataItem
    | TeamListResponseDataItem
    | ComponentListResponseDataItem
    | ServiceAreaListResponseDataItem
    | ProductSetListResponseDataItem,
  compareDataItem:
    | ProductListResponseDataItem
    | TeamListResponseDataItem
    | ComponentListResponseDataItem
    | ServiceAreaListResponseDataItem
    | ProductSetListResponseDataItem,
) => {
  if (dataItem.attributes.name < compareDataItem.attributes.name) {
    return -1
  }
  if (dataItem.attributes.name > compareDataItem.attributes.name) {
    return 1
  }

  return 0
}
