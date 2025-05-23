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

    describe('getAlertsForComponent', () => {
      it('should return alerts for a specific component via API filter', async () => {
        const testAlertsComp = [
          { annotations: { message: 'Message1' }, labels: { alertname: 'A1', application: 'comp1' } },
          { annotations: { message: 'Message2' }, labels: { alertname: 'A2', application: 'comp1' } },
        ] as AlertListResponseDataItem[]
        fakeAlertsApi.get('/alerts?filter=application="comp1"').reply(200, testAlertsComp)
        const output = await alertsApiClient.getAlertsForComponent('comp1')
        expect(output).toEqual(testAlertsComp)
      })
    })
  })
})
