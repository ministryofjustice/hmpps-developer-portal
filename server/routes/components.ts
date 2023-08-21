import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
// import { forever } from 'async'
// import { commandOptions } from 'redis'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Environment } from '../data/strapiApiTypes'
// import { createRedisClient } from '../data/redisClient'
// import logger from '../../logger'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/components')
  })

  get('/data', async (req, res) => {
    const components = await serviceCatalogueService.getComponents()

    return res.send(components)
  })

  get('/queue', async (req, res) => {
    const componentsData = await serviceCatalogueService.getComponents()
    const components = componentsData
      .map(component => {
        const environmentNames = component.attributes.environments?.map((environment: Environment) => {
          return [
            {
              key: `health:${component.attributes.name}:${environment.name}`,
              id: '0-0',
            },
            {
              key: `info:${component.attributes.name}:${environment.name}`,
              id: '0-0',
            },
            {
              key: `version:${component.attributes.name}:${environment.name}`,
              id: '0-0',
            },
          ]
        })

        return environmentNames
      })
      .flat(2)

    // const client = createRedisClient()
    // client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

    // forever(
    //   next => {
    //     try {
    //       const response = client.xRead(
    //         commandOptions({}), // uses new connection from pool not to block other redis calls
    //         components,
    //         { COUNT: 10, BLOCK: 10 },
    //       )
    //       logger.info('START')
    //       logger.info(response)
    //       logger.info('END')
    //     } catch (err) {
    //       logger.error(err)
    //       next(err)
    //     }
    //     next()
    //   },
    //   err => logger.error(err),
    // )

    return res.send(components)
  })

  get('/:componentId', async (req, res) => {
    const componentId = getComponentId(req)
    const component = await serviceCatalogueService.getComponent(componentId)
    const environments = component.environments?.map(environment => environment)

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
      environments,
    }

    return res.render('pages/component', { component: displayComponent })
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
