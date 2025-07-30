import { Router } from 'express'
import type { Services } from '../services'
import { getDocumentID, utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-sharepoint-discovery' })
    return res.render('pages/productSets', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const productSets = await serviceCatalogueService.getProductSets()

    res.send(productSets)
  })

  router.get('/:productSetDocumentId', async (req, res) => {
    const productSetDocumentId = getDocumentID(req, 'productSetDocumentId')
    const productSet = await serviceCatalogueService.getProductSet({ productSetDocumentId })
    const products =
      productSet.products && productSet.products.length > 0 ? productSet.products.map(product => product) : null

    const displayProductSet = {
      id: productSet.ps_id,
      name: productSet.name,
      products,
    }

    return res.render('pages/productSet', { productSet: displayProductSet })
  })

  return router
}
