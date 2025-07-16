import { Router } from 'express'
import type { Services } from '../services'
import { getFormattedName, utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-sharepoint-discovery' })
    return res.render('pages/products', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const products = await serviceCatalogueService.getProducts({})

    res.send(products)
  })

  router.get('/:productSlug', async (req, res) => {
    const productSlug = getFormattedName(req, 'productSlug')
    const product = await serviceCatalogueService.getProduct({ productSlug })

    const productSet = product.product_set
    const { team } = product
    const components = product.components
      ?.map(component => component)
      .sort((a, b) => {
        if (a.name > b.name) {
          return 1
        }
        if (a.name < b.name) {
          return -1
        }
        return 0
      })

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
      leadDeveloper: product.lead_developer,
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
