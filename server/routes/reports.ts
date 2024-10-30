import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getFormattedName } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/rds', async (req, res) => {
    return res.render('pages/rds')
  })

  get('/rds/data', async (req, res) => {
    const rdsInstances = await serviceCatalogueService.getRdsInstances()

    res.send(rdsInstances)
  })

  get('/rds/:rdsInstanceSlug', async (req, res) => {
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
