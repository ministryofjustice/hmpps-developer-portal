// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// NOTE: This file should only be referenced by the strapi 4 client
// Use types defined in modelTypes.ts for service layer onward
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import { components } from '../@types/strapi-api'

import { TrivyScanType, VeracodeResultsSummary } from './modelTypes'
import { ListResponse, SingleResponse } from './strapiClientTypes'

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

type Product = Omit<
  components['schemas']['Product'],
  'components' | 'team' | 'service_area' | 'product_set' | 'veracode_results_summary'
> &
  HasComponents &
  HasTeam &
  HasServiceArea &
  HasProductSet

type Component = Omit<components['schemas']['Component'], 'product' | 'envs'> &
  HasProduct &
  HasEnvironments &
  HasVeracodeSummary &
  HasVersions

type Team = Omit<components['schemas']['Team'], 'products'> & HasProducts
type ProductSet = components['schemas']['ProductSet'] & HasProducts
type ServiceArea = Omit<components['schemas']['ServiceArea'], 'products'> & HasProducts

type CustomComponentView = Omit<components['schemas']['CustomComponentView'], 'components'> & HasComponents

type Environment = components['schemas']['Component']['envs']['data'][0]['attributes'] &
  HasNamespace &
  HasTrivyScan &
  HasComponent &
  HasIpAllowlist

type EnvironmentForMapping = SingleResponse<Environment>

type Namespace = components['schemas']['Namespace']

type GithubRepoRequest = components['schemas']['GithubRepoRequest']

type GithubRepoRequestRequest = components['schemas']['GithubRepoRequestRequest']

type GithubTeam = components['schemas']['GithubTeam']
type GithubTeamRequest = components['schemas']['GithubTeamRequest']

type ScheduledJob = components['schemas']['ScheduledJob']
type ScheduledJobRequest = components['schemas']['ScheduledJobRequest']

type TrivyScan = components['schemas']['TrivyScan']
type TrivyScanRequest = components['schemas']['TrivyScanRequest']

export {
  Product,
  Component,
  Team,
  ProductSet,
  ServiceArea,
  CustomComponentView,
  Environment,
  EnvironmentForMapping,
  Namespace,
  GithubRepoRequest,
  GithubRepoRequestRequest,
  GithubTeam,
  GithubTeamRequest,
  ScheduledJob,
  ScheduledJobRequest,
  TrivyScan,
  TrivyScanRequest,
}
