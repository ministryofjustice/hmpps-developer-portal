import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { Environment } from '../data/strapiApiTypes'
import { formatMonitorName, getNumericId, getMonitorName, getMonitorType } from '../utils/utils'

type MonitorEnvironment = {
  componentName: string
  environmentName: string
  environmentUrl: string
  environmentHealth: string
}

export default function routes({ serviceCatalogueService, redisService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get(['/', '/:monitorType/:monitorName'], async (req, res) => {
    const monitorType = getMonitorType(req)
    const monitorName = getMonitorName(req)
    logger.info(`Request for ${monitorType}/${monitorName}`)
    const serviceAreas = await serviceCatalogueService.getServiceAreas()
    const serviceAreaList = serviceAreas.map(serviceArea => {
      return {
        value: serviceArea.id,
        text: serviceArea.attributes.name,
        selected: monitorType === 'serviceArea' && formatMonitorName(serviceArea.attributes.name) === monitorName,
      }
    })
    const teams = await serviceCatalogueService.getTeams()
    const teamList = teams.map(team => {
      return {
        value: team.id,
        text: team.attributes.name,
        selected: monitorType === 'team' && formatMonitorName(team.attributes.name) === monitorName,
      }
    })
    const products = await serviceCatalogueService.getProducts({})
    const productList = products.map(product => {
      return {
        value: product.id,
        text: product.attributes.name,
        selected: monitorType === 'product' && formatMonitorName(product.attributes.name) === monitorName,
      }
    })

    serviceAreaList.unshift({ value: 0, text: '', selected: false })
    teamList.unshift({ value: 0, text: '', selected: false })
    productList.unshift({ value: 0, text: '', selected: false })

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

    if (monitorType === 'all') {
      const products = await serviceCatalogueService.getProducts({ withEnvironments: true })

      products.forEach(product => {
        product.attributes.components.data.forEach(component => {
          const typedEnvironments = component.attributes.environments as Environment[]

          typedEnvironments.forEach(environment => {
            environments.push({
              componentName: component.attributes.name as string,
              environmentName: environment.type as string,
              environmentUrl: environment.url as string,
              environmentHealth: environment.health_path as string,
            })
          })
        })
      })
    }
    if (monitorType === 'product') {
      const product = await serviceCatalogueService.getProduct({
        productId: monitorId,
        withEnvironments: true,
      })

      product.components.data.forEach(component => {
        const typedEnvironments = component.attributes.environments as Environment[]

        typedEnvironments.forEach(environment => {
          environments.push({
            componentName: component.attributes.name as string,
            environmentName: environment.type as string,
            environmentUrl: environment.url as string,
            environmentHealth: environment.health_path as string,
          })
        })
      })
    }
    if (monitorType === 'team') {
      const team = await serviceCatalogueService.getTeam({ teamId: monitorId, withEnvironments: true })

      team.products.data.forEach(product => {
        product.attributes.components.data.forEach(component => {
          const typedEnvironments = component.attributes.environments as Environment[]

          typedEnvironments.forEach(environment => {
            environments.push({
              componentName: component.attributes.name as string,
              environmentName: environment.type as string,
              environmentUrl: environment.url as string,
              environmentHealth: environment.health_path as string,
            })
          })
        })
      })
    }
    if (monitorType === 'serviceArea') {
      const serviceArea = await serviceCatalogueService.getServiceArea(monitorId, true)

      serviceArea.products.data.forEach(product => {
        product.attributes.components.data.forEach(component => {
          const typedEnvironments = component.attributes.environments as Environment[]

          typedEnvironments.forEach(environment => {
            environments.push({
              componentName: component.attributes.name as string,
              environmentName: environment.type as string,
              environmentUrl: environment.url as string,
              environmentHealth: environment.health_path as string,
            })
          })
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
