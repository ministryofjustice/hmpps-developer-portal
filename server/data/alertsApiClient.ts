import config from '../config'
import { AlertListResponseDataItem } from '../@types'

export default class AlertsApiClient {
  async getAlerts(): Promise<AlertListResponseDataItem[]> {
    const alertManagerEndpoint = `${config.apis.alertManager.url}/alerts`
    const urlFilter = 'filter=businessUnit="hmpps"'
    return fetch(`${alertManagerEndpoint}?${urlFilter}`)
      .then(res => res.json())
      .then(res => {
        return res as AlertListResponseDataItem[]
      })
  }
}
