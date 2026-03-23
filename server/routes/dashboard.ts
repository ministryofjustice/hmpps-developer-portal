import { Router } from 'express'
import type { Services } from '../services'
import { utcTimestampToUtcDateTime } from '../utils/utils'
import { cookieService } from '../services/cookieService'
import { sanitizeNameInput } from '../services/sanitizeUsername'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const nameCookie = 'user_name'

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

  router.post('/name', (req, res) => {
    const rawInput = req.body?.name
    const safeName = sanitizeNameInput(rawInput, {
      maxLength: 100,
      collapseWhitespace: true,
      defaultName: 'User',
    })

    const header = cookieService.setStringHeader(nameCookie, safeName)
    res.setHeader('Set-Cookie', header)
    res.status(200).json({ ok: true, name: safeName })
  })

  router.get('/name', (req, res) => {
    const name = cookieService.getString(req.cookies, nameCookie)
    res.json({ name })
  })

  return router
}
