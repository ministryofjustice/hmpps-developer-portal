export type Product = {
  id: number
  name: string
  subproduct: boolean
  legacy: boolean
  description: string
  phase: string
  deliveryManager: string
  productManager: string
  confluenceLink: string
  gDriveLink: string
  productId: string
  slackChannelId: string
  slug: string
  slackChannelName: string
  leadDeveloper: string
}

export type ServiceArea = {
  id: number
  name: string
  owner: string
  serviceAreaId: string
  slug: string
  products: Product[]
}

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

export type EnvironmentType = {
  id: number
  name: string
  type: string
  namespace: string
  info_path: string
  health_path: string
  url: string
  monitor: boolean
  active_agencies: string[]
  swagger_docs: string
  ip_allow_list_enabled: boolean
  ip_allow_list: string[]
  include_in_subject_access_requests: boolean
  modsecurity_enabled: boolean
  modsecurity_audit_enabled: boolean
  modsecurity_snippet: string
  build_image_tag: string
  alert_severity_label: string
  alerts_slack_channel: string
  manually_managed: boolean
}
