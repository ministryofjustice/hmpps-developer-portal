import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getComponentName } from '../utils/utils'
import type { Component, Environment } from '../data/strapiApiTypes'

export default function routes({ serviceCatalogueService, redisService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const toEnv = (component: Component, env: Environment, index: number) => ({
    id: `${component.name}_${env.name}`,
    name: env.name,
    componentName: component.name,
    streamName: `version:${component.name}:${env.name}`,
    devEnvId: `${component.name}_${component.environments[0].name}`,
    prodEnvId: `${component.name}_${component.environments.at(-1).name}`,
    isDev: index === 0,
  })

  get('/', async (req, res) => {
    const rawComponents = await serviceCatalogueService.getComponents()

    const components = rawComponents
      .map(({ attributes: component }) => component)
      .filter(component => component.environments?.length)
      .map(component => ({
        name: component.name,
        environments: component.environments.map((env, i) => toEnv(component, env, i)),
      }))

    return res.render('pages/driftRadiator', { components })
  })

  get('/data', async (req, res) => {
    const components = await serviceCatalogueService.getComponents()

    return res.send(components)
  })

  get('/:componentName', async (req, res) => {
    const componentName = getComponentName(req)
    const component = await serviceCatalogueService.getComponent(componentName)

    const displayComponent = {
      name: component.name,
      environments: component.environments.map((env, i) => toEnv(component, env, i)),
    }

    return res.render('pages/driftRadiator', { components: [displayComponent] })
  })

  post('/queue', async (req, res) => {
    const streams = Object.keys(req.body?.streams).map(queueName => {
      return {
        key: queueName,
        id: req.body?.streams[queueName],
      }
    })

    const messages = await redisService.readStream(streams)

    return res.send(messages)
  })

  return router
}
