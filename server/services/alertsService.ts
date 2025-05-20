import type { AlertsApiClient, RestClientBuilder } from '../data'
import { AlertListResponseDataItem } from '../@types'

export default class AlertsService {
  constructor(private readonly alertsApiClientFactory: RestClientBuilder<AlertsApiClient>) {}

  async getAlerts(): Promise<AlertListResponseDataItem[]> {
    const alertsApiClient = this.alertsApiClientFactory('')
    const alertData = await alertsApiClient.getAlerts()
    return alertData
  }
}
