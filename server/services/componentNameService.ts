import type { StrapiApiClient, RestClientBuilder } from '../data'
import { Component, DataItem } from '../data/strapiApiTypes'
import { formatMonitorName, sortData, sortByName } from '../utils/utils'

export default class ComponentNameService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getAllDeployedComponents(): Promise<string[]> {
    const componentData = await this.strapiApiClientFactory('').getComponents()

    const rawComponents = componentData.sort(sortByName)

    const components = rawComponents.filter(component => component.envs?.length).map(component => component.name)

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

    const serviceAreaSummary = serviceAreas.find(serviceArea => formatMonitorName(serviceArea.name) === serviceAreaName)

    if (!serviceAreaSummary) throw Error(`No serviceArea called: ${serviceAreaName}`)

    const serviceAreaDetails = await this.strapiApiClientFactory('').getServiceArea({
      serviceAreaId: serviceAreaSummary.id,
      withProducts: true,
    })

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

    const components = productDetails.attributes?.components?.data as unknown as DataItem<Component>[]

    return components
      .filter(component => component.attributes?.environments?.length)
      .sort(sortData)
      .map(component => component.attributes.name)
  }

  async getAllDeployedComponentsForCustomComponents(customComponentName: string): Promise<string[]> {
    const customComponents = await this.strapiApiClientFactory('').getCustomComponentViews({ withEnvironments: true })

    const customComponentDetails = customComponents.data.find(
      customComponentView => formatMonitorName(customComponentView.attributes.name) === customComponentName,
    )

    if (!customComponentDetails) throw Error(`No custom component called: ${customComponentName}`)

    const components = customComponentDetails.attributes?.components?.data as unknown as DataItem<Component>[]

    return components
      .filter(component => component.attributes?.environments?.length)
      .sort(sortData)
      .map(component => component.attributes.name)
  }

  async checkComponentExists(componentName: string): Promise<boolean> {
    const componentData = await this.strapiApiClientFactory('').getComponents()
    const components = componentData.find(component => formatMonitorName(component.name) === componentName)
    return !!components
  }

  async checkComponentRequestExists(repositoryName: string): Promise<boolean> {
    const componentData = await this.strapiApiClientFactory('').getGithubRepoRequests()
    const components = componentData.find(repoName => formatMonitorName(repoName.github_repo) === repositoryName)
    return !!components
  }
}
