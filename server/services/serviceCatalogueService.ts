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
} from '../data/strapiApiTypes'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts(): Promise<ProductListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts()

    const products = productData.data.sort(sortData)

    return products
  }

  async getComponents(): Promise<ComponentListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents()

    const components = componentData.data.sort(sortData)

    return components
  }

  async getTeams(): Promise<TeamListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeams()

    const teams = teamData.data.sort(sortData)

    return teams
  }

  async getProductSets(): Promise<ProductSetListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSets()

    const productSets = productSetData.data.sort(sortData)

    return productSets
  }

  async getServiceAreas(): Promise<ServiceAreaListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceAreas()

    const serviceAreas = serviceAreaData.data.sort(sortData)

    return serviceAreas
  }

  async getProduct(productId: string): Promise<Product> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProduct(productId)

    const product = productData.data?.attributes

    return product
  }

  async getTeam(teamId: string): Promise<Team> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeam(teamId)

    const team = teamData.data?.attributes

    return team
  }

  async getComponent(componentId: string): Promise<Component> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponent(componentId)

    const component = componentData.data?.attributes

    return component
  }

  async getServiceArea(serviceAreaId: string): Promise<ServiceArea> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceArea(serviceAreaId)

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
