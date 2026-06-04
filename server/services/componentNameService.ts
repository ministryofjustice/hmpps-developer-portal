import type { StrapiApiClient } from '../data'
import { formatMonitorName, sortByName } from '../utils/utils'

export default class ComponentNameService {
  constructor(private readonly strapiApiClient: StrapiApiClient) {}

  async getAllDeployedComponents(): Promise<string[]> {
    const componentData = await this.strapiApiClient.getComponents()

    const rawComponents = componentData.sort(sortByName)

    const components = rawComponents
      .filter(component => component.envs?.length && !component.archived)
      .map(component => component.name)

    return components
  }

  async getAllDeployedComponentsForTeam(teamName: string): Promise<string[]> {
    const teams = await this.strapiApiClient.getTeams({})

    const teamSummary = teams.find(team => formatMonitorName(team.name) === teamName)

    if (!teamSummary) throw Error(`No team called: ${teamName}`)

    const teamDetails = await this.strapiApiClient.getTeam({
      teamDocumentId: teamSummary.documentId,
      withEnvironments: true,
    })

    const componentNames = teamDetails.products
      .filter(product => product?.components)
      .sort(sortByName)
      .flatMap(product =>
        product.components
          .filter(component => component.envs?.length > 0) // Ensure only components with envs are included
          .map(component => component.name),
      )
    return componentNames
  }

  async getAllDeployedComponentsForServiceArea(serviceAreaName: string): Promise<string[]> {
    const serviceAreas = await this.strapiApiClient.getServiceAreas({})

    const serviceAreaSummary = serviceAreas.find(serviceArea => formatMonitorName(serviceArea.name) === serviceAreaName)

    if (!serviceAreaSummary) throw Error(`No serviceArea called: ${serviceAreaName}`)

    const serviceAreaDetails = await this.strapiApiClient.getServiceArea({
      serviceAreaDocumentId: serviceAreaSummary.documentId,
      withProducts: true,
    })

    const componentNames = serviceAreaDetails.products
      .filter(product => product?.components)
      .sort(sortByName)
      .flatMap(product =>
        product.components
          .filter(component => component.envs?.length > 0) // Ensure only components with envs are included
          .map(component => component.name),
      )
    return componentNames
  }

  async getAllDeployedComponentsForProduct(productName: string): Promise<string[]> {
    const products = await this.strapiApiClient.getProducts({ withEnvironments: true })

    const productDetails = products.find(product => formatMonitorName(product.name) === productName)

    if (!productDetails) throw Error(`No product called: ${productName}`)

    const componentNames = productDetails.components
      .filter(component => component.envs?.length)
      .sort(sortByName)
      .map(component => component.name)

    return componentNames
  }

  async getAllDeployedComponentsForCustomComponents(customComponentName: string): Promise<string[]> {
    const customComponents = await this.strapiApiClient.getCustomComponentViews({ withEnvironments: true })

    const customComponentDetails = customComponents.find(
      customComponentView => formatMonitorName(customComponentView.name) === customComponentName,
    )

    if (!customComponentDetails) throw Error(`No custom component called: ${customComponentName}`)

    const { components } = customComponentDetails

    return components
      .filter(component => component.envs && component.envs.length > 0)
      .sort(sortByName)
      .map(component => component.name)
  }

  async checkComponentExists(componentName: string): Promise<boolean> {
    const componentData = await this.strapiApiClient.getComponents()
    const components = componentData.find(component => formatMonitorName(component.name) === componentName)
    return !!components
  }

  async checkComponentRequestExists(repositoryName: string, requestType: string): Promise<boolean> {
    const componentData = await this.strapiApiClient.getGithubRepoRequests()
    const components = componentData.find(
      repoName => formatMonitorName(repoName.github_repo) === repositoryName && repoName.request_type === requestType,
    )
    return !!components
  }

  async checkComponentArchiveRequestExists(repositoryName: string): Promise<boolean> {
    const componentData = await this.strapiApiClient.getGithubRepoRequests()
    return componentData.some(
      repoName => formatMonitorName(repoName.github_repo) === repositoryName && repoName.request_type === 'Archive',
    )
  }
}
