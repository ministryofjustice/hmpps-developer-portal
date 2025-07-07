import { components } from '../@types/strapi-api'
import { TrivyScanType } from './converters/modelTypes'

export type DataItem<T> = {
  attributes: T
  id?: number
}

export type ListResponse<T> = {
  data: DataItem<T>[]
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
  data: DataItem<T>
  meta?: Record<string, never>
}

// Recursive unwrap utility
// prettier-ignore
export type DeepUnwrap<T> =
  T extends ListResponse<infer U> ? Unwrapped<U>[] :
  T extends SingleResponse<infer U> ? Unwrapped<U> :
  T extends Record<string | number | symbol, unknown>? T:
  T;
// prettier-enable

// Transform utility that applies DeepUnwrap to each property
export type Unwrapped<T> = {
  [K in keyof T]: DeepUnwrap<T[K]>
} & { id?: number }

type HasComponent = { component: SingleResponse<Component> }
type HasComponents = { components: ListResponse<Component> }

type HasProduct = { product: SingleResponse<Product> }
type HasProducts = { products: ListResponse<Product> }
type HasProductSet = { product_set: SingleResponse<ProductSet> }
type HasTeam = { team: SingleResponse<Team> }
type HasServiceArea = { service_area: SingleResponse<ServiceArea> }
type HasNamespace = { ns: SingleResponse<Namespace> }
type HasEnvironments = { envs: ListResponse<Environment> }
type HasTrivyScan = { trivy_scan?: SingleResponse<TrivyScanType> }
type HasVeracodeSummary = { veracode_results_summary: VeracodeResultsSummary }
type Version = { ref: string; version: string; path: string }
type HasVersions = { versions: Record<string, Record<string, Version | string | Record<string, string>>> }
type HasIpAllowlist = { ip_allow_list: Record<string, Record<string, string | Record<string, string>>> }

export type Product = Omit<
  components['schemas']['Product'],
  'components' | 'team' | 'service_area' | 'product_set' | 'veracode_results_summary'
> &
  HasComponents &
  HasTeam &
  HasServiceArea &
  HasProductSet

export type Component = Omit<components['schemas']['Component'], 'product' | 'envs'> &
  HasProduct &
  HasEnvironments &
  HasVeracodeSummary &
  HasVersions

export type Team = Omit<components['schemas']['Team'], 'products'> & HasProducts
export type ProductSet = components['schemas']['ProductSet'] & HasProducts
export type ServiceArea = Omit<components['schemas']['ServiceArea'], 'products'> & HasProducts

export type CustomComponentView = Omit<components['schemas']['CustomComponentView'], 'components'> & HasComponents

export type Environment = components['schemas']['Component']['envs']['data'][0]['attributes'] &
  HasNamespace &
  HasTrivyScan &
  HasComponent &
  HasIpAllowlist

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
