import type { StrapiApiClient, RestClientBuilder } from '../data'
import { ComponentListResponseDataItem } from '../data/strapiApiTypes'
import { formatMonitorName, sortData } from '../utils/utils'

export default class ComponentNameService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getAllDeployedComponents(): Promise<string[]> {
    const componentData = await this.strapiApiClientFactory('').getComponents()

    const rawComponents = componentData.data.sort(sortData)

    const components = rawComponents
      .filter(component => component.attributes?.environments?.length)
      .map(component => component.attributes.name)

    return components
  }

  async getAllDeployedComponentsForTeam(teamName: string): Promise<string[]> {
    const teams = await this.strapiApiClientFactory('').getTeams()

    const teamSummary = teams.data.find(team => formatMonitorName(team.attributes.name) === teamName)

    if (!teamSummary) throw Error(`No team called: ${teamName}`)

    const teamDetails = await this.strapiApiClientFactory('').getTeam({
      teamId: teamSummary.id,
      withEnvironments: true,
    })

    return teamDetails.data.attributes.products.data.flatMap(product =>
      product.attributes?.components?.data
        .filter(component => component.attributes?.environments?.length)
        .sort(sortData)
        .map(component => component.attributes.name),
    )
  }

  async getAllDeployedComponentsForServiceArea(serviceAreaName: string): Promise<string[]> {
    const serviceAreas = await this.strapiApiClientFactory('').getServiceAreas()

    const serviceAreaSummary = serviceAreas.data.find(
      serviceArea => formatMonitorName(serviceArea.attributes.name) === serviceAreaName,
    )

    if (!serviceAreaSummary) throw Error(`No serviceArea called: ${serviceAreaName}`)

    const serviceAreaDetails = await this.strapiApiClientFactory('').getServiceArea(serviceAreaSummary.id, true)

    return serviceAreaDetails.data.attributes.products.data.flatMap(product =>
      product.attributes?.components?.data
        .filter(component => component.attributes?.environments?.length)
        .sort(sortData)
        .map(component => component.attributes.name),
    )
  }

  async getAllDeployedComponentsForProduct(productName: string): Promise<string[]> {
    const products = await this.strapiApiClientFactory('').getProducts({ withEnvironments: true })

    const productDetails = products.data.find(product => formatMonitorName(product.attributes.name) === productName)

    if (!productDetails) throw Error(`No product called: ${productName}`)

    const components = productDetails.attributes?.components?.data as unknown as ComponentListResponseDataItem[]

    return components
      .filter(component => component.attributes?.environments?.length)
      .sort(sortData)
      .map(component => component.attributes.name)
  }

  async getAllDeployedComponentsForCustomComponents(customComponentName: string): Promise<string[]> {
    const customComponents = await this.strapiApiClientFactory('').getCustomComponents(true)

    const customComponentDetails = customComponents.data.find(
      customComponentView => formatMonitorName(customComponentView.attributes.name) === customComponentName,
    )

    if (!customComponentDetails) throw Error(`No custom component called: ${customComponentName}`)

    const components = customComponentDetails.attributes?.components?.data as unknown as ComponentListResponseDataItem[]

    return components
      .filter(component => component.attributes?.environments?.length)
      .sort(sortData)
      .map(component => component.attributes.name)
  }
}
