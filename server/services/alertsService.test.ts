import AlertsApiClient from '../data/alertsApiClient'
import { Alert } from '../@types'
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
      const testAlertsResponse = [alert1, alert2] as Alert[]
      const testAlerts = [alert1, alert2] as Alert[]

      it('should return an array of alerts', async () => {
        alertsApiClient.getAlerts.mockResolvedValue(testAlertsResponse)

        const results = await alertsService.getAlerts()

        expect(alertsApiClient.getAlerts).toHaveBeenCalledTimes(1)
        expect(results).toEqual(testAlerts)
      })
    })

    describe('getAlertsForComponent', () => {
      it('should return only alerts matching the component name', async () => {
        const compAlert = {
          annotations: { message: 'Comp1 message' },
          labels: { alertname: 'AlertComp1', application: 'comp1' },
        } as Alert
        const testAlertsComp = [compAlert]
        alertsApiClient.getAlertsForComponent.mockResolvedValue(testAlertsComp)

        const results = await alertsService.getAlertsForComponent('comp1')

        expect(alertsApiClient.getAlertsForComponent).toHaveBeenCalledWith('comp1')
        expect(results).toEqual(testAlertsComp)
      })
    })
  })
})
