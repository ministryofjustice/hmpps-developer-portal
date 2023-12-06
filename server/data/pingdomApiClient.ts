import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { Checks } from './pingdomApiTypes'

export default class PingdomApiClient {
  private restClient: RestClient

  constructor() {
    this.restClient = new RestClient('pingdomApiClient', config.apis.pingdom as ApiConfig)
  }

  async getChecks(): Promise<Checks> {
    return this.restClient.get({
      path: '/checks',
    })
  }
}
