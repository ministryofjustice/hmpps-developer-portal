import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { formatActiveAgencies, getComponentName, getEnvironmentName, utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService, redisService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({
      name: 'hmpps-github-discovery-incremental',
    })
    return res.render('pages/environments', {
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
    const { environments } = component
    const prodEnvData = component.environments?.filter(environment => environment.name === 'prod')
    const alertsSlackChannel = prodEnvData.length === 0 ? '' : prodEnvData[0].alerts_slack_channel
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
      environments,
      alerts_slack_channel: alertsSlackChannel,
      github_enforce_admins_enabled: component.github_enforce_admins_enabled,
    }

    return res.render('pages/component', { component: displayComponent })
  })

  get('/:componentName/environment/:environmentName', async (req, res) => {
    const componentName = getComponentName(req)
    const environmentName = getEnvironmentName(req)

    const component = await serviceCatalogueService.getComponent({ componentName })
    const environments = component.environments?.filter(environment => environment.name === environmentName)
    const activeAgencies =
      environments.length === 0 ? '' : formatActiveAgencies(environments[0].active_agencies as Array<string>)
    const allowList = new Map()

    if (environments[0].ip_allow_list && environments[0].ip_allow_list_enabled) {
      const ipAllowListFiles = Object.keys(environments[0].ip_allow_list)

      ipAllowListFiles.forEach(fileName => {
        // @ts-expect-error Suppress any declaration
        Object.keys(environments[0].ip_allow_list[fileName]).forEach(item => {
          if (item === 'generic-service') {
            allowList.set('groups', [])
            // @ts-expect-error Suppress any declaration
            const genericService = environments[0].ip_allow_list[fileName]['generic-service']
            Object.keys(genericService).forEach(ipName => {
              if (ipName !== 'groups') {
                allowList.set(ipName, genericService[ipName])
              } else {
                allowList.set(ipName, Array.from([...new Set([...allowList.get(ipName), ...genericService[ipName]])]))
              }
            })
          } else {
            // @ts-expect-error Suppress any declaration
            allowList.set(item, environments[0].ip_allow_list[fileName][item])
          }
        })
      })
    }

    const displayComponent = {
      name: componentName,
      api: component.api,
      environment: environments[0],
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
