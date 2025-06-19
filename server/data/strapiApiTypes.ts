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

export type SingleResponse<T> = {
  data?: DataItem<T>
  meta?: Record<string, never>
}

type HasComponents = { components: { data: DataItem<Component>[] } }
type HasTeam = { team: SingleResponse<Team> }
type HasServiceArea = { service_area: SingleResponse<StrapiServiceArea> }
type HasProduct = { product?: { data: { attributes: ProductWithTeamAndServiceArea } } }

type ProductWithTeamAndServiceArea = Omit<Omit<Product, 'team'>, 'serviceArea'> & HasTeam & HasServiceArea

export type Product = Omit<components['schemas']['Product'], 'components'> & HasComponents
export type Component = components['schemas']['Component'] & HasProduct
export type Team = components['schemas']['Team']
export type ProductSet = components['schemas']['ProductSet']
export type StrapiServiceArea = components['schemas']['ServiceArea']

export type CustomComponentView = components['schemas']['CustomComponentView']

export type Environment = components['schemas']['PropertiesEnvironmentComponent']
export type EnvironmentForMapping = SingleResponse<Environment>

export type Namespace = components['schemas']['Namespace']

export type GithubRepoRequest = components['schemas']['GithubRepoRequest']

export type GithubRepoRequestRequest = components['schemas']['GithubRepoRequestRequest']
export type GithubProjectVisibility = GithubRepoRequestRequest['data']['github_project_visibility']

export type GithubTeam = components['schemas']['GithubTeam']
export type GithubTeamRequest = components['schemas']['GithubTeamRequest']

export type ScheduledJob = components['schemas']['ScheduledJob']
export type ScheduledJobRequest = components['schemas']['ScheduledJobRequest']

export type TrivyScan = components['schemas']['TrivyScan']
export type TrivyScanRequest = components['schemas']['TrivyScanRequest']

export type Env = components['schemas']['Environment']
export type EnvRequest = components['schemas']['EnvironmentRequest']

export type Env2 = components['schemas']['Component']['envs']['data'][0]['attributes']

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
