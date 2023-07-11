import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const productSets = await serviceCatalogueService.getProductSets()

    return res.render('pages/productSets', { productSets })
  })

  get('/data', async (req, res) => {
    const productSets = await serviceCatalogueService.getProductSets()

    return res.send(productSets)
  })

  return router
}
