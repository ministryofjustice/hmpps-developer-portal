import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const serviceAreas = await serviceCatalogueService.getServiceAreas()

    return res.render('pages/serviceAreas', { serviceAreas })
  })

  get('/data', async (req, res) => {
    const serviceAreas = await serviceCatalogueService.getServiceAreas()

    return res.send(serviceAreas)
  })

  return router
}
