import type { PingdomApiClient, RestClientBuilder } from '../data'
import { Check, Checks } from '../data/pingdomApiTypes'

export default class PingdomService {
  constructor(private readonly pingdomApiClientFactory: RestClientBuilder<PingdomApiClient>) {}

  async getChecks(): Promise<Checks> {
    const pingdomApiClient = this.pingdomApiClientFactory('')
    const checks = await pingdomApiClient.getChecks()

    return checks
  }
}
