import { RdsEntry } from '../@types'
import type { StrapiApiClient, RestClientBuilder } from '../data'
import type { ServiceArea, TrivyScanType } from '../data/converters/modelTypes'
import {
  Product,
  Component,
  Team,
  ProductSet,
  CustomComponentView,
  Namespace,
  GithubRepoRequestResponse,
  GithubRepoRequest,
  GithubRepoRequestRequest,
  GithubTeam,
  StrapiServiceArea,
  ScheduledJob,
  DataItem,
  Environment,
} from '../data/strapiApiTypes'
import { sortData, sortRdsInstances, sortComponentRequestData, sortGithubTeamsData, sortByName } from '../utils/utils'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts({ withEnvironments = false }: { withEnvironments?: boolean }): Promise<DataItem<Product>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts({ withEnvironments })

    const products = productData.data.sort(sortData)

    return products
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

  async getTeams(): Promise<DataItem<Team>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeams()

    const teams = teamData.data.sort(sortData)

    return teams
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

  async getComponents(
    exemptionFilters: string[] = [],
    includeTeams: boolean = true,
    includeLatestCommit: boolean = false,
  ): Promise<DataItem<Component>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents(exemptionFilters, includeTeams, includeLatestCommit)

    const components = componentData.data.sort(sortData)

    return components
  }

  async getComponent({ componentName }: { componentName: string }): Promise<Component> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentItem = await strapiApiClient.getComponent({ componentName })
    const componentData = componentItem.data as DataItem<Component>[]

    // @ts-expect-error Suppress any declaration
    const component = componentData.length > 0 ? componentItem.data[0]?.attributes : {}

    return component
  }

  async getDependencies(): Promise<string[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents()
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

  async getServiceAreas(): Promise<ServiceArea[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceAreas()
    return serviceAreaData.sort(sortByName)
  }

  async getServiceArea({
    serviceAreaId = 0,
    serviceAreaSlug = '',
    withProducts = false,
  }: {
    serviceAreaId?: number
    serviceAreaSlug?: string
    withProducts?: boolean
  }): Promise<StrapiServiceArea> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceArea({ serviceAreaId, serviceAreaSlug, withProducts })

    // @ts-expect-error Suppress any declaration
    const serviceArea = serviceAreaSlug ? serviceAreaData.data[0]?.attributes : serviceAreaData.data?.attributes

    return serviceArea
  }

  async getProductSets(): Promise<DataItem<ProductSet>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSets()

    const productSets = productSetData.data.sort(sortData)

    return productSets
  }

  async getProductSet({ productSetId = 0 }: { productSetId: number }): Promise<ProductSet> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSet({ productSetId })

    const productSet = productSetData.data?.attributes

    return productSet
  }

  async getNamespaces(): Promise<DataItem<Namespace>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const namespaceData = await strapiApiClient.getNamespaces()

    const namespaces = namespaceData.data.sort(sortData)

    return namespaces
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

  async getGithubTeams(): Promise<DataItem<GithubTeam>[]> {
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

  async getScheduledJobs(): Promise<DataItem<ScheduledJob>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const scheduledJobsData = await strapiApiClient.getScheduledJobs()
    const scheduledJobsRequests = scheduledJobsData.data.sort(sortData)

    return scheduledJobsRequests
  }

  async getScheduledJob({ name }: { name: string }): Promise<ScheduledJob> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const scheduledJobData = await strapiApiClient.getScheduledJob({ name })
    const scheduledJobsRequest =
      Array.isArray(scheduledJobData.data) && scheduledJobData.data.length > 0
        ? scheduledJobData.data[0].attributes
        : scheduledJobData.data?.attributes
    return scheduledJobsRequest
  }

  async getTrivyScans(): Promise<TrivyScanType[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const trivyScansData = await strapiApiClient.getTrivyScans()
    const trivyScans = trivyScansData.sort(sortByName)
    return trivyScans
  }

  async getTrivyScan({ name }: { name: string }): Promise<TrivyScanType> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const trivyScansData = await strapiApiClient.getTrivyScan({ name })
    const trivyScansRequest =
      Array.isArray(trivyScansData.data) && trivyScansData.data.length > 0
        ? trivyScansData.data[0].attributes
        : trivyScansData.data?.attributes
    return trivyScansRequest
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

  async getGithubRepoRequests(): Promise<DataItem<GithubRepoRequest>[]> {
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

  async getEnvironments(): Promise<DataItem<Environment>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const environmentData = await strapiApiClient.getEnvironments()
    const environmentList = environmentData.data

    return environmentList
  }
}
