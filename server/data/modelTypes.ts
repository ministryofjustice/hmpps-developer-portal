import type * as Strapi from './strapiApiTypes'

// Requests
export type GithubRepoRequestRequest = Strapi.GithubRepoRequestRequest

// Responses
export type Product = Strapi.Product
export type Component = Strapi.Component
export type Team = Strapi.Team
export type ProductSet = Strapi.ProductSet
export type ServiceArea = Strapi.ServiceArea
export type CustomComponentView = Strapi.CustomComponentView
export type Environment = Strapi.Environment
export type EnvironmentForMapping = Strapi.EnvironmentForMapping
export type Namespace = Strapi.Namespace
export type GithubRepoRequest = Strapi.GithubRepoRequest
export type GithubTeam = Strapi.GithubTeam
export type GithubTeamRequest = Strapi.GithubTeamRequest
export type ScheduledJob = Strapi.ScheduledJob
export type ScheduledJobRequest = Strapi.ScheduledJobRequest
export type SnykScan = Strapi.SnykScan
export type SnykVulnerability = Strapi.SnykVulnerability

export type GithubProjectVisibility = GithubRepoRequestRequest['data']['github_project_visibility']

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

export type IpAllowListAndModSecurityStatus = {
  componentName?: string
  status: {
    ipAllowListEnabled: boolean
    modSecurityEnabled: boolean
  }
}
