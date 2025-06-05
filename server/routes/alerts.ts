import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { getAlertType, getAlertName, mapAlertEnvironments, mapToCanonicalEnv } from '../utils/utils'

export default function routes({ serviceCatalogueService, alertsService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  // let envMap = {}

  get(['/', '/:alertType/:alertName'], async (req, res) => {
    const alertType = getAlertType(req)
    const alertName = getAlertName(req)
    // Get alerts to determine which environments actually have data
    const alertsData = await alertsService.getAlerts()

    // Extract unique canonical environment values from actual alerts
    const alertEnvironments = alertsData
      .map(alert => alert.labels?.environment || 'none')
      .map(mapToCanonicalEnv) // Map to canonical form
      .filter((env, index, self) => self.indexOf(env) === index) // Deduplicate
      .sort()

    // Format environments for dropdown with blank default option
    const environments = [
      { text: '', value: '', selected: true },
      ...alertEnvironments.map(env => ({ text: env, value: env, selected: false })),
    ]
    logger.info(`Request for /alerts/${alertType}/${alertName}`)
    return res.render('pages/alerts', { environments })
  })

  get('/all', async (req, res) => {
    try {
      const alerts = await alertsService.getAlerts()
      const revisedAlerts = await mapAlertEnvironments(alerts)
      res.json(revisedAlerts)
    } catch (error) {
      logger.warn(`Failed to get alerts`, error)
    }
  })

  return router
}
