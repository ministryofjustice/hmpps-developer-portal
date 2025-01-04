import { components } from '../@types/strapi-api'

export type Product = components['schemas']['Product']
export type ProductResponse = components['schemas']['ProductResponse']
export type ProductListResponse = components['schemas']['ProductListResponse']
export type ProductListResponseDataItem = components['schemas']['ProductListResponseDataItem']

export type Component = components['schemas']['Component']
export type ComponentResponse = components['schemas']['ComponentResponse']
export type ComponentListResponse = components['schemas']['ComponentListResponse']
export type ComponentListResponseDataItem = components['schemas']['ComponentListResponseDataItem']

export type Team = components['schemas']['Team']
export type TeamResponse = components['schemas']['TeamResponse']
export type TeamListResponse = components['schemas']['TeamListResponse']
export type TeamListResponseDataItem = components['schemas']['TeamListResponseDataItem']

export type ProductSet = components['schemas']['ProductSet']
export type ProductSetResponse = components['schemas']['ProductSetResponse']
export type ProductSetListResponse = components['schemas']['ProductSetListResponse']
export type ProductSetListResponseDataItem = components['schemas']['ProductSetListResponseDataItem']

export type ServiceArea = components['schemas']['ServiceArea']
export type ServiceAreaResponse = components['schemas']['ServiceAreaResponse']
export type ServiceAreaListResponse = components['schemas']['ServiceAreaListResponse']
export type ServiceAreaListResponseDataItem = components['schemas']['ServiceAreaListResponseDataItem']

export type CustomComponentView = components['schemas']['CustomComponentView']
export type CustomComponentResponse = components['schemas']['CustomComponentViewResponse']
export type CustomComponentListResponse = components['schemas']['CustomComponentViewListResponse']
export type CustomComponentListResponseDataItem = components['schemas']['CustomComponentViewListResponseDataItem']

export type Environment = components['schemas']['PropertiesEnvironmentComponent']

export type Namespace = components['schemas']['Namespace']
export type NamespaceResponse = components['schemas']['NamespaceResponse']
export type NamespaceListResponse = components['schemas']['NamespaceListResponse']
export type NamespaceListResponseDataItem = components['schemas']['NamespaceListResponseDataItem']

export type GithubRepoRequest = components['schemas']['GithubRepoRequest']
export type GithubRepoRequestResponse = components['schemas']['GithubRepoRequestResponse']
export type GithubRepoRequestListResponse = components['schemas']['GithubRepoRequestListResponse']
export type GithubRepoRequestListResponseDataItem = components['schemas']['GithubRepoRequestListResponseDataItem']
export type GithubRepoRequestRequest = components['schemas']['GithubRepoRequestRequest']
export type GithubProjectVisibility =
  components['schemas']['GithubRepoRequestRequest']['data']['github_project_visibility']

export type GithubTeam = components['schemas']['GithubTeam']
export type GithubTeamResponse = components['schemas']['GithubTeamResponse']
export type GithubTeamListResponse = components['schemas']['GithubTeamListResponse']
export type GithubTeamListResponseDataItem = components['schemas']['GithubTeamListResponseDataItem']
export type GithubTeamRequest = components['schemas']['GithubTeamRequest']

export type UpdatedGithubTeamRequest = components['schemas']['UpdateGithubTeamsRequest']
export type UpdateGithubTeamsRequestResponse = components['schemas']['UpdateGithubTeamsRequestResponse']
export type UpdateGithubTeamsRequestListResponse = components['schemas']['UpdateGithubTeamsRequestListResponse']
export type UpdateGithubTeamsRequestListResponseDataItem =
  components['schemas']['UpdateGithubTeamsRequestListResponseDataItem']
export type UpdateGithubTeamsRequestRequest = components['schemas']['UpdateGithubTeamsRequestRequest']
