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
export type TrivyScan = Strapi.TrivyScan
export type TrivyScanRequest = Strapi.TrivyScanRequest

export type Summary = {
  config?: Record<string, number>
  secret?: Record<string, number>
  'os-pkgs'?: {
    fixed?: Record<string, number>
    unfixed?: Record<string, number>
  }
  'lang-pkgs'?: {
    fixed?: Record<string, number>
    unfixed?: Record<string, number>
  }
}

export type ScanResult = {
  config?: Array<{
    FilePath: string
    Severity: string
    LineNumber: string
    Description: string
    AdditionalContext: string
  }>
  secret?: Array<{
    Severity: string
    FilePath: string
    LineNumber: string
    Description: string
    AdditionalContext: string
  }>
  'os-pkgs'?: Array<{
    PkgName: string
    Severity: string
    Description: string
    InstalledVersion: string
    FixedVersion: string
    VulnerabilityID: string
    PrimaryURL: string
  }>
  'lang-pkgs'?: Array<{
    PkgName: string
    Severity: string
    Description: string
    InstalledVersion: string
    FixedVersion: string
    VulnerabilityID: string
    PrimaryURL: string
  }>
}

export type ScanSummary = {
  summary?: Summary
  scan_result?: ScanResult
}

export type TrivyScanType = {
  id: number
  name: string
  trivy_scan_timestamp: string
  build_image_tag: string
  scan_status: string
  environments: string[]
  scan_summary: ScanSummary
}

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

export type ipAllowListAndMODSecurityStatus = {
  componentName?: string
  status: {
    ipAllowListStatus: boolean
    modSecurityStatus: boolean
  }
}
