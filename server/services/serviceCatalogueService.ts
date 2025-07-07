import { RdsEntry } from '../@types'
import type { StrapiApiClient, RestClientBuilder } from '../data'
import type {
  Product,
  TrivyScanType,
  Team,
  ServiceArea,
  ProductSet,
  GithubRepoRequest,
  GithubTeam,
  GithubRepoRequestRequest,
  Component,
  Namespace,
  ScheduledJob,
  CustomComponentView,
} from '../data/modelTypes'
import { Environment } from '../data/strapiApiTypes'
import { DataItem } from '../data/strapiClientTypes'
import { sortRdsInstances, sortComponentRequestData, sortGithubTeamsData, sortByName } from '../utils/utils'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getProducts({ withEnvironments = false }: { withEnvironments?: boolean }): Promise<Product[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productData = await strapiApiClient.getProducts({ withEnvironments })

    const products = productData.sort(sortByName)
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

    return productData
  }

  async getTeams(): Promise<Team[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamData = await strapiApiClient.getTeams()

    const teams = teamData.sort(sortByName)

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

    return teamData
  }

  async getComponents(
    exemptionFilters: string[] = [],
    includeTeams: boolean = true,
    includeLatestCommit: boolean = false,
  ): Promise<Component[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents(exemptionFilters, includeTeams, includeLatestCommit)
    const components = componentData.sort(sortByName)

    return components
  }

  async getComponent({ componentName }: { componentName: string }): Promise<Component> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentItem = await strapiApiClient.getComponent({ componentName })
    return componentItem
  }

  async getDependencies(): Promise<string[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentData = await strapiApiClient.getComponents()
    const components = componentData.sort(sortByName)
    let dependencies: string[] = []

    components
      .filter(component => component.versions)
      .forEach(component => {
        if (component.versions) {
          Object.keys(component.versions).forEach(versionType => {
            Object.keys(component.versions[versionType]).forEach(dependency => {
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
  }): Promise<ServiceArea> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreaData = await strapiApiClient.getServiceArea({ serviceAreaId, serviceAreaSlug, withProducts })

    return serviceAreaData
  }

  async getProductSets(): Promise<ProductSet[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSets()

    const productSets = productSetData.sort(sortByName)

    return productSets
  }

  async getProductSet({ productSetId = 0 }: { productSetId: number }): Promise<ProductSet> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productSetData = await strapiApiClient.getProductSet({ productSetId })

    return productSetData
  }

  async getNamespaces(): Promise<Namespace[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const namespaceData = await strapiApiClient.getNamespaces()

    return namespaceData.sort(sortByName)
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

    return namespaceData
  }

  async getGithubTeams(): Promise<GithubTeam[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const githubTeamsData = await strapiApiClient.getGithubTeams()
    const githubTeams = githubTeamsData.sort(sortGithubTeamsData)
    return githubTeams
  }

  async getGithubTeam({ teamName }: { teamName: string }): Promise<GithubTeam> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const githubTeamData = await strapiApiClient.getGithubTeam({ teamName })
    return githubTeamData
  }

  async getGithubSubTeams({ parentTeamName }: { parentTeamName: string }): Promise<GithubTeam[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const githubSubTeamsData = await strapiApiClient.getGithubSubTeams({ parentTeamName })
    return githubSubTeamsData
  }

  async getScheduledJobs(): Promise<ScheduledJob[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const scheduledJobsData = await strapiApiClient.getScheduledJobs()
    const scheduledJobsRequests = scheduledJobsData.sort(sortByName)
    return scheduledJobsRequests
  }

  async getScheduledJob({ name }: { name: string }): Promise<ScheduledJob> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const scheduledJobData = await strapiApiClient.getScheduledJob({ name })
    return scheduledJobData
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
      Array.isArray(trivyScansData) && trivyScansData.length > 0 ? trivyScansData[0].attributes : trivyScansData
    return trivyScansRequest
  }

  async getRdsInstances(): Promise<RdsEntry[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const namespaceData = await strapiApiClient.getNamespaces()
    const rdsInstances = namespaceData.reduce((existing, namespace) => {
      const instances = namespace.rds_instance.map(rdsInstance => {
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

    return customComponentData
  }

  async getGithubRepoRequests(): Promise<GithubRepoRequest[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const componentRequestsData = await strapiApiClient.getGithubRepoRequests()
    return componentRequestsData.sort(sortComponentRequestData)
  }

  async getGithubRepoRequest({ repoName }: { repoName: string }): Promise<GithubRepoRequest> {
    const strapiApiClient = this.strapiApiClientFactory('')
    return strapiApiClient.getGithubRepoRequest({ repoName })
  }

  async postGithubRepoRequest(request: GithubRepoRequestRequest): Promise<void> {
    const strapiApiClient = this.strapiApiClientFactory('')
    return strapiApiClient.postGithubRepoRequest(request)
  }

  async getEnvironments(): Promise<DataItem<Environment>[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const environmentData = await strapiApiClient.getEnvironments()
    const environmentList = environmentData.data

    return environmentList
  }
}
