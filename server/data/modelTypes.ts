import type * as Strapi from './strapiApiTypes'
import type { Unwrapped } from './strapiClientTypes'

// Requests
export type GithubRepoRequestRequest = Strapi.GithubRepoRequestRequest

// Responses
export type Product = Unwrapped<Strapi.Product>
export type Component = Unwrapped<Strapi.Component>
export type Team = Unwrapped<Strapi.Team>
export type ProductSet = Unwrapped<Strapi.ProductSet>
export type ServiceArea = Unwrapped<Strapi.ServiceArea>
export type CustomComponentView = Unwrapped<Strapi.CustomComponentView>
export type Environment = Unwrapped<Strapi.Environment>
export type EnvironmentForMapping = Unwrapped<Strapi.EnvironmentForMapping>
export type Namespace = Unwrapped<Strapi.Namespace>
export type GithubRepoRequest = Unwrapped<Strapi.GithubRepoRequest>
export type GithubTeam = Unwrapped<Strapi.GithubTeam>
export type GithubTeamRequest = Unwrapped<Strapi.GithubTeamRequest>
export type ScheduledJob = Unwrapped<Strapi.ScheduledJob>
export type ScheduledJobRequest = Unwrapped<Strapi.ScheduledJobRequest>
export type TrivyScan = Unwrapped<Strapi.TrivyScan>
export type TrivyScanRequest = Unwrapped<Strapi.TrivyScanRequest>

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
