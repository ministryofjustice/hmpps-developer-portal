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

type HasComponent = { component: SingleResponse<Component> }
type HasComponents = { components: ListResponse<Component> }

type HasProduct = { product: SingleResponse<Product> }
type HasProducts = { products: ListResponse<Product> }
type HasProductSet = { product_set: SingleResponse<ProductSet> }
type HasTeam = { team: SingleResponse<Team> }
type HasServiceArea = { service_area: SingleResponse<StrapiServiceArea> }
type HasNamespace = { ns: SingleResponse<Namespace> }
type HasEnvironments = { envs: ListResponse<Environment> }

export type Product = Omit<components['schemas']['Product'], 'components' | 'team' | 'service_area' | 'product_set'> &
  HasComponents &
  HasTeam &
  HasServiceArea &
  HasProductSet

export type Component = Omit<components['schemas']['Component'], 'product' | 'envs'> & HasProduct & HasEnvironments
export type Team = Omit<components['schemas']['Team'], 'products'> & HasProducts
export type ProductSet = components['schemas']['ProductSet'] & HasProducts
export type StrapiServiceArea = Omit<components['schemas']['ServiceArea'], 'products'> & HasProducts

export type CustomComponentView = Omit<components['schemas']['CustomComponentView'], 'components'> & HasComponents

export type Environment = components['schemas']['Component']['envs']['data'][0]['attributes'] & HasNamespace
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
