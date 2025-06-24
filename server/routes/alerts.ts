import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { getAlertType, getAlertName, reviseAlerts, mapToCanonicalEnv } from '../utils/utils'

export default function routes({ serviceCatalogueService, alertsService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/:alertType/:alertName'], async (req, res) => {
    const alertType = getAlertType(req)
    const alertName = getAlertName(req)
    // Get alerts to determine which environments actually have data
    const alertsData = await alertsService.getAlerts()

    // Extract unique canonical environment values from actual alerts and deduplicate
    const alertEnvironments = [
      ...new Set(
        alertsData.map(alert => alert.labels?.environment || 'none').map(mapToCanonicalEnv), // Map to canonical form
      ),
    ].sort()

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
      const environments = await serviceCatalogueService.getEnvironments()
      const teams = await serviceCatalogueService.getTeams({ withComponents: true })
      const revisedAlerts = await reviseAlerts(alerts, environments, teams)
      res.json(revisedAlerts)
    } catch (error) {
      logger.warn(`Failed to get alerts`, error)
    }
  })

  return router
}
