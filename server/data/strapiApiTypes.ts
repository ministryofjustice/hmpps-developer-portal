import { components } from '../@types/strapi-api'

export type DataItem<T> = {
  attributes?: T
  id?: number
}

export type ListResponse<T> = {
  data?: DataItem<T>[]
  meta?: {
    pagination?: {
      page?: number
      pageCount?: number
      pageSize?: number
      total?: number
    }
  }
}
type HasComponents = { components: { data: DataItem<Component>[] } }
type HasTeam = { team: TeamResponse }
type HasServiceArea = { service_area: ServiceAreaResponse }
type HasProduct = { product?: { data: { attributes: ProductWithTeamAndServiceArea } } }

type ProductWithTeamAndServiceArea = Omit<Omit<ProductResponse['data']['attributes'], 'team'>, 'serviceArea'> &
  HasTeam &
  HasServiceArea

export type Product = Omit<components['schemas']['Product'], 'components'> & HasComponents
export type ProductResponse = components['schemas']['ProductResponse']

export type Component = components['schemas']['Component'] & HasProduct
export type ComponentResponse = components['schemas']['ComponentResponse']

export type Team = components['schemas']['Team']
export type TeamResponse = components['schemas']['TeamResponse']

export type ProductSet = components['schemas']['ProductSet']
export type ProductSetResponse = components['schemas']['ProductSetResponse']

export type StrapiServiceArea = components['schemas']['ServiceArea']
export type ServiceAreaResponse = components['schemas']['ServiceAreaResponse']

export type CustomComponentView = components['schemas']['CustomComponentView']
export type CustomComponentResponse = components['schemas']['CustomComponentViewResponse']

export type Environment = components['schemas']['PropertiesEnvironmentComponent']
export type EnvironmentForMapping = components['schemas']['EnvironmentPropertiesForMapping']

export type Namespace = components['schemas']['Namespace']
export type NamespaceResponse = components['schemas']['NamespaceResponse']

export type GithubRepoRequest = components['schemas']['GithubRepoRequest']
export type GithubRepoRequestResponse = components['schemas']['GithubRepoRequestResponse']

export type GithubRepoRequestRequest = components['schemas']['GithubRepoRequestRequest']
export type GithubProjectVisibility = GithubRepoRequestRequest['data']['github_project_visibility']

export type GithubTeam = components['schemas']['GithubTeam']
export type GithubTeamResponse = components['schemas']['GithubTeamResponse']
export type GithubTeamRequest = components['schemas']['GithubTeamRequest']

export type ScheduledJob = components['schemas']['ScheduledJob']
export type ScheduledJobResponse = components['schemas']['ScheduledJobResponse']
export type ScheduledJobRequest = components['schemas']['ScheduledJobRequest']

export type TrivyScan = components['schemas']['TrivyScan']
export type TrivyScanResponse = components['schemas']['TrivyScanResponse']
export type TrivyScanRequest = components['schemas']['TrivyScanRequest']

export type Env = components['schemas']['Environment']
export type EnvResponse = components['schemas']['EnvironmentResponse']
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
