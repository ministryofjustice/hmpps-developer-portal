import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import {
  getAlertName,
  getAlertType,
  getConsolidatedEnvironments,
  createEnvKeys,
  mapAlertEnvironments,
} from '../utils/utils'

export default function routes({ serviceCatalogueService, alertsService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  let envMap = {}

  get(['/', '/:alertType/:alertName'], async (req, res) => {
    const alertType = getAlertType(req)
    const alertName = getAlertName(req)
    const results = await serviceCatalogueService.getEnvironments()
    const environments = await getConsolidatedEnvironments(results)
    envMap = await createEnvKeys(environments)
    logger.info(`Request for /alerts/${alertType}/${alertName}`)
    return res.render('pages/alerts')
  })

  get('/all', async (req, res) => {
    try {
      const alerts = await alertsService.getAlerts()
      const revisedAlerts = await mapAlertEnvironments(alerts, envMap)
      res.json(revisedAlerts)
    } catch (error) {
      logger.warn(`Failed to get alerts`, error)
    }
  })

  // get('/environments', async (req, res) => {
  //   try {
  //     const results = await serviceCatalogueService.getEnvironments()
  //     const environments = await getConsolidatedEnvironments(results)
  //     const envMap = await createEnvKeys(environments)
  //     res.json(envMap)
  //   } catch (error) {
  //     logger.warn(`Failed to get alerts`, error)
  //   }
  // })

  return router
}
