import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { getComponentName } from '../utils/utils'

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

  get('/:componentName', async (req, res) => {
    const componentName = getComponentName(req)

    const component = await serviceCatalogueService.getComponent(componentName)

    const displayComponent = {
      name: componentName,
      api: component.api,
      environments: component.environments,
    }

    return res.render('pages/driftRadiator', { component: displayComponent })
  })

  get('/queue/:componentName/*', async (req, res) => {
    const componentName = getComponentName(req)
    const queueInformation = req.params[0]

    logger.info(`Queue call for ${componentName} with ${queueInformation}`)

    const component = await serviceCatalogueService.getComponent(componentName)

    const streams = component.environments
      .map(e => `version:${component.name}:${e.name}`)
      .map((key, id) => ({ key, id: `${id}` }))

    const messages = await redisService.readStream(streams)

    return res.send(messages)
  })

  return router
}
