import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { getAlertName, getAlertType } from '../utils/utils'

export default function routes({ alertsService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/:alertType/:alertName'], async (req, res) => {
    const alertType = getAlertType(req)
    const alertName = getAlertName(req)

    logger.info(`Request for /alerts/${alertType}/${alertName}`)

    return res.render('pages/alerts')
  })

  get('/all', async (req, res) => {
    const alerts = await alertsService.getAlerts()
    res.json(alerts)
  })

  return router
}
