import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Environment } from '../data/strapiApiTypes'
import logger from '../../logger'

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

  get('/queue/:componentId/:environmentName/*', async (req, res) => {
    const componentId = getComponentId(req)
    const { environmentName } = req.params
    const queueInformation = req.params[0]
    const queueParams = Object.fromEntries(new URLSearchParams(queueInformation))

    logger.info(`Queue call for ${componentId} with ${queueInformation}`)

    const component = await serviceCatalogueService.getComponent(componentId)
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

  get('/:componentId', async (req, res) => {
    const componentId = getComponentId(req)
    const component = await serviceCatalogueService.getComponent(componentId)
    const environments = component.environments?.map(environment => environment)
    const environmentNames = environments.reduce((names, environment) => names.concat([environment.name]), [])

    const displayComponent = {
      id: componentId,
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
      environments,
      environmentNames,
    }

    return res.render('pages/component', { component: displayComponent })
  })

  get('/:componentId/environment/:environmentId', async (req, res) => {
    const componentId = getComponentId(req)
    const environmentId = getEnvironmentId(req)

    const component = await serviceCatalogueService.getComponent(componentId)
    const environments = component.environments?.filter(environment => environment.id === environmentId)

    const displayComponent = {
      id: componentId,
      name: component.name,
      environment: environments[0],
    }

    return res.render('pages/environment', { component: displayComponent })
  })

  return router
}

function getComponentId(req: Request): string {
  const { componentId } = req.params

  if (!Number.isInteger(Number.parseInt(componentId, 10))) {
    throw new BadRequest()
  }

  return componentId
}

function getEnvironmentId(req: Request): number {
  const { environmentId } = req.params

  if (!Number.isInteger(Number.parseInt(environmentId, 10))) {
    throw new BadRequest()
  }

  return Number.parseInt(environmentId, 10)
}
