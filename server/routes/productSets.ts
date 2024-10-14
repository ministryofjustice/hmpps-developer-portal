import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getNumericId } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/productSets')
  })

  get('/data', async (req, res) => {
    const productSets = await serviceCatalogueService.getProductSets()

    res.send(productSets)
  })

  get('/:productSetId', async (req, res) => {
    const productSetId = getNumericId(req, 'productSetId')
    const productSet = await serviceCatalogueService.getProductSet({ productSetId })
    const products = productSet.products?.data?.map(product => product)

    const displayProductSet = {
      id: productSet.ps_id,
      name: productSet.name,
      products,
    }

    return res.render('pages/productSet', { productSet: displayProductSet })
  })

  return router
}
