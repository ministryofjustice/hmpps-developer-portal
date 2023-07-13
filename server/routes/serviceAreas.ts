import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

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
    const serviceAreaId = getServiceAreaId(req)
    const serviceArea = await serviceCatalogueService.getServiceArea(serviceAreaId)
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

function getServiceAreaId(req: Request): string {
  const { serviceAreaId } = req.params

  if (!Number.isInteger(Number.parseInt(serviceAreaId, 10))) {
    throw new BadRequest()
  }

  return serviceAreaId
}
