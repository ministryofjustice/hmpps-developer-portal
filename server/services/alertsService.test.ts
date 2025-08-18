import { Request } from 'express'
import AlertsApiClient from '../data/alertsApiClient'
import { Alert } from '../@types'
import { Environment } from '../data/strapiApiTypes'
import type { Team } from '../data/modelTypes'
import type { ServiceCatalogueService } from '.'
import AlertsService from './alertsService'
import * as utils from '../utils/utils'

jest.mock('../data/alertsApiClient')
jest.mock('../utils/utils')

describe('Alerts service', () => {
  const alertsApiClient = new AlertsApiClient() as jest.Mocked<AlertsApiClient>

  let alertsService: AlertsService

  const AlertsApiClientFactory = jest.fn()
  type AlertTypeParams = { alertType: string }

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

    describe('addNewPropertiesToAlert', () => {
      it('should return updated alerts conatining slack channel and team properties', async () => {
        const revisedAlerts = [{ labels: { alert_slack_channel: '#exampleApp', application: 'exampleApp' } }] as Alert[]
        const environments = [
          { alert_severity_label: 'exampleApp', alerts_slack_channel: '#exampleApp' },
        ] as Environment[]
        const teams = [{ name: 'Maintenance Team' }] as Team[]
        ;(utils.findTeamMatch as jest.Mock).mockReturnValue({ name: 'Maintenance Team' })

        const result = await alertsService.addNewPropertiesToAlert(revisedAlerts, environments, teams)

        expect(utils.findTeamMatch).toHaveBeenCalledWith(teams, 'exampleApp')
        expect(result[0].labels.alert_slack_channel).toBe('#exampleApp')
        expect(result[0].labels.team).toBe('Maintenance Team')
        expect(utils.findTeamMatch).toHaveBeenCalledWith(teams, 'exampleApp')
      })

      it('leaves alert unchanged if no matches', async () => {
        const revisedAlerts = [{ labels: { alert_slack_channel: '#exampleApp', application: 'exampleApp' } }] as Alert[]
        const environments = [] as Environment[]
        const teams = [] as Team[]
        ;(utils.findTeamMatch as jest.Mock).mockReturnValue({ undefined })
        const result = await alertsService.addNewPropertiesToAlert(revisedAlerts, environments, teams)

        expect(utils.findTeamMatch).toHaveBeenCalledWith(teams, 'exampleApp')
        expect(result[0]).toEqual(revisedAlerts[0])
      })
    })

    describe('mapAlertEnvironments', () => {
      it.each([
        ['Environment "development"', 'development', 'dev'],
        ['Environment "DEV1"', 'DEV1', 'dev'],
        ['Environment "testing"', 'testing', 'test'],
        ['Environment "staging"', 'staging', 'stage'],
        ['Environment "STAGE"', 'STAGE', 'stage'],
        ['Environment "user"', 'user', 'uat'],
        ['Environment "preprod"', 'preprod', 'preprod'],
        ['Environment "live"', 'live', 'prod'],
        ['Environment "prd"', 'prd', 'prod'],
        ['Invalid environment "unknownenv"', 'unknownenv', 'none'],
        ['Empty environment', '', 'none'],
      ])('%s mapAlertEnvironments() with "%s" should return "%s"', async (_, a, expected) => {
        const mockAlert = [{ labels: { application: 'exampleApp', environment: a } }] as Alert[]
        ;(utils.mapToCanonicalEnv as jest.Mock).mockReturnValue(expected)

        expect((await (0, alertsService.mapAlertEnvironments)(mockAlert))[0].labels.environment).toBe(expected)
        expect(utils.mapToCanonicalEnv).toHaveBeenCalledWith(a)
      })
    })

    describe('reviseAlerts', () => {
      it('should map environment keys to the alert environment and add alert_slack_channel and team properties to alert', async () => {
        const alerts = [{ labels: { application: 'exampleApp', environment: 'development' } }] as Alert[]
        const environments = [{ name: 'preprod' }] as Environment[]
        const teams = [{ name: 'Maintenance Team' }] as Team[]
        const revisedEnvAlerts = [{ labels: { application: 'exampleApp', environment: 'dev' } }] as Alert[]
        const revisedAlerts = [
          {
            labels: {
              application: 'exampleApp',
              environment: 'dev',
              alert_slack_channel: '#example-app',
              team: 'Maintenance Team',
            },
          },
        ] as Alert[]

        jest.spyOn(alertsService, 'mapAlertEnvironments').mockReturnValue(Promise.resolve(revisedEnvAlerts))
        jest.spyOn(alertsService, 'addNewPropertiesToAlert').mockReturnValue(Promise.resolve(revisedAlerts))

        const result = await alertsService.reviseAlerts(alerts, environments, teams)

        expect(alertsService.mapAlertEnvironments).toHaveBeenCalledWith(alerts)
        expect(alertsService.addNewPropertiesToAlert).toHaveBeenCalledWith(revisedEnvAlerts, environments, teams)
        expect(result[0].labels.environment).toBe('dev')
        expect(result[0].labels.alert_slack_channel).toBe('#example-app')
        expect(result[0].labels.team).toBe('Maintenance Team')
      })

      it('should map environment to "none" and not add further properties', async () => {
        const alerts = [{ labels: { application: 'exampleApp', environment: '' } }] as Alert[]
        const environments = [{ name: '' }] as Environment[]
        const teams = [{ name: '' }] as Team[]
        const revisedEnvAlerts = [{ labels: { application: 'exampleApp', environment: 'none' } }] as Alert[]
        const revisedAlerts = [{ labels: { application: 'exampleApp', environment: 'none' } }] as Alert[]

        jest.spyOn(alertsService, 'mapAlertEnvironments').mockReturnValue(Promise.resolve(revisedEnvAlerts))
        jest.spyOn(alertsService, 'addNewPropertiesToAlert').mockReturnValue(Promise.resolve(revisedAlerts))

        const result = await alertsService.reviseAlerts(alerts, environments, teams)

        expect(alertsService.mapAlertEnvironments).toHaveBeenCalledWith(alerts)
        expect(alertsService.addNewPropertiesToAlert).toHaveBeenCalledWith(revisedEnvAlerts, environments, teams)
        expect(result[0].labels.environment).toBe('none')
        expect(result[0].labels.alert_slack_channel).toBe(undefined)
        expect(result[0].labels.team).toBe(undefined)
      })
    })

    describe('getAndSortAlerts', () => {
      const alerts = [
        { labels: { application: 'exampleApp', environment: 'development' } },
        { labels: { application: 'exampleApp2', environment: 'production' } },
      ] as Alert[]
      const environments = [{ name: 'preprod' }] as Environment[]
      const teams = [
        { name: 'Maintenance Team', slack_channel_name: 'maintenance-team' },
        { name: 'Maintenance Team', slack_channel_name: 'maintenance-team' },
      ] as Team[]
      const revisedAlerts = [
        {
          labels: {
            application: 'exampleApp',
            environment: 'dev',
            alert_slack_channel: '#example-app',
            team: 'Maintenance Team',
          },
        },
      ] as Alert[]

      const mockServiceCatalogueService: Partial<jest.Mocked<ServiceCatalogueService>> = {
        getEnvironments: jest.fn().mockResolvedValue(environments),
        getTeams: jest.fn().mockResolvedValue(teams),
      }
      it('should get alerts, environments and teams then add ', async () => {
        jest.spyOn(alertsService, 'getAlerts').mockReturnValue(Promise.resolve(alerts))
        jest.spyOn(alertsService, 'reviseAlerts').mockReturnValue(Promise.resolve(revisedAlerts))

        const result = await alertsService.getAndSortAlerts(
          mockServiceCatalogueService as unknown as ServiceCatalogueService,
        )

        expect(alertsService.getAlerts).toHaveBeenCalled()
        expect(mockServiceCatalogueService.getEnvironments).toHaveBeenCalled()
        expect(mockServiceCatalogueService.getTeams).toHaveBeenCalledWith({ withComponents: true })
        expect(alertsService.reviseAlerts).toHaveBeenCalled()
        expect(result[0].labels.environment).toBe('dev')
        expect(result[0].labels.alert_slack_channel).toBe('#example-app')
        expect(result[0].labels.team).toBe('Maintenance Team')
      })
    })

    describe('getAlertEnvironments', () => {
      it('should extract unique canonical environment values from actual alerts and deduplicate, then format for dropdown with blank default option', async () => {
        const alerts = [
          { labels: { application: 'exampleApp1', environment: 'development' } },
          { labels: { application: 'exampleApp2', environment: '' } },
          { labels: { application: 'exampleApp3', environment: 'preprod' } },
          { labels: { application: 'exampleApp4', environment: 'production' } },
          { labels: { application: 'exampleApp5', environment: 'staging' } },
        ] as Alert[]
        const alertEnvironments = ['dev', 'none', 'preprod', 'prod', 'stage']

        jest.spyOn(alertsService, 'getAlerts').mockReturnValue(Promise.resolve(alerts))
        alertEnvironments.forEach(env => {
          ;(utils.mapToCanonicalEnv as jest.Mock).mockReturnValueOnce(env)
        })

        const result = await alertsService.getAlertEnvironments()

        expect(alertsService.getAlerts).toHaveBeenCalled()
        expect(utils.mapToCanonicalEnv).toHaveBeenCalledTimes(5)
        expect(result.map(r => r.value)).toEqual(['', 'dev', 'none', 'preprod', 'prod', 'stage'])
        expect(result.map(r => r.text)).toEqual(['', 'dev', 'none', 'preprod', 'prod', 'stage'])
        expect(result.map(r => r.selected)).toEqual([true, false, false, false, false, false])
      })
    })

    describe('getAlertType', () => {
      it.each([
        ['Valid type application', 'application', 'application'],
        ['Valid type environment', 'environment', 'environment'],
        ['Valid type namespace', 'namespace', 'namespace'],
        ['Invalid type test23', 'test23', 'all'],
        ['Empty type', '', 'all'],
      ])('%s getAlertType() with "%s" should return "%s"', (_, a, expected) => {
        const mockRequest = {
          params: { alertType: a },
        } as unknown as Request<AlertTypeParams>
        expect((0, alertsService.getAlertType)(mockRequest)).toBe(expected)
      })
    })
    describe('getAlertName', () => {
      it.each([
        ['Already clean', 'application', 'application'],
        ['Invalid characters', 'exampleApp & service', 'exampleApp & service'],
        ['Invalid characters', 'example_application', 'example_application'],
        ['Empty string', '', ''],
      ])('%s getMonitorType() with "%s" should return "%s"', (_, a, expected) => {
        const mockRequest = {
          params: { alertName: a },
        } as unknown as Request<AlertTypeParams>
        expect((0, alertsService.getAlertName)(mockRequest)).toBe(expected)
      })
    })
  })
})
