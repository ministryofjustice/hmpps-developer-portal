import { RdsEntry } from '../@types'
import type { StrapiApiClient } from '../data'
import type {
  Product,
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
  SnykVulnerability,
} from '../data/modelTypes'
import { Environment } from '../data/strapiApiTypes'
import { sortRdsInstances, sortComponentRequestData, sortGithubTeamsData, sortByName } from '../utils/utils'

export default class ServiceCatalogueService {
  constructor(private readonly strapiApiClient: StrapiApiClient) {}

  async getProducts({
    withEnvironments = false,
    withComponents = false,
    isDecommissioned = false,
  }: {
    withEnvironments?: boolean
    withComponents?: boolean
    isDecommissioned?: boolean
  }): Promise<Product[]> {
    const productData = await this.strapiApiClient.getProducts({ withEnvironments, withComponents, isDecommissioned })

    const products = productData.sort(sortByName)
    return products
  }

  async getProduct({
    productSlug = '',
    productDocumentId = '',
    withEnvironments = false,
  }: {
    productSlug?: string
    productDocumentId?: string
    withEnvironments?: boolean
  }): Promise<Product> {
    const productData = await this.strapiApiClient.getProduct({ productSlug, productDocumentId, withEnvironments })

    return productData
  }

  async getTeams({ withComponents = false }: { withComponents?: boolean }): Promise<Team[]> {
    const teamData = await this.strapiApiClient.getTeams({ withComponents })

    const teams = teamData.sort(sortByName)

    return teams
  }

  async getTeam({
    teamDocumentId = '',
    teamSlug = '',
    withEnvironments = false,
  }: {
    teamDocumentId?: string
    teamSlug?: string
    withEnvironments?: boolean
  }): Promise<Team> {
    const teamData = await this.strapiApiClient.getTeam({ teamDocumentId, teamSlug, withEnvironments })

    return teamData
  }

  async getComponents(
    exemptionFilters: string[] = [],
    includeTeams: boolean = true,
    includeLatestCommit: boolean = false,
  ): Promise<Component[]> {
    const componentData = await this.strapiApiClient.getComponents(exemptionFilters, includeTeams, includeLatestCommit)
    const components = componentData.sort(sortByName)

    return components
  }

  async getComponent({ componentName }: { componentName: string }): Promise<Component> {
    const componentItem = await this.strapiApiClient.getComponent({ componentName })
    return componentItem
  }

  async getDependencies(): Promise<string[]> {
    const componentData = await this.strapiApiClient.getComponents()
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

  async getServiceAreas({ withComponents = false }: { withComponents?: boolean }): Promise<ServiceArea[]> {
    const serviceAreaData = await this.strapiApiClient.getServiceAreas({ withComponents })
    return serviceAreaData.sort(sortByName)
  }

  async getServiceArea({
    serviceAreaDocumentId = '',
    serviceAreaSlug = '',
    withProducts = false,
    withSnykScan = false,
  }: {
    serviceAreaDocumentId?: string
    serviceAreaSlug?: string
    withProducts?: boolean
    withSnykScan?: boolean
  }): Promise<ServiceArea> {
    const serviceAreaData = await this.strapiApiClient.getServiceArea({
      serviceAreaDocumentId,
      serviceAreaSlug,
      withProducts,
      withSnykScan,
    })

    return serviceAreaData
  }

  async getProductSets(): Promise<ProductSet[]> {
    const productSetData = await this.strapiApiClient.getProductSets()

    const productSets = productSetData.sort(sortByName)

    return productSets
  }

  async getProductSet({ productSetDocumentId = '' }: { productSetDocumentId: string }): Promise<ProductSet> {
    const productSetData = await this.strapiApiClient.getProductSet({ productSetDocumentId })
    return productSetData
  }

  async getNamespaces(): Promise<Namespace[]> {
    const namespaceData = await this.strapiApiClient.getNamespaces()

    return namespaceData.sort(sortByName)
  }

  async getNamespace({
    namespaceDocumentId = '',
    namespaceSlug = '',
  }: {
    namespaceDocumentId?: string
    namespaceSlug?: string
  }): Promise<Namespace> {
    const namespaceData = await this.strapiApiClient.getNamespace({ namespaceDocumentId, namespaceSlug })

    return namespaceData
  }

  async getGithubTeams(): Promise<GithubTeam[]> {
    const githubTeamsData = await this.strapiApiClient.getGithubTeams()
    const githubTeams = githubTeamsData.sort(sortGithubTeamsData)
    return githubTeams
  }

  async getGithubTeam({ teamName }: { teamName: string }): Promise<GithubTeam> {
    const githubTeamData = await this.strapiApiClient.getGithubTeam({ teamName })
    return githubTeamData
  }

  async getGithubSubTeams({ parentTeamName }: { parentTeamName: string }): Promise<GithubTeam[]> {
    const githubSubTeamsData = await this.strapiApiClient.getGithubSubTeams({ parentTeamName })
    return githubSubTeamsData
  }

  async getScheduledJobs(): Promise<ScheduledJob[]> {
    const scheduledJobsData = await this.strapiApiClient.getScheduledJobs()
    const scheduledJobsRequests = scheduledJobsData.sort(sortByName)
    return scheduledJobsRequests
  }

  async getScheduledJob({ name }: { name: string }): Promise<ScheduledJob> {
    const scheduledJobData = await this.strapiApiClient.getScheduledJob({ name })
    return scheduledJobData
  }

  async getRdsInstances(): Promise<RdsEntry[]> {
    const namespaceData = await this.strapiApiClient.getNamespaces()
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
    customComponentDocumentId = '',
    withEnvironments = false,
  }: {
    customComponentDocumentId: string
    withEnvironments?: boolean
  }): Promise<CustomComponentView> {
    const customComponentData = await this.strapiApiClient.getCustomComponentView({
      customComponentDocumentId,
      withEnvironments,
    })

    return customComponentData
  }

  async getGithubRepoRequests(): Promise<GithubRepoRequest[]> {
    const componentRequestsData = await this.strapiApiClient.getGithubRepoRequests()
    return componentRequestsData.sort(sortComponentRequestData)
  }

  async getGithubRepoRequest({ repoName }: { repoName: string }): Promise<GithubRepoRequest[]> {
    return this.strapiApiClient.getGithubRepoRequest({ repoName })
  }

  async postGithubRepoRequest(request: GithubRepoRequestRequest): Promise<void> {
    return this.strapiApiClient.postGithubRepoRequest(request)
  }

  async getEnvironments(): Promise<Environment[]> {
    const environmentData = await this.strapiApiClient.getEnvironments()
    const environmentList = environmentData.data

    return environmentList
  }

  async getSnykVulnerabilities(): Promise<SnykVulnerability[]> {
    const snykVulnerabilitiesData = await this.strapiApiClient.getSnykVulnerabilities()
    return snykVulnerabilitiesData
  }
}
