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
