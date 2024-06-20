import { type RequestHandler, Router } from 'express'
import dayjs from 'dayjs'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { formatActiveAgencies, getComponentName, getEnvironmentName, veracodeFilters } from '../utils/utils'

export default function routes({ serviceCatalogueService, redisService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/components')
  })

  get('/data', async (req, res) => {
    const components = await serviceCatalogueService.getComponents()

    return res.send(components)
  })

  get('/veracode', async (req, res) => {
    return res.render('pages/veracode')
  })

  get('/veracode/data', async (req, res) => {
    const resultFilters = getResultFilters(req.query.results as string)
    const exemptionFilters = getExemptionFilters(req.query.exemption as string)
    const allComponents = await serviceCatalogueService.getComponents(exemptionFilters)
    const passed = resultFilters.includes('passed')
    const failed = resultFilters.includes('failed')
    const unknown = resultFilters.includes('unknown')

    const rows = allComponents
      .filter(component => veracodeFilters(passed, failed, unknown, component.attributes.veracode_policy_rules_status))
      .map(component => {
        const hasVeracode = !!component.attributes.veracode_results_summary
        const severityLevels = {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          VERY_HIGH: 0,
        }

        component.attributes.veracode_results_summary?.severity?.forEach(severity => {
          severity.category.forEach(category => {
            severityLevels[category.severity] += category.count
          })
        })

        let result = 'Failed'

        if (!hasVeracode) {
          result = 'N/A'
        } else if (component.attributes.veracode_policy_rules_status === 'Pass') {
          result = 'Passed'
        }

        return {
          name: component.attributes.name,
          hasVeracode,
          result,
          report: hasVeracode ? component.attributes.veracode_results_url : 'N/A',
          date: hasVeracode
            ? dayjs(component.attributes.veracode_last_completed_scan_date).format('YYYY-MM-DD HH:mm')
            : 'N/A',
          codeScore: hasVeracode ? component.attributes.veracode_results_summary['static-analysis'].score : 0,
          severityLevels,
        }
      })

    return res.send(rows)
  })

  get('/:componentName', async (req, res) => {
    const componentName = getComponentName(req)
    const component = await serviceCatalogueService.getComponent({ componentName })
    const dependencies = await redisService.getDependencies(componentName)
    const { environments } = component

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
        Object.keys(environments[0].ip_allow_list[fileName]).forEach(item => {
          if (item === 'generic-service') {
            allowList.set('groups', [])
            const genericService = environments[0].ip_allow_list[fileName]['generic-service']
            Object.keys(genericService).forEach(ipName => {
              if (ipName !== 'groups') {
                allowList.set(ipName, genericService[ipName])
              } else {
                allowList.set(ipName, Array.from([...new Set([...allowList.get(ipName), ...genericService[ipName]])]))
              }
            })
          } else {
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

    return res.send(messages)
  })

  return router
}

const getResultFilters = (resultFilters: string): string[] => {
  if (!resultFilters) {
    return []
  }

  const resultFiltersToCheck = resultFilters.split(',')

  return resultFiltersToCheck.filter(resultFilter => ['passed', 'failed', 'unknown'].includes(resultFilter))
}

const getExemptionFilters = (exemptionFilters: string): string[] => {
  if (!exemptionFilters) {
    return []
  }

  const exemptionFiltersToCheck = exemptionFilters.split(',')

  return exemptionFiltersToCheck.filter(exemptionFilter => ['true', 'false'].includes(exemptionFilter))
}
