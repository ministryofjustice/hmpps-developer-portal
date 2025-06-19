import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import {
  formatActiveAgencies,
  getComponentName,
  getEnvironmentName,
  utcTimestampToUtcDateTime,
  mapToCanonicalEnv,
} from '../utils/utils'

interface DisplayAlert {
  alertname: string
  environment: string
  summary: string
  message: string
}

export default function routes({ serviceCatalogueService, redisService, alertsService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({
      name: 'hmpps-github-discovery-incremental',
    })
    return res.render('pages/components', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  get('/data', async (req, res) => {
    const components = await serviceCatalogueService.getComponents()

    res.send(components)
  })

  get('/:componentName', async (req, res) => {
    const componentName = getComponentName(req)
    const component = await serviceCatalogueService.getComponent({ componentName })
    const dependencies = (await redisService.getAllDependencies()).getDependencies(componentName)
    const { envs } = component
    const prodEnvData = component.envs?.data?.filter(environment => environment.attributes.name === 'prod')
    const alertsSlackChannel = prodEnvData.length === 0 ? '' : prodEnvData[0].attributes.alerts_slack_channel
    const displayComponent = {
      name: component.name,
      description: component.description,
      title: component.title,
      jiraProjectKeys: component.jira_project_keys,
      githubWrite: component.github_project_teams_write,
      githubAdmin: component.github_project_teams_admin,
      githubRestricted: component.github_project_branch_protection_restricted_teams,
      githubRepo: component.github_repo,
      githubVisibility: component.github_project_visibility,
      appInsightsName: component.app_insights_cloud_role_name,
      api: component.api,
      frontEnd: component.frontend,
      partOfMonorepo: component.part_of_monorepo,
      language: component.language,
      product: component.product?.data,
      versions: component.versions,
      dependencyTypes: dependencies.categories,
      dependents: dependencies.dependents,
      dependencies: dependencies.dependencies,
      envs,
      alerts_slack_channel: alertsSlackChannel,
      github_enforce_admins_enabled: component.github_enforce_admins_enabled,
      standardsCompliance: component.standards_compliance,
      alerts: [] as DisplayAlert[],
    }

    let alerts: DisplayAlert[] = []
    try {
      const allAlerts = await alertsService.getAlertsForComponent(componentName)
      alerts = allAlerts
        .filter(alert => alert.status?.state === 'active')
        .map(alert => ({
          alertname: alert.labels?.alertname ?? '',
          environment: mapToCanonicalEnv(alert.labels?.environment ?? ''),
          summary: alert.annotations?.summary ?? '',
          message: alert.annotations?.message ?? '',
        }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Error fetching alerts for ${componentName}: ${msg}`)
    }
    displayComponent.alerts = alerts
    return res.render('pages/component', { component: displayComponent })
  })

  get('/:componentName/environment/:environmentName', async (req, res) => {
    const componentName = getComponentName(req)
    const environmentName = getEnvironmentName(req)

    const component = await serviceCatalogueService.getComponent({ componentName })
    const filteredEnvironment = component.envs?.data?.filter(
      environment => environment.attributes.name === environmentName,
    )
    const activeAgencies =
      filteredEnvironment.length === 0
        ? ''
        : formatActiveAgencies(filteredEnvironment[0].attributes.active_agencies as Array<string>)
    const allowList = new Map()

    if (filteredEnvironment[0].attributes.ip_allow_list && filteredEnvironment[0].attributes.ip_allow_list_enabled) {
      const ipAllowListFiles = Object.keys(filteredEnvironment[0].attributes.ip_allow_list)
      allowList.set('groups', [])
      ipAllowListFiles.forEach(fileName => {
        // @ts-expect-error Suppress any declaration
        Object.keys(filteredEnvironment[0].attributes.ip_allow_list[fileName]).forEach(item => {
          if (item === 'generic-service') {
            // @ts-expect-error Suppress any declaration
            const genericService = filteredEnvironment[0].attributes.ip_allow_list[fileName]['generic-service']
            Object.keys(genericService).forEach(ipName => {
              if (ipName !== 'groups') {
                allowList.set(ipName, genericService[ipName])
              } else {
                allowList.set(ipName, Array.from([...new Set([...allowList.get(ipName), ...genericService[ipName]])]))
              }
            })
          } else {
            // @ts-expect-error Suppress any declaration
            allowList.set(item, filteredEnvironment[0].attributes.ip_allow_list[fileName][item])
          }
        })
      })
    }

    const displayComponent = {
      name: componentName,
      product: component.product?.data,
      api: component.api,
      environment: filteredEnvironment[0].attributes,
      activeAgencies,
      allowList,
    }

    return res.render('pages/environment', { component: displayComponent })
  })

  get('/queue/:componentName/:environmentName/*', async (req, res) => {
    const componentName = getComponentName(req)
    const environmentName = getEnvironmentName(req)
    const queueInformation = req.params[0]
    const queueParams = Object.fromEntries(new URLSearchParams(queueInformation))

    logger.info(`Queue call for ${componentName} with ${queueInformation}`)

    const component = await serviceCatalogueService.getComponent({ componentName })
    const streams = [
      {
        key: `health:${component.name}:${environmentName}`,
        id: queueParams[`h:${environmentName}`],
      },
      {
        key: `info:${component.name}:${environmentName}`,
        id: queueParams[`i:${environmentName}`],
      },
      {
        key: `version:${component.name}:${environmentName}`,
        id: queueParams[`v:${environmentName}`],
      },
    ]

    const messages = await redisService.readStream(streams)

    res.send(messages)
  })

  return router
}
