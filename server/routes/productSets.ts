import { Router } from 'express'
import type { Services } from '../services'
import { getNumericId, utcTimestampToUtcDateTime } from '../utils/utils'

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

  router.get('/:productSetId', async (req, res) => {
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
