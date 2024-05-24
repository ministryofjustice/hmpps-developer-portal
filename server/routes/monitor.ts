import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { ComponentListResponseDataItem, Environment } from '../data/strapiApiTypes'
import { getNumericId, getMonitorName, getMonitorType, relativeTimeFromNow } from '../utils/utils'

type MonitorEnvironment = {
  componentName: string
  environmentName: string
  environmentUrl: string
  environmentHealth: string
  environmentType: string
  isPrisons: boolean
  isProbation: boolean
}

export default function routes({ serviceCatalogueService, redisService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get(['/', '/:monitorType/:monitorName'], async (req, res) => {
    const monitorType = getMonitorType(req)
    const monitorName = getMonitorName(req)
    logger.info(`Request for /monitor/${monitorType}/${monitorName}`)

    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: monitorName,
      productName: monitorName,
      serviceAreaName: monitorName,
      customComponentName: monitorName,
    })

    return res.render('pages/monitor', {
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
      monitorName,
      monitorType,
    })
  })

  get('/components/:monitorType/:monitorId?', async (req, res) => {
    const monitorType = getMonitorType(req)
    const monitorId = getNumericId(req, 'monitorId')
    let environments: MonitorEnvironment[] = []

    if (monitorType === 'customComponentView') {
      const customComponentView = await serviceCatalogueService.getCustomComponentView({
        customComponentId: monitorId,
        withEnvironments: true,
      })

      customComponentView.components.data.forEach(component => {
        environments = environments.concat(getEnvironmentData(component as ComponentListResponseDataItem))
      })
    } else if (monitorType === 'product') {
      const product = await serviceCatalogueService.getProduct({
        productId: monitorId,
        withEnvironments: true,
      })

      product.components.data.forEach(component => {
        environments = environments.concat(
          getEnvironmentData(component as unknown as ComponentListResponseDataItem, product.p_id),
        )
      })
    } else if (monitorType === 'team') {
      const team = await serviceCatalogueService.getTeam({ teamId: monitorId, withEnvironments: true })

      team.products.data.forEach(product => {
        product.attributes.components.data.forEach(component => {
          environments = environments.concat(getEnvironmentData(component as ComponentListResponseDataItem))
        })
      })
    } else if (monitorType === 'serviceArea') {
      const serviceArea = await serviceCatalogueService.getServiceArea({ serviceAreaId: monitorId, withProducts: true })

      serviceArea.products.data.forEach(product => {
        product.attributes.components.data.forEach(component => {
          environments = environments.concat(getEnvironmentData(component as ComponentListResponseDataItem))
        })
      })
    } else {
      const components = await serviceCatalogueService.getComponents()

      components.forEach(component => {
        environments = environments.concat(getEnvironmentData(component as ComponentListResponseDataItem))
      })
    }

    return res.json(environments)
  })

  const getHealthStatus = (json: string): string => {
    const healthPayload = (json && JSON.parse(json)) || { status: 'UNKNOWN' }

    if (Object.prototype.hasOwnProperty.call(healthPayload, 'status')) {
      return healthPayload.status
    }
    return healthPayload.healthy === true ? 'UP' : 'DOWN'
  }

  post('/queue', async (req, res) => {
    const versions = await redisService.readLatest('latest:versions')
    const health = await redisService.readLatest('latest:health')

    const envNames = Array.from(new Set([health, versions].flatMap(Object.keys)))

    const result = envNames.reduce((acc, key) => {
      const { v: version } = versions[key] || {}
      const { json, dateAdded } = health[key] || {}

      const lastMessageTime = relativeTimeFromNow(new Date(dateAdded))
      const healthStatus = getHealthStatus(json)

      acc[key] = { version, lastMessageTime, healthStatus }
      return acc
    }, {})

    return res.send(JSON.stringify(Object.entries(result)))
  })

  return router
}

const getEnvironmentData = (component: ComponentListResponseDataItem, productId?: string): MonitorEnvironment[] => {
  const typedEnvironments = component.attributes.environments as Environment[]
  const componentProductId = productId || component.attributes.product.data?.attributes?.p_id
  const isPrisons = `${componentProductId}`.startsWith('DPS')
  const isProbation = `${componentProductId}`.startsWith('HMPPS')
  const environments: MonitorEnvironment[] = []

  typedEnvironments.forEach(environment => {
    if (environment.monitor) {
      environments.push({
        componentName: component.attributes.name as string,
        environmentName: environment.name as string,
        environmentUrl: environment.url as string,
        environmentHealth: environment.health_path as string,
        environmentType: environment.type as string,
        isPrisons,
        isProbation,
      })
    }
  })

  return environments
}
