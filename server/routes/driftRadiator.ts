import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Component } from '../data/strapiApiTypes'

export default function routes({ serviceCatalogueService, redisService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const rawComponents = await serviceCatalogueService.getComponents()

    const components = rawComponents
      .map(({ attributes: component }) => component)
      .filter(component => component.environments?.length)
      .map(component => component.name)

    return res.render('pages/driftRadiator', { components })
  })

  get('/data', async (req, res) => {
    const components = await serviceCatalogueService.getComponents()

    return res.send(components)
  })

  const toComponentView = (component: Component) => ({
    name: component.name,
    environments: component.environments.map((env, i) => ({
      id: `${component.name}_${env.name}`,
      name: env.name,
      componentName: component.name,
      streamName: `version:${component.name}:${env.name}`,
      devEnvId: `${component.name}_${component.environments[0].name}`,
      prodEnvId: `${component.name}_${component.environments.at(-1).name}`,
      isDev: i === 0,
    })),
  })

  post('/components.json', async (req, res) => {
    const { componentNames } = req.body as Record<string, string[]>

    const allComponents = await serviceCatalogueService.getComponents()
    const components = allComponents
      .filter(c => componentNames.includes(c.attributes.name))
      .map(c => toComponentView(c.attributes))
    return res.send(components)
  })

  post('/queue', async (req, res) => {
    const streams = Object.keys(req.body?.streams).map(queueName => ({
      key: queueName,
      id: req.body?.streams[queueName],
    }))

    const messages = await redisService.readStream(streams)

    return res.send(messages)
  })

  return router
}
