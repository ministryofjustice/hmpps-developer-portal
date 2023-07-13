import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/products')
  })

  get('/data', async (req, res) => {
    const products = await serviceCatalogueService.getProducts()

    return res.send(products)
  })

  get('/:productId', async (req, res) => {
    const productId = getProductId(req)
    const product = await serviceCatalogueService.getProduct(productId)

    const productSet = product.product_set?.data
    const team = product.team?.data
    const components = product.components?.data?.map(component => component)

    const displayProduct = {
      name: product.name,
      description: product.description,
      confluenceLinks: product.confluence_link?.split(',').map(link => link.trim()),
      gDriveLink: product.gdrive_link,
      id: product.p_id,
      productManager: product.product_manager,
      deliveryManager: product.delivery_manager,
      subProduct: product.subproduct,
      legacyProduct: product.legacy,
      phase: product.phase,
      productSet,
      team,
      components,
    }

    return res.render('pages/product', { product: displayProduct })
  })

  return router
}

function getProductId(req: Request): string {
  const { productId } = req.params

  if (!Number.isInteger(Number.parseInt(productId, 10))) {
    throw new BadRequest()
  }

  return productId
}
