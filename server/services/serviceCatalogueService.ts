import { RdsEntry } from '../@types'
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
  NamespaceListResponseDataItem,
  Namespace,
  GithubRepoRequestResponse,
  GithubRepoRequest,
  GithubRepoRequestRequest,
  GithubRepoRequestListResponseDataItem,
  UpdatedGithubTeamRequest,
  UpdateGithubTeamsRequestResponse,
  UpdateGithubTeamsRequestListResponseDataItem,
  UpdateGithubTeamsRequestRequest,
  GithubTeam,
  GithubTeamListResponseDataItem,
} from '../data/strapiApiTypes'
import { sortData, sortRdsInstances, sortComponentRequestData, sortGithubTeamsData } from '../utils/utils'

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

  async getComponents(
    exemptionFilters: string[] = [],
    includeTeams: boolean = true,
    includeLatestCommit: boolean = false,
  ): Promise<ComponentListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents(exemptionFilters, includeTeams, includeLatestCommit)

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
            // @ts-expect-error Suppress any declaration
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

  async getRdsInstances(): Promise<RdsEntry[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const namespaceData = await strapiApiClient.getNamespaces()
    const rdsInstances = namespaceData.data.reduce((existing, namespace) => {
      const instances = namespace.attributes.rds_instance.map(rdsInstance => {
        return {
          tf_label: rdsInstance.tf_label,
          namespace: rdsInstance.namespace,
          db_instance_class: rdsInstance.db_instance_class,
          db_engine_version: rdsInstance.db_engine_version,
          rds_family: rdsInstance.rds_family,
          db_max_allocated_storage: rdsInstance.db_max_allocated_storage,
          allow_major_version_upgrade: rdsInstance.allow_major_version_upgrade,
          allow_minor_version_upgrade: rdsInstance.allow_minor_version_upgrade,
          deletion_protection: rdsInstance.deletion_protection,
          maintenance_window: rdsInstance.maintenance_window,
          performance_insights_enabled: rdsInstance.performance_insights_enabled,
          is_production: rdsInstance.is_production,
          environment_name: rdsInstance.environment_name,
        }
      })

      return existing.concat(instances)
    }, [])

    return Array.from(new Set(rdsInstances.map(rdsInstance => JSON.stringify(rdsInstance))))
      .map(rdsInstance => JSON.parse(rdsInstance))
      .sort(sortRdsInstances)
  }

  async getNamespaces(): Promise<NamespaceListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const namespaceData = await strapiApiClient.getNamespaces()

    const namespaces = namespaceData.data.sort(sortData)

    return namespaces
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
    productSlug = '',
    productId = 0,
    withEnvironments = false,
  }: {
    productSlug?: string
    productId?: number
    withEnvironments?: boolean
  }): Promise<Product> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProduct({ productSlug, productId, withEnvironments })
    // @ts-expect-error Suppress any declaration
    const product = productSlug ? productData.data[0].attributes : productData.data?.attributes

    return product
  }

  async getTeam({
    teamId = 0,
    teamSlug = '',
    withEnvironments = false,
  }: {
    teamId?: number
    teamSlug?: string
    withEnvironments?: boolean
  }): Promise<Team> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeam({ teamId, teamSlug, withEnvironments })
    // @ts-expect-error Suppress any declaration
    const team = teamSlug ? teamData.data[0].attributes : teamData.data?.attributes

    return team
  }

  async getNamespace({
    namespaceId = 0,
    namespaceSlug = '',
  }: {
    namespaceId?: number
    namespaceSlug?: string
  }): Promise<Namespace> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const namespaceData = await strapiApiClient.getNamespace({ namespaceId, namespaceSlug })
    // @ts-expect-error Suppress any declaration
    const namespace = namespaceSlug ? namespaceData.data[0].attributes : namespaceData.data?.attributes

    return namespace
  }

  async getComponent({ componentName }: { componentName: string }): Promise<Component> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentItem = await strapiApiClient.getComponent({ componentName })
    const componentData = componentItem.data as ComponentListResponseDataItem[]

    // @ts-expect-error Suppress any declaration
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

    // @ts-expect-error Suppress any declaration
    const serviceArea = serviceAreaSlug ? serviceAreaData.data[0]?.attributes : serviceAreaData.data?.attributes

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

  async getGithubRepoRequests(): Promise<GithubRepoRequestListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentRequestsData = await strapiApiClient.getGithubRepoRequests()
    const componentRequests = componentRequestsData.data.sort(sortComponentRequestData)

    return componentRequests
  }

  async getGithubRepoRequest({ repoName }: { repoName: string }): Promise<GithubRepoRequest> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentRequestData = await strapiApiClient.getGithubRepoRequest({ repoName })
    const componentRequest =
      Array.isArray(componentRequestData.data) && componentRequestData.data.length > 0
        ? componentRequestData.data[0].attributes
        : componentRequestData.data?.attributes
    return componentRequest
  }

  async postGithubRepoRequest(request: GithubRepoRequestRequest): Promise<GithubRepoRequestResponse> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const response = await strapiApiClient.postGithubRepoRequest(request)

    return response
  }

  async getGithubTeams(): Promise<GithubTeamListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamRequestsData = await strapiApiClient.getGithubTeams()
    const teamRequests = teamRequestsData.data.sort(sortGithubTeamsData)

    return teamRequests
  }

  async getGithubTeam({ teamName }: { teamName: string }): Promise<GithubTeam> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamRequestData = await strapiApiClient.getGithubTeam({ teamName })
    const teamRequest =
      Array.isArray(teamRequestData.data) && teamRequestData.data.length > 0
        ? teamRequestData.data[0].attributes
        : teamRequestData.data?.attributes
    return teamRequest
  }

  async getUpdateGithubTeamRequests(): Promise<UpdateGithubTeamsRequestListResponseDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamRequestsData = await strapiApiClient.getUpdateGithubTeamRequests()
    const teamRequests = teamRequestsData.data.sort(sortGithubTeamsData)

    return teamRequests
  }

  async getUpdateGithubTeamRequest({ teamName }: { teamName: string }): Promise<UpdatedGithubTeamRequest> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamRequestData = await strapiApiClient.getUpdateGithubTeamRequest({ teamName })
    const teamRequest =
      Array.isArray(teamRequestData.data) && teamRequestData.data.length > 0
        ? teamRequestData.data[0].attributes
        : teamRequestData.data?.attributes
    return teamRequest
  }

  async postUpdateGithubTeamRequest(
    request: UpdateGithubTeamsRequestRequest,
  ): Promise<UpdateGithubTeamsRequestResponse> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const response = await strapiApiClient.postUpdateGithubTeamRequest(request)

    return response
  }
}
