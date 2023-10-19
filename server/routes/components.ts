import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'

export default function routes({ serviceCatalogueService, redisService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/components')
  })

  get('/dependencies', async (req, res) => {
    // const dependencies = await serviceCatalogueService.getDependencies()
    // const dropDownItems = dependencies.map(dependency => {
    //   const parts = dependency.split('::')

    //   return {
    //     value: dependency,
    //     text: parts[1],
    //   }
    // })

    // console.log(dependencies)
    return res.render('pages/dependencies')
  })

  post('/dependencies', async (req, res) => {
    const dependencyName = getDependencyNamePost(req)

    return res.render('pages/dependencies', { dependencyName })
  })

  get('/data', async (req, res) => {
    const components = await serviceCatalogueService.getComponents()

    return res.send(components)
  })

  get('/dependencies/data/:dependencyName', async (req, res) => {
    // hardwired for now
    const dependencyType = 'helm'
    const dependencyName = getDependencyName(req)
    const components = await serviceCatalogueService.getComponents()

    const displayComponents = components
      .filter(component => {
        return (
          component.attributes?.versions &&
          component.attributes?.versions[dependencyType] &&
          component.attributes?.versions[dependencyType].dependencies[dependencyName]
        )
      })
      .map(component => {
        return {
          id: component.id,
          componentName: component.attributes.name,
          dependencyVersion: component.attributes?.versions[dependencyType]?.dependencies[dependencyName],
        }
      })

    return res.send(displayComponents)
  })

  get('/queue/:componentId/:environmentName/*', async (req, res) => {
    const componentId = getComponentId(req)
    const environmentName = getEnvironmentName(req)
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
      versions: component.versions,
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

function getEnvironmentName(req: Request): string {
  const { environmentName } = req.params

  return ['dev', 'development', 'staging', 'stage', 'preprod', 'prod', 'production'].includes(environmentName)
    ? environmentName
    : ''
}

function getDependencyName(req: Request): string {
  const { dependencyName } = req.params

  return dependencyName.replace(/[^-a-z0-9]/g, '')
}

function getDependencyNamePost(req: Request): string {
  const { dependencyName } = req.body

  return dependencyName.replace(/[^-a-z0-9]/g, '')
}
