import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getFormattedName } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/products')
  })

  get('/data', async (req, res) => {
    const products = await serviceCatalogueService.getProducts({})

    return res.send(products)
  })

  get('/:productSlug', async (req, res) => {
    const productSlug = getFormattedName(req, 'productSlug')
    const product = await serviceCatalogueService.getProduct({ productSlug })
    const productSet = product.product_set?.data
    const team = product.team?.data
    const components = product.components?.data?.map(component => component)

    const displayProduct = {
      name: product.name,
      description: product.description,
      confluenceLinks: product.confluence_link
        ?.split(',')
        .filter(link => link !== '')
        .map(link => link.trim()),
      gDriveLink: product.gdrive_link,
      id: product.p_id,
      productManager: product.product_manager,
      deliveryManager: product.delivery_manager,
      subProduct: product.subproduct,
      legacyProduct: product.legacy,
      phase: product.phase,
      slackChannelId: product.slack_channel_id,
      slackChannelName: product.slack_channel_name,
      productSet,
      team,
      components,
    }

    return res.render('pages/product', { product: displayProduct })
  })

  return router
}
