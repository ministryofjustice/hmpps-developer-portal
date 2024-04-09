import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { formatActiveAgencies, getComponentName, getEnvironmentName } from '../utils/utils'
import { ComponentListResponseDataItem } from '../data/strapiApiTypes'

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
    const filters = req.query.filters as string
    const doFilters = !!filters
    const selectedFilters = filters ? filters.split(',') : []
    const passed = selectedFilters.includes('passed')
    const failed = selectedFilters.includes('failed')
    const exempt = selectedFilters.includes('exempt')
    const nonExempt = selectedFilters.includes('nonExempt')
    const allComponents = await serviceCatalogueService.getComponents()
    console.log(doFilters)
    const components: ComponentListResponseDataItem[] = doFilters
      ? filterComponents(allComponents, { passed, failed, exempt, nonExempt })
      : allComponents
    const rows = components.map(component => {
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

      return {
        name: component.attributes.name,
        hasVeracode,
        result: component.attributes.veracode_policy_rules_status === 'Pass' ? 'Passed' : 'Failed',
        report: hasVeracode ? component.attributes.veracode_results_url : 'N/A',
        codeScore: hasVeracode ? component.attributes.veracode_results_summary['static-analysis'].score : 0,
        severityLevels,
      }
    })

    return res.send(rows)
  })

  get('/:componentName', async (req, res) => {
    const componentName = getComponentName(req)
    const component = await serviceCatalogueService.getComponent({ componentName })
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

    const displayComponent = {
      name: componentName,
      api: component.api,
      environment: environments[0],
      activeAgencies,
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

const filterComponents = (
  components: ComponentListResponseDataItem[],
  filters: {
    passed: boolean
    failed: boolean
    exempt: boolean
    nonExempt: boolean
  },
): ComponentListResponseDataItem[] => {
  if (
    (filters.passed && filters.failed && filters.exempt && filters.nonExempt) ||
    (!filters.passed && !filters.failed && filters.exempt && filters.nonExempt)
  ) {
    return components
  }

  const onlyPassed = filters.passed && !filters.failed && !filters.exempt && !filters.nonExempt
  const onlyFailed = !filters.passed && filters.failed && !filters.exempt && !filters.nonExempt
  const onlyExempt = !filters.passed && !filters.failed && filters.exempt && !filters.nonExempt
  const onlyNonExempt = !filters.passed && !filters.failed && !filters.exempt && filters.nonExempt

  const passedComponents = components.filter(
    component => filters.passed && component.attributes.veracode_policy_rules_status === 'Pass',
  )

  if (onlyPassed) {
    return passedComponents
  }

  const failedComponents = components.filter(
    component =>
      filters.failed &&
      component.attributes.veracode_policy_rules_status !== 'Pass' &&
      component.attributes.veracode_policy_rules_status !== null,
  )

  if (onlyFailed) {
    return failedComponents
  }

  const exemptComponents = components.filter(component => filters.exempt && component.attributes.veracode_exempt)

  if (onlyExempt) {
    return exemptComponents
  }

  const nonExemptComponents = components.filter(component => filters.nonExempt && !component.attributes.veracode_exempt)

  if (onlyNonExempt) {
    return nonExemptComponents
  }

  const combined = passedComponents.concat(failedComponents).concat(exemptComponents).concat(nonExemptComponents)
  const unique = [
    ...new Set(passedComponents.concat(failedComponents).concat(exemptComponents).concat(nonExemptComponents)),
  ] as ComponentListResponseDataItem[]

  const intersectionIds: number[] = []
  combined
    .sort((a, b) => a.id - b.id)
    .reduce((uniqueIds, component) => {
      const dupe = uniqueIds.includes(component.id)

      if (dupe && !intersectionIds.includes(component.id)) {
        intersectionIds.push(component.id)

        return uniqueIds
      }

      uniqueIds.push(component.id)

      return uniqueIds
    }, [])

  return unique.filter(component => intersectionIds.includes(component.id))
}
