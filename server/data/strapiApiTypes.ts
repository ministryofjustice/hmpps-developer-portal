import { components } from '../@types/strapi-api'

export type ListResponse<T> = {
  data?: T[]
  meta?: {
    pagination?: {
      page?: number
      pageCount?: number
      pageSize?: number
      total?: number
    }
  }
}
type HasComponents = { components: { data: ComponentListResponseDataItem[] } }
type HasTeam = { team: TeamResponse }
type HasServiceArea = { service_area: ServiceAreaResponse }
type HasProduct = { attributes: { product?: { data: { attributes: ProductWithTeamAndServiceArea } } } }

type ProductWithTeamAndServiceArea = Omit<Omit<ProductResponse['data']['attributes'], 'team'>, 'serviceArea'> &
  HasTeam &
  HasServiceArea

export type Product = Omit<components['schemas']['Product'], 'components'> & HasComponents
export type ProductResponse = components['schemas']['ProductResponse']
export type ProductListResponseDataItem = components['schemas']['ProductListResponseDataItem']

export type Component = components['schemas']['Component']
export type ComponentResponse = components['schemas']['ComponentResponse']
export type ComponentListResponseDataItem = components['schemas']['ComponentListResponseDataItem'] & HasProduct

export type Team = components['schemas']['Team']
export type TeamResponse = components['schemas']['TeamResponse']
export type TeamListResponseDataItem = components['schemas']['TeamListResponseDataItem']

export type ProductSet = components['schemas']['ProductSet']
export type ProductSetResponse = components['schemas']['ProductSetResponse']
export type ProductSetListResponseDataItem = components['schemas']['ProductSetListResponseDataItem']

export type ServiceArea = components['schemas']['ServiceArea']
export type ServiceAreaResponse = components['schemas']['ServiceAreaResponse']
export type ServiceAreaListResponseDataItem = components['schemas']['ServiceAreaListResponseDataItem']

export type CustomComponentView = components['schemas']['CustomComponentView']
export type CustomComponentResponse = components['schemas']['CustomComponentViewResponse']
export type CustomComponentListResponseDataItem = components['schemas']['CustomComponentViewListResponseDataItem']

export type Environment = components['schemas']['PropertiesEnvironmentComponent']
export type EnvironmentForMapping = components['schemas']['EnvironmentPropertiesForMapping']
export type EnvironmentListResponseDataItem = components['schemas']['EnvironmentListResponseDataItem']

export type Namespace = components['schemas']['Namespace']
export type NamespaceResponse = components['schemas']['NamespaceResponse']
export type NamespaceListResponseDataItem = components['schemas']['NamespaceListResponseDataItem']

export type GithubRepoRequest = components['schemas']['GithubRepoRequest']
export type GithubRepoRequestResponse = components['schemas']['GithubRepoRequestResponse']
export type GithubRepoRequestListResponseDataItem = components['schemas']['GithubRepoRequestListResponseDataItem']

export type GithubRepoRequestRequest = components['schemas']['GithubRepoRequestRequest']
export type GithubProjectVisibility =
  components['schemas']['GithubRepoRequestRequest']['data']['github_project_visibility']

export type GithubTeam = components['schemas']['GithubTeam']
export type GithubTeamResponse = components['schemas']['GithubTeamResponse']
export type GithubTeamListResponseDataItem = components['schemas']['GithubTeamListResponseDataItem']
export type GithubTeamRequest = components['schemas']['GithubTeamRequest']

export type ScheduledJob = components['schemas']['ScheduledJob']
export type ScheduledJobResponse = components['schemas']['ScheduledJobResponse']
export type ScheduledJobListResponseDataItem = components['schemas']['ScheduledJobListResponseDataItem']
export type ScheduledJobRequest = components['schemas']['ScheduledJobRequest']

export type TrivyScan = components['schemas']['TrivyScan']
export type TrivyScanResponse = components['schemas']['TrivyScanResponse']
export type TrivyScanListResponseDataItem = components['schemas']['TrivyScanListResponseDataItem']
export type TrivyScanRequest = components['schemas']['TrivyScanRequest']

export type Env = components['schemas']['Environment']
export type EnvResponse = components['schemas']['EnvironmentResponse']
export type EnvListResponseDataItem = components['schemas']['EnvironmentListResponseDataItem']
export type EnvRequest = components['schemas']['EnvironmentRequest']

export type VeracodeResultsSummary = {
  'static-analysis': {
    score: number
  }
  severity: {
    level: number
    category: {
      count: number
      severity: string
      categoryname: string
    }[]
  }[]
}
