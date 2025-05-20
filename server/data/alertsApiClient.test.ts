import nock from 'nock'
import config from '../config'
import { AlertListResponseDataItem } from '../@types'
import AlertsApiClient from './alertsApiClient'

describe('alertsApiClient', () => {
  let fakeAlertsApi: nock.Scope
  let alertsApiClient: AlertsApiClient

  beforeEach(() => {
    fakeAlertsApi = nock(`${config.apis.alertManager.url}`)
    alertsApiClient = new AlertsApiClient()
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  const alert1 = {
    annotations: { message: 'This is an alert1' },
    labels: { alertname: 'Alert1' },
  }

  const alert2 = {
    annotations: { message: 'This is an alert2' },
    labels: { alertname: 'Alert2' },
  }

  describe('Alerts', () => {
    describe('getAlerts', () => {
      it('should return an array of alerts', async () => {
        const testAlerts = [alert1, alert2] as AlertListResponseDataItem[]
        fakeAlertsApi.get('/alerts?businessUnit="hmpps"').reply(200, testAlerts)
        const output = await alertsApiClient.getAlerts()
        expect(output).toEqual(testAlerts)
      })
    })
  })
})
