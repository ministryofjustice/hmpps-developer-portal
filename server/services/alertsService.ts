import type { AlertsApiClient, RestClientBuilder } from '../data'
import { Alert } from '../@types'
import logger from '../../logger'

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
}
