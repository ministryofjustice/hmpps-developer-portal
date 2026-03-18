import { Router } from 'express'
import type { Services } from '../services'
import { utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-sharepoint-discovery' })
    return res.render('pages/dashboard', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const products = await serviceCatalogueService.getProducts({})

    res.send(products)
  })

  return router
}
