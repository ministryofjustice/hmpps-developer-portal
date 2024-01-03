import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ pingdomService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const pingdomChecks = await pingdomService.getChecks()

    return res.render('pages/pingdom', { checks: pingdomChecks })
  })

  return router
}
