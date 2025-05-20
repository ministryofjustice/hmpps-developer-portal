import AlertsApiClient from '../data/alertsApiClient'
import { AlertListResponseDataItem } from '../@types'
import AlertsService from './alertsService'

jest.mock('../data/alertsApiClient')

describe('Alerts service', () => {
  const alertsApiClient = new AlertsApiClient() as jest.Mocked<AlertsApiClient>

  let alertsService: AlertsService

  const AlertsApiClientFactory = jest.fn()

  beforeEach(() => {
    AlertsApiClientFactory.mockReturnValue(alertsApiClient)
    alertsService = new AlertsService(AlertsApiClientFactory)
  })

  afterEach(() => {
    jest.resetAllMocks()
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
      const testAlertsResponse = [alert1, alert2] as AlertListResponseDataItem[]
      const testAlerts = [alert1, alert2] as AlertListResponseDataItem[]

      it('should return an array of alerts', async () => {
        alertsApiClient.getAlerts.mockResolvedValue(testAlertsResponse)

        const results = await alertsService.getAlerts()

        expect(alertsApiClient.getAlerts).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testAlerts)
      })
    })
  })
})

// const alert2 = {
//   annotations: {
//     dashboard_url: 'alert2.com',
//     message: 'This is an alert',
//     runbook_url: 'alert2.com',
//   },
//   endsAt: '2025-05-16T15:36:41.337Z',
//   fingerprint: '000002a',
//   receivers: [
//     {
//       name: 'none'
//     },
//   ],
//   startsAt: '2025-05-12T17:05:41.337Z',
//   status: {
//     inhibitedBy: ['none'],
//     silencedBy: ['none'],
//     state: 'none'
//   },
//   updatedAt: '2025-05-16T15:32:41.344Z',
//   generatorURL: 'string',
//   labels: {
//     alertname: 'Alert2',
//     application: 'hmpps-service',
//     businessUnit: 'hmpps',
//     clusterName: 'hmpps-cluster',
//     environment: 'prod',
//     namespace: 'hmpps-namespace',
//     productId: '002',
//     prometheus: 'monitoring/prometheus',
//     queue_name: 'none',
//     severity: 'severe',
//   }
// }
