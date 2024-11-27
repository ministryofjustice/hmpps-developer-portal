export type DependencyList = {
  helm: string[]
  circleci: string[]
}

export type MoJSelectDataItem = {
  value: string
  text: string
  selected: boolean
}

export type TrivyVulnerability = {
  PrimaryURL: string
  Title: string
  VulnerabilityID: string
  Severity: string
  References: string[]
}

export type TrivyResult = {
  Vulnerabilities: TrivyVulnerability[]
}

export type TrivyScanResults = {
  Results: TrivyResult[]
}

export type TrivyDisplayEntry = {
  name: string
  title: string
  lastScan: string
  vulnerability: string
  severity: string
  references: string
  primaryUrl: string
}

export type RdsEntry = {
  tf_label: string
  namespace: string
  db_instance_class: string
  db_engine_version: string
  rds_family: string
  db_max_allocated_storage: string
  allow_major_version_upgrade?: string
  allow_minor_version_upgrade?: string
  deletion_protection?: string
  maintenance_window?: string
  performance_insights_enabled?: string
  is_production?: string
  environment_name?: string
}

export type GithubRepoRequestEntry = {
  github_repo?: string
  repo_description?: string
  base_template?: string
  jira_project_keys?: unknown
  github_project_visibility?: 'public' | 'internal' | 'private'
  product?: string
  slack_channel_prod_release_notify?: string
  slack_channel_security_scans_notify?: string
  prod_alerts_severity_label?: string
  nonprod_alerts_severity_label?: string
  github_project_teams_write?: unknown
  github_projects_teams_admin?: unknown
  github_project_branch_protection_restricted_teams?: unknown
  alerts_nonprod_slack_channel?: string
  alerts_prod_slack_channel?: string
  slack_channel_nonprod_release_notify?: string
  request_github_pr_status?: string
  request_github_pr_number?: number
  requester_name?: string
  requester_email?: string
  requester_team?: string
}