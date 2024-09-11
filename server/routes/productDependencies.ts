import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ productDependenciesService }: Services): Router {
  const router = Router()

  const get = (paths: string[], handler: RequestHandler) => router.get(paths, asyncMiddleware(handler))

  get(['/:productCode', '/'], async (req, res) => {
    const selectedProduct = req.params.productCode
    const products = await productDependenciesService.getProducts()
    // @ts-expect-error Suppress any declaration
    const result = products.find(p => p.productCode === selectedProduct) || products[req.params.index || 0]
    const orientation = req.query.orientation !== 'LR' ? 'TB' : 'LR'
    return res.render('pages/productDependencies', { product: result, products, selectedProduct, orientation })
  })

  return router
}
