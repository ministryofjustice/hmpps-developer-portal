import { URLSearchParams } from 'url'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { AlertListResponseDataItem } from '../@types'

export default class AlertsApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient('alertsApiClient', config.apis.alertManager as ApiConfig, '')
  }

  async getAlerts(): Promise<AlertListResponseDataItem[]> {
    const urlFilter = 'businessUnit="hmpps"'
    return this.restClient.get({
      path: '/alerts',
      query: `${new URLSearchParams(urlFilter).toString()}`,
    })
  }

  async getAlertsForComponent(application: string): Promise<AlertListResponseDataItem[]> {
    return this.restClient.get({
      path: '/alerts',
      query: `filter=application="${application}"`,
    })
  }
}
