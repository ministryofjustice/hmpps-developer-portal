export type DependencyList = {
  helm: string[]
  circleci: string[]
}

export type MoJSelectDataItem = {
  value: string
  text: string
  selected: boolean
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

interface Alert {
  annotations?: {
    dashboard_url?: string
    summary?: string
    message?: string
    runbook_url?: string
  }
  endsAt?: string
  fingerprint?: string
  receivers?: [
    {
      name?: string
    },
  ]
  startsAt?: string
  status?: {
    inhibitedBy?: Array<string>
    silencedBy?: Array<string>
    state?: string
  }
  updatedAt?: string
  generatorURL?: string
  labels?: {
    alertname?: string
    application?: string
    businessUnit?: string
    clusterName?: string
    environment?: string
    namespace?: string
    productId?: string
    prometheus?: string
    queue_name?: string
    severity?: string
    alert_slack_channel?: string
    team?: string
  }
}
