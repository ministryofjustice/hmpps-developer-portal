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

    // describe('mapAlertEnvironments', () => {
    //     it('should map alert environment variants to canonical forms', () => {
    //       const alertsList = [
    //         { id: 1, labels: { environment: 'development' } },
    //         { id: 2, labels: { environment: 'DEV1' } },
    //         { id: 3, labels: { environment: 'prod' } },
    //         { id: 4, labels: { environment: 'production' } },
    //         { id: 5, labels: { environment: 'uat' } },
    //         { id: 6, labels: { environment: 'STAGE' } },
    //         { id: 7, labels: { environment: 'Preprod' } },
    //         { id: 8, labels: { environment: 'unknownenv' } },
    //         { id: 9, labels: { environment: '' } },
    //         { id: 10, labels: {} },
    //       ]
    //       const result = alertsService.mapAlertEnvironments(alertsList)
    //       expect(result[0].labels.environment).toBe('dev')
    //       expect(result[1].labels.environment).toBe('dev')
    //       expect(result[2].labels.environment).toBe('prod')
    //       expect(result[3].labels.environment).toBe('prod')
    //       expect(result[4].labels.environment).toBe('uat')
    //       expect(result[5].labels.environment).toBe('stage')
    //       expect(result[6].labels.environment).toBe('preprod')
    //       expect(result[7].labels.environment).toBe('none')
    //       expect(result[8].labels.environment).toBe('none')
    //       expect(result[9].labels.environment).toBeUndefined()
    //     })
    //   })
  })
})
