import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getNumericId } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/serviceAreas')
  })

  get('/data', async (req, res) => {
    const serviceAreas = await serviceCatalogueService.getServiceAreas()

    return res.send(serviceAreas)
  })

  get('/:serviceAreaId', async (req, res) => {
    const serviceAreaId = getNumericId(req, 'serviceAreaId')
    const serviceArea = await serviceCatalogueService.getServiceArea({ serviceAreaId })
    const products = serviceArea.products?.data?.map(product => product)

    const displayServiceArea = {
      id: serviceArea.sa_id,
      name: serviceArea.name,
      owner: serviceArea.owner,
      products,
    }

    return res.render('pages/serviceArea', { serviceArea: displayServiceArea })
  })

  return router
}
