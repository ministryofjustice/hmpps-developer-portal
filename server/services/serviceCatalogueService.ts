import type { StrapiApiClient, RestClientBuilder } from '../data'
import { Product, Component, Team, ProductSet, ServiceArea, ProductListResponseDataItem } from '../data/strapiApiTypes'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts(): Promise<ProductListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts()

    const products = productData.data.sort(sortData)

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

  async getTeams(): Promise<Team[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeams()

    const teams = teamData.data
      .map(team => team.attributes)
      .sort((team, compareTeam) => {
        if (team.name < compareTeam.name) {
          return -1
        }
        if (team.name > compareTeam.name) {
          return 1
        }

        return 0
      })

    return teams
  }

  async getProductSets(): Promise<ProductSet[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSets()

    const productSets = productSetData.data
      .map(productSet => productSet.attributes)
      .sort((productSet, compareProductSet) => {
        if (productSet.name < compareProductSet.name) {
          return -1
        }
        if (productSet.name > compareProductSet.name) {
          return 1
        }

        return 0
      })

    return productSets
  }

  async getServiceAreas(): Promise<ServiceArea[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceAreas()

    const serviceAreas = serviceAreaData.data
      .map(serviceArea => serviceArea.attributes)
      .sort((serviceArea, compareServiceArea) => {
        if (serviceArea.name < compareServiceArea.name) {
          return -1
        }
        if (serviceArea.name > compareServiceArea.name) {
          return 1
        }

        return 0
      })

    return serviceAreas
  }

  async getProduct(productId: string): Promise<Product> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProduct(productId)

    const product = productData.data?.attributes

    return product
  }
}

const sortData = (dataItem: ProductListResponseDataItem, compareDataItem: ProductListResponseDataItem) => {
  if (dataItem.attributes.name < compareDataItem.attributes.name) {
    return -1
  }
  if (dataItem.attributes.name > compareDataItem.attributes.name) {
    return 1
  }

  return 0
}
