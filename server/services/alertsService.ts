import type { AlertsApiClient, RestClientBuilder } from '../data'

import { AlertListResponseDataItem } from '../@types'
import { sortData } from '../utils/utils'

export default class AlertsService {
  constructor(private readonly alertsApiClient: AlertsApiClient) {}

  async getAlerts(): Promise<AlertListResponseDataItem[]> {
    const { alertsApiClient } = this
    const alertData = await alertsApiClient.getAlerts()
    console.log('alertData: ', alertData)
    // const alerts = alertData.labels.//.sort(sortData)

    return alertData
  }
}
