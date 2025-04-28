import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/scheduledJobs')
  })

  get('/data', async (req, res) => {
    const scheduledJobs = await serviceCatalogueService.getScheduledJobs()

    res.send(scheduledJobs)
  })

  get('/:name', async (req, res) => {
    const { name } = req.params
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name })
    const displayJob = {
      name: scheduledJobRequest.name,
      description: scheduledJobRequest.description,
      schedule: scheduledJobRequest.schedule,
      last_scheduled_run: scheduledJobRequest.last_scheduled_run,
      result: scheduledJobRequest.result,
      error_details: scheduledJobRequest.error_details,
      last_successful_run: scheduledJobRequest.last_successful_run,
    }
    return res.render('pages/scheduledJob', { scheduledJob: displayJob })
  })

  return router
}
