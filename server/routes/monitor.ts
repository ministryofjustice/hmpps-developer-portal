import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { Environment } from '../data/strapiApiTypes'
import { getNumericId, getMonitorName, getMonitorType } from '../utils/utils'

type MonitorEnvironment = {
  componentName: string
  environmentName: string
  environmentUrl: string
  environmentHealth: string
  environmentType: string
}

export default function routes({ serviceCatalogueService, redisService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get(['/', '/:monitorType/:monitorName'], async (req, res) => {
    const monitorType = getMonitorType(req)
    const monitorName = getMonitorName(req)
    logger.info(`Request for /monitor/${monitorType}/${monitorName}`)

    const serviceAreaList = await dataFilterService.getServiceAreasDropDownList({ serviceAreaName: monitorName })
    const teamList = await dataFilterService.getTeamsDropDownList({ teamName: monitorName })
    const productList = await dataFilterService.getProductsDropDownList({ productName: monitorName })

    return res.render('pages/monitor', {
      serviceAreaList,
      teamList,
      productList,
      monitorName,
      monitorType,
    })
  })

  get('/components/:monitorType/:monitorId?', async (req, res) => {
    const monitorType = getMonitorType(req)
    const monitorId = getNumericId(req, 'monitorId')
    const environments: MonitorEnvironment[] = []

    if (monitorType === 'product') {
      const product = await serviceCatalogueService.getProduct({
        productId: monitorId,
        withEnvironments: true,
      })

      product.components.data.forEach(component => {
        const typedEnvironments = component.attributes.environments as Environment[]

        typedEnvironments.forEach(environment => {
          if (environment.monitor) {
            environments.push({
              componentName: component.attributes.name as string,
              environmentName: environment.name as string,
              environmentUrl: environment.url as string,
              environmentHealth: environment.health_path as string,
              environmentType: environment.type as string,
            })
          }
        })
      })
    } else if (monitorType === 'team') {
      const team = await serviceCatalogueService.getTeam({ teamId: monitorId, withEnvironments: true })

      team.products.data.forEach(product => {
        product.attributes.components.data.forEach(component => {
          const typedEnvironments = component.attributes.environments as Environment[]

          typedEnvironments.forEach(environment => {
            if (environment.monitor) {
              environments.push({
                componentName: component.attributes.name as string,
                environmentName: environment.name as string,
                environmentUrl: environment.url as string,
                environmentHealth: environment.health_path as string,
                environmentType: environment.type as string,
              })
            }
          })
        })
      })
    } else if (monitorType === 'serviceArea') {
      const serviceArea = await serviceCatalogueService.getServiceArea(monitorId, true)

      serviceArea.products.data.forEach(product => {
        product.attributes.components.data.forEach(component => {
          const typedEnvironments = component.attributes.environments as Environment[]

          typedEnvironments.forEach(environment => {
            if (environment.monitor) {
              environments.push({
                componentName: component.attributes.name as string,
                environmentName: environment.name as string,
                environmentUrl: environment.url as string,
                environmentHealth: environment.health_path as string,
                environmentType: environment.type as string,
              })
            }
          })
        })
      })
    } else {
      const components = await serviceCatalogueService.getComponents()

      components.forEach(component => {
        const typedEnvironments = component.attributes.environments as Environment[]

        typedEnvironments.forEach(environment => {
          if (environment.monitor) {
            environments.push({
              componentName: component.attributes.name as string,
              environmentName: environment.name as string,
              environmentUrl: environment.url as string,
              environmentHealth: environment.health_path as string,
              environmentType: environment.type as string,
            })
          }
        })
      })
    }

    return res.json(environments)
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
