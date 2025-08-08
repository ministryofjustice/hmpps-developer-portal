import type { AlertsApiClient, RestClientBuilder } from '../data'
import { Alert } from '../@types'
import { Environment } from '../data/strapiApiTypes'
import { DataItem } from '../data/strapiClientTypes'
import logger from '../../logger'
import { mapToCanonicalEnv, findTeamMatch } from '../utils/utils'
import type { ServiceCatalogueService } from '.'
import type { Team } from '../data/modelTypes'

export default class AlertsService {
  constructor(private readonly alertsApiClientFactory: RestClientBuilder<AlertsApiClient>) {}

  async getAlerts(): Promise<Alert[]> {
    const alertsApiClient = this.alertsApiClientFactory('')
    try {
      return await alertsApiClient.getAlerts()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Error fetching alerts: ${msg}`)
      return []
    }
  }

  async getAlertsForComponent(componentName: string): Promise<Alert[]> {
    const alertsApiClient = this.alertsApiClientFactory('')
    try {
      return await alertsApiClient.getAlertsForComponent(componentName)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Error fetching alerts for ${componentName}: ${msg}`)
      return []
    }
  }

  // Match alert data to corresponding environments and components to get slack channel and team properties
  async addNewPropertiesToAlert(revisedAlerts: Alert[], environments: DataItem<Environment>[], teams: Team[]) {
    return revisedAlerts.map(alert => {
      const envMatch = environments.find(env => env.attributes.alert_severity_label === alert.labels.severity)
      const teamMatch = findTeamMatch(teams, alert.labels.application)

      const updatedAlert = { ...alert }

      if (envMatch) updatedAlert.labels.alert_slack_channel = envMatch.attributes.alerts_slack_channel
      if (teamMatch) updatedAlert.labels.team = teamMatch.name

      return updatedAlert
    })
  }

  // map environment keys to the alert environment
  async mapAlertEnvironments(alerts: Alert[]) {
    const updatedAlerts = Array.isArray(alerts) ? [...alerts] : []
    return updatedAlerts.map(alert => {
      const updatedAlert = { ...alert }
      // Map alert environment to canonical form, even if it's an empty string
      if (updatedAlert.labels && 'environment' in updatedAlert.labels) {
        updatedAlert.labels.environment = mapToCanonicalEnv(updatedAlert.labels.environment)
      }
      return updatedAlert
    })
  }

  async reviseAlerts(alerts: Alert[], environments: DataItem<Environment>[], teams: Team[]) {
    const revisedEnvAlerts = await this.mapAlertEnvironments(alerts)
    const revisedAlerts = await this.addNewPropertiesToAlert(revisedEnvAlerts, environments, teams)

    return revisedAlerts
  }

  async getAndSortAlerts(serviceCatalogueService: ServiceCatalogueService) {
    const alerts = await this.getAlerts()
    const environments = await serviceCatalogueService.getEnvironments()
    const teams = await serviceCatalogueService.getTeams({ withComponents: true })
    const revisedAlerts = this.reviseAlerts(alerts, environments, teams)
    return revisedAlerts
  }

  async getAlertEnvironments() {
    const alertsData = await this.getAlerts()
    // Extract unique canonical environment values from actual alerts and deduplicate
    const alertEnvironments = [
      ...new Set(
        alertsData.map(alert => alert.labels?.environment || 'none').map(mapToCanonicalEnv), // Map to canonical form
      ),
    ].sort()

    // Format environments for dropdown with blank default option
    const environments = [
      { text: '', value: '', selected: true },
      ...alertEnvironments.map(env => ({ text: env, value: env, selected: false })),
    ]
    return environments
  }
}
