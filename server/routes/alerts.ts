import { Router } from 'express'
import type { Services } from '../services'
import logger from '../../logger'
import { getAlertType, getAlertName, mapToCanonicalEnv } from '../utils/utils'

export default function routes({ serviceCatalogueService, alertsService }: Services): Router {
  const router = Router()

  router.get(['/', '/:alertType/:alertName'], async (req, res) => {
    const alertType = getAlertType(req)
    const alertName = getAlertName(req)
    // Get alerts to determine which environments actually have data
    const environments = await alertsService.getAlertEnvironments()
    logger.info(`Request for /alerts/${alertType}/${alertName}`)
    return res.render('pages/alerts', { environments })
  })

  router.get('/all', async (req, res) => {
    try {
      const alerts = alertsService.getAndSortAlerts(serviceCatalogueService)
      res.json(alerts)
    } catch (error) {
      logger.warn(`Failed to get alerts`, error)
    }
  })

  return router
}
