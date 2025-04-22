import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import logger from '../../logger'
import { getAlertName, getAlertType } from '../utils/utils'

interface AlertListResponseDataItem {
  annotations?: {
    dashboard_url?: string
    message?: string
    runbook_url?: string
  }
  endsAt?: string
  fingerprint?: string
  receivers?: [
    {
      name?: string
    },
  ]
  startsAt?: string
  status?: {
    inhibitedBy?: Array<string>
    silencedBy?: Array<string>
    state?: string
  }
  updatedAt?: string
  generatorURL?: string
  labels?: {
    alertname?: string
    application?: string
    businessUnit?: string
    clusterName?: string
    environment?: string
    namespace?: string
    productId?: string
    prometheus?: string
    queue_name?: string
    severity?: string
  }
}

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
  return fetch('http://localhost:8080/alertmanager/alerts?filter=businessUnit="hmpps"')
    .then(res => res.json())
    .then(res => {
      return res as AlertListResponseDataItem[]
    })
}
