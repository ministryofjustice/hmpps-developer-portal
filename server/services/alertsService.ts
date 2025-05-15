import type { AlertsApiClient } from '../data'
import { AlertListResponseDataItem } from '../@types'

export default class AlertsService {
  constructor(private readonly alertsApiClient: AlertsApiClient) {}

  async getAlerts(): Promise<AlertListResponseDataItem[]> {
    const { alertsApiClient } = this
    const alertData = await alertsApiClient.getAlerts()
    return alertData
  }
}
