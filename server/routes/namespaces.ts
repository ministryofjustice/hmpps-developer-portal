import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getFormattedName } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const name = 'hmpps-terraform-discovery'
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name })
    return res.render('pages/namespaces', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: scheduledJobRequest.last_successful_run,
    })
  })

  get('/data', async (req, res) => {
    const namespaces = await serviceCatalogueService.getNamespaces()

    res.send(namespaces)
  })

  get('/:namespaceSlug', async (req, res) => {
    const namespaceSlug = getFormattedName(req, 'namespaceSlug')
    const namespace = await serviceCatalogueService.getNamespace({ namespaceSlug })
    const rdsInstances = namespace.rds_instance?.map(rdsInstance => rdsInstance)

    const displayNamespace = {
      name: namespace.name,
      rdsInstances,
    }

    return res.render('pages/namespace', { namespace: displayNamespace })
  })

  return router
}
