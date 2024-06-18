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
  CustomComponentView,
} from '../data/strapiApiTypes'
import { sortData } from '../utils/utils'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts({
    withEnvironments = false,
  }: {
    withEnvironments?: boolean
  }): Promise<ProductListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts({ withEnvironments })

    const products = productData.data.sort(sortData)

    return products
  }

  async getComponents(exemptionFilters: string[] = []): Promise<ComponentListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents(exemptionFilters)

    const components = componentData.data.sort(sortData)

    return components
  }

  async getDependencies(): Promise<string[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = (await strapiApiClient.getComponents()) as ComponentListResponse
    const components = componentData.data.sort(sortData)
    let dependencies: string[] = []

    components
      .filter(component => component.attributes.versions)
      .forEach(component => {
        if (component.attributes.versions) {
          Object.keys(component.attributes.versions).forEach(versionType => {
            Object.keys(component.attributes.versions[versionType]).forEach(dependency => {
              dependencies = [...new Set([...dependencies, `${versionType}::${dependency}`])]
            })
          })
        }
      })

    return dependencies.sort()
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

  async getProduct({
    productId = 0,
    withEnvironments = false,
  }: {
    productId: number
    withEnvironments?: boolean
  }): Promise<Product> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProduct({ productId, withEnvironments })

    const product = productData.data?.attributes

    return product
  }

  async getTeam({
    teamId = 0,
    withEnvironments = false,
  }: {
    teamId: number
    withEnvironments?: boolean
  }): Promise<Team> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeam({ teamId, withEnvironments })

    const team = teamData.data?.attributes

    return team
  }

  async getComponent({ componentName }: { componentName: string }): Promise<Component> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentItem = await strapiApiClient.getComponent({ componentName })
    const componentData = componentItem.data as ComponentListResponseDataItem[]

    const component = componentData.length > 0 ? componentItem.data[0]?.attributes : {}

    return component
  }

  async getServiceArea({
    serviceAreaId = 0,
    serviceAreaSlug = '',
    withProducts = false,
  }: {
    serviceAreaId?: number
    serviceAreaSlug?: string
    withProducts?: boolean
  }): Promise<ServiceArea> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceArea({ serviceAreaId, serviceAreaSlug, withProducts })

    const serviceArea = serviceAreaSlug ? serviceAreaData.data[0].attributes : serviceAreaData.data?.attributes

    return serviceArea
  }

  async getProductSet({ productSetId = 0 }: { productSetId: number }): Promise<ProductSet> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSet({ productSetId })

    const productSet = productSetData.data?.attributes

    return productSet
  }

  async getCustomComponentView({
    customComponentId = 0,
    withEnvironments = false,
  }: {
    customComponentId: number
    withEnvironments?: boolean
  }): Promise<CustomComponentView> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const customComponentData = await strapiApiClient.getCustomComponentView({ customComponentId, withEnvironments })

    const customComponentView = customComponentData.data?.attributes

    return customComponentView
  }
}
