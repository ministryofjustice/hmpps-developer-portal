import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/productSets')
  })

  get('/data', async (req, res) => {
    const productSets = await serviceCatalogueService.getProductSets()

    return res.send(productSets)
  })

  get('/:productSetId', async (req, res) => {
    const productSetId = getProductSetId(req)
    const productSet = await serviceCatalogueService.getProductSet(productSetId)
    const products = productSet.products?.data?.map(product => product)

    const displayProductSet = {
      name: productSet.name,
      products,
    }

    return res.render('pages/productSet', { productSet: displayProductSet })
  })

  return router
}

function getProductSetId(req: Request): string {
  const { productSetId } = req.params

  if (!Number.isInteger(Number.parseInt(productSetId, 10))) {
    throw new BadRequest()
  }

  return productSetId
}
