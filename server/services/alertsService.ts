import type { AlertsApiClient, RestClientBuilder } from '../data'
import { AlertListResponseDataItem } from '../@types'

export default class AlertsService {
  constructor(private readonly alertsApiClient: RestClientBuilder<AlertsApiClient>) {}

  async getAlerts(): Promise<AlertListResponseDataItem[]> {
    const alertsApiClient = this.alertsApiClient('')
    const alertData = await alertsApiClient.getAlerts()
    return alertData
  }
}
