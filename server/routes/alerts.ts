import { Router } from 'express'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService, alertsService }: Services): Router {
  const router = Router()

  router.get(['/'], async (req, res) => {
    const environments = await alertsService.getAlertEnvironments()

    return res.render('pages/alerts', { environments })
  })

  router.get('/all', async (req, res) => {
    const alerts = await alertsService.getAndSortAlerts(serviceCatalogueService)

    res.json(alerts)
  })

  return router
}
