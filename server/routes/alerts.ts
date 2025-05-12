import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { getAlertName, getAlertType } from '../utils/utils'
import { AlertListResponseDataItem } from '../@types'

export default function routes(_: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(['/', '/:alertType/:alertName'], async (req, res) => {
    const alertType = getAlertType(req)
    const alertName = getAlertName(req)

    logger.info(`Request for /alerts/${alertType}/${alertName}`)

    return res.render('pages/alerts')
  })

  get('/all', async (req, res) => {
    const alerts = await getAlertsApi()
    res.json(alerts)
  })

  return router
}

function getAlertsApi(): Promise<AlertListResponseDataItem[]> {
  const alertManagerUrl = process.env.ALERTMANAGER_URL
  const urlFilter = '/alerts/filter=businessUnit="hmpps"'
  return fetch(`${alertManagerUrl}?${urlFilter}`)
    .then(res => res.json())
    .then(res => {
      return res as AlertListResponseDataItem[]
    })
}
