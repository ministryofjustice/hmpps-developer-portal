import { Router } from 'express'
import type { Services } from '../services'
import logger from '../../logger'
import { formatActiveAgencies, getComponentName, getEnvironmentName, utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService, redisService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({
      name: 'hmpps-github-discovery-incremental',
    })
    return res.render('pages/environments', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const components = await serviceCatalogueService.getComponents()

    res.send(components)
  })

  router.get('/:componentName', async (req, res) => {
    const componentName = getComponentName(req)
    const component = await serviceCatalogueService.getComponent({ componentName })
    const dependencies = (await redisService.getAllDependencies()).getDependencies(componentName)
    const { envs } = component
    const prodEnvData = component.envs?.find(environment => environment.name === 'prod')
    const alertsSlackChannel = prodEnvData.alerts_slack_channel
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
      appInsightsAlertsEnabled: component.app_insights_cloud_role_name
        ? (component.app_insights_alerts_enabled ?? true)
        : 'N/A',
      api: component.api,
      frontEnd: component.frontend,
      partOfMonorepo: component.part_of_monorepo,
      language: component.language,
      product: component.product,
      versions: component.versions,
      dependencyTypes: dependencies.categories,
      dependents: dependencies.dependents,
      dependencies: dependencies.dependencies,
      envs,
      alerts_slack_channel: alertsSlackChannel,
      github_enforce_admins_enabled: component.github_enforce_admins_enabled,
    }

    return res.render('pages/component', { component: displayComponent })
  })

  router.get('/:componentName/environment/:environmentName', async (req, res) => {
    const componentName = getComponentName(req)
    const environmentName = getEnvironmentName(req)

    const component = await serviceCatalogueService.getComponent({ componentName })
    const envAttributes = component.envs?.find(envs => envs.name === environmentName)

    const activeAgencies = envAttributes ? '' : formatActiveAgencies(envAttributes.active_agencies as Array<string>)
    const allowList = new Map()

    if (envAttributes.ip_allow_list && envAttributes?.ip_allow_list_enabled) {
      const ipAllowListFiles = Object.keys(envAttributes.ip_allow_list)

      ipAllowListFiles.forEach(fileName => {
        Object.keys(envAttributes.ip_allow_list[fileName]).forEach(item => {
          if (item === 'generic-service') {
            allowList.set('groups', [])
            const genericService = envAttributes.ip_allow_list[fileName]['generic-service']
            Object.keys(genericService).forEach(ipName => {
              if (ipName !== 'groups' && typeof genericService === 'object') {
                allowList.set(ipName, genericService[ipName])
              } else {
                const groups = genericService as Record<string, string>
                allowList.set(ipName, Array.from([...new Set([...allowList.get(ipName), ...groups[ipName]])]))
              }
            })
          } else {
            allowList.set(item, envAttributes.ip_allow_list[fileName][item])
          }
        })
      })
    }

    const displayComponent = {
      name: componentName,
      api: component.api,
      environment: envAttributes,
      activeAgencies,
      allowList,
    }

    return res.render('pages/environment', { component: displayComponent })
  })

  router.get('/queue/:componentName/:environmentName/:queueInformation', async (req, res) => {
    const componentName = getComponentName(req)
    const environmentName = getEnvironmentName(req)
    const queueInformation = req.params?.queueInformation ?? ''
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
