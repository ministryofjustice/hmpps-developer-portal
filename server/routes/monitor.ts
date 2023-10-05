import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { Environment } from '../data/strapiApiTypes'

type MonitorComponent = {
  id: number
  name: string
  environments: Environment[]
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
    const products = await serviceCatalogueService.getProducts()
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

  get('/components/:monitorType/:monitorId', async (req, res) => {
    const monitorType = getMonitorType(req)
    const monitorId = getMonitorId(req)
    let components: MonitorComponent[] = []

    if (monitorType === 'product') {
      const product = await serviceCatalogueService.getProduct(monitorId, true)
      components = product.components.data.map((component): MonitorComponent => {
        return {
          id: component.id as number,
          name: component.attributes.name as string,
          environments: component.attributes.environments as Environment[],
        }
      })
    }
    if (monitorType === 'team') {
      const team = await serviceCatalogueService.getTeam(monitorId, true)
      components = team.products.data
        .map(product => {
          return product.attributes.components.data.map(component => {
            return {
              id: component.id,
              name: component.attributes.name,
              environments: component.attributes.environments,
            }
          })
        })
        .flat()
    }
    if (monitorType === 'serviceArea') {
      const serviceArea = await serviceCatalogueService.getServiceArea(monitorId, true)
      components = serviceArea.products.data
        .map(product => {
          return product.attributes.components.data.map(component => {
            return {
              id: component.id,
              name: component.attributes.name,
              environments: component.attributes.environments,
            }
          })
        })
        .flat()
    }

    return res.json(components)
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

function getMonitorId(req: Request): string {
  const { monitorId } = req.params

  if (!Number.isInteger(Number.parseInt(monitorId, 10))) {
    throw new BadRequest()
  }

  return monitorId
}

function getMonitorType(req: Request): string {
  const { monitorType } = req.params

  return ['product', 'team', 'serviceArea'].includes(monitorType) ? monitorType : ''
}

function getMonitorName(req: Request): string {
  const monitorName = req.params?.monitorName || ''

  return monitorName.replace(/[^-a-z0-9]/g, '')
}

function formatMonitorName(name: string): string {
  const monitorName = name || ''

  return `${monitorName} `
    .trim()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^-a-z0-9]/g, '')
    .replace(/-+/g, '-')
}
