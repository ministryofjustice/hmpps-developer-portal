import { Router } from 'express'
import type { Services } from '../services'
import { getFormattedName } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/rds', async (req, res) => {
    return res.render('pages/rds')
  })

  router.get('/rds/data', async (req, res) => {
    const rdsInstances = await serviceCatalogueService.getRdsInstances()

    res.send(rdsInstances)
  })

  router.get('/rds/:rdsInstanceSlug', async (req, res) => {
    const rdsInstanceSlug = getFormattedName(req, 'rdsInstanceSlug')
    const rdsInstances = await serviceCatalogueService.getRdsInstances()
    const rdsInstanceData = rdsInstances.find(
      rdsInstance => `${rdsInstance.tf_label}-${rdsInstance.namespace}` === rdsInstanceSlug,
    )

    const rdsInstance = rdsInstanceData

    return res.render('pages/rdsInstance', { rdsInstance })
  })

  return router
}
