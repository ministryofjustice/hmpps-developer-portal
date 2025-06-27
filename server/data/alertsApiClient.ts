import { URLSearchParams } from 'url'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { Alert } from '../@types'

export default class AlertsApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient('alertsApiClient', config.apis.alertManager as ApiConfig, '')
  }

  async getAlerts(): Promise<Alert[]> {
    // const urlFilter = 'businessUnit="hmpps"'
    const urlFilter = 'filter=businessUnit="hmpps"'

    return this.restClient.get({
      path: '/alerts',
      query: `${new URLSearchParams(urlFilter).toString()}`,
    })
  }

  async getAlertsForComponent(application: string): Promise<Alert[]> {
    return this.restClient.get({
      path: '/alerts',
      query: `filter=application="${application}"`,
    })
  }
}
