import { Router } from 'express'
import config from '../config'
import type { Services } from '../services'
import logger from '../../logger'
import {
  formatActiveAgencies,
  getComponentName,
  getEnvironmentName,
  utcTimestampToUtcDateTime,
  mapToCanonicalEnv,
  formatTimeStamp,
} from '../utils/utils'
import { Environment } from '../data/strapiApiTypes'
import {
  getProductionEnvironment,
  countTrivyHighAndCritical,
  countVeracodeHighAndVeryHigh,
} from '../utils/vulnerabilitySummary'
import { compareComponentsDependencies } from '../services/dependencyComparison'

interface DisplayAlert {
  alertname: string
  environment: string
  summary: string
  message: string
}

export default function routes({
  serviceCatalogueService,
  redisService,
  alertsService,
  recommendedVersionsService,
}: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({
      name: 'hmpps-github-discovery-incremental',
    })
    return res.render('pages/components', {
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
    const productionEnvironment = getProductionEnvironment(envs)
    const alertsSlackChannel = productionEnvironment?.alerts_slack_channel ?? ''

    const trivyVulnerabilityCount = countTrivyHighAndCritical(productionEnvironment?.trivy_scan?.scan_summary?.summary)
    const veracodeVulnerabilityCount = countVeracodeHighAndVeryHigh(component.veracode_results_summary)
    const displayComponent = {
      name: component.name,
      description: component.description,
      archived: component.archived,
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
      product: component.product,
      versions: component.versions,
      dependencyTypes: dependencies.categories,
      dependents: dependencies.dependents,
      dependencies: dependencies.dependencies,
      envs,
      alerts_slack_channel: alertsSlackChannel,
      github_enforce_admins_enabled: component.github_enforce_admins_enabled,
      standardsCompliance: component.standards_compliance,
      alerts: [] as DisplayAlert[],
      trivyVulnerabilityCount,
      veracodeVulnerabilityCount,
      trivyResultsLink: `/trivy-scans/${component.name}/environments/prod`,
      veracodeResultsLink: component.veracode_results_url || '/veracode',
    }

    let alerts: DisplayAlert[] = []
    try {
      const allAlerts = await alertsService.getAlertsForComponent(componentName)
      alerts = allAlerts
        .filter(alert => alert.status?.state === 'active')
        .map(alert => ({
          alertname: alert.labels?.alertname ?? '',
          startsAt: formatTimeStamp(alert.startsAt) ?? '',
          environment: mapToCanonicalEnv(alert.labels?.environment ?? ''),
          summary: alert.annotations?.summary ?? '',
          message: alert.annotations?.message ?? '',
        }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Error fetching alerts for ${componentName}: ${msg}`)
    }
    displayComponent.alerts = alerts

    const hasAlerts = alerts && alerts.length > 0

    let upgradeNeeded = false

    const isKotlin = (component.language || '') === 'Kotlin'
    const { kotlinOnly } = config.recommendedVersions

    // Dependency comparison for this component
    if (!kotlinOnly || isKotlin) {
      try {
        const recommended = await recommendedVersionsService.getRecommendedVersions()
        const comparison = compareComponentsDependencies([component], recommended)
        ;(displayComponent as Record<string, unknown>).dependencyComparison = comparison

        const { totalItems, aligned, needsUpgrade, aboveBaseline, missing } = comparison.summary
        logger.debug(
          `[DependencyComparison] component=${component.name} source=${comparison.recommendedSource} items=${totalItems} aligned=${aligned} needsUpgrade=${needsUpgrade} aboveBaseline=${aboveBaseline} missing=${missing}`,
        )
        const nonAligned = comparison.items.filter(items => items.status !== 'aligned')
        const previewCount = Math.min(10, nonAligned.length)
        if (previewCount > 0) {
          const preview = nonAligned
            .slice(0, previewCount)
            .map(
              item =>
                `${item.componentName}:${item.key} current=${item.current ?? 'missing'} → recommended=${item.recommended ?? 'missing'} [${item.status}]`,
            )
            .join('; ')
          logger.debug(
            `[DependencyComparison] component details (first ${previewCount} of ${nonAligned.length} non-aligned): ${preview}`,
          )

          upgradeNeeded =
            (component.language === 'Kotlin' && comparison.summary.needsAttention > 0) ||
            comparison.summary.needsUpgrade > 0
        }
      } catch (e) {
        logger.warn(`[DependencyComparison] Failed for component='${component.name}': ${String(e)}`)
      }
    }

    return res.render('pages/component', { component: displayComponent, upgradeNeeded, hasAlerts })
  })

  router.get('/:componentName/environment/:environmentName', async (req, res) => {
    const componentName = getComponentName(req)
    const environmentName = getEnvironmentName(req)

    const component = await serviceCatalogueService.getComponent({ componentName })
    const filteredEnvironment = component.envs?.filter(environment => environment.name === environmentName)
    const envAttributes = filteredEnvironment.length === 0 ? ({} as Environment) : filteredEnvironment[0]
    const activeAgencies =
      filteredEnvironment.length === 0 ? '' : formatActiveAgencies(envAttributes.active_agencies as Array<string>)
    const allowList = new Map()

    if (envAttributes.ip_allow_list && envAttributes.ip_allow_list_enabled) {
      const ipAllowListFiles = Object.keys(envAttributes.ip_allow_list)
      allowList.set('groups', [])
      ipAllowListFiles.forEach(fileName => {
        Object.keys(envAttributes.ip_allow_list[fileName]).forEach(item => {
          if (item === 'generic-service') {
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
      product: component.product,
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
