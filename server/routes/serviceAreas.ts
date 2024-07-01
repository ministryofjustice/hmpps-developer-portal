import { type RequestHandler, Router } from 'express'
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

  get('/:serviceAreaSlug', async (req, res) => {
    const { serviceAreaSlug } = req.params
    const serviceArea = await serviceCatalogueService.getServiceArea({ serviceAreaSlug })
    const products = serviceArea.products?.data?.map(product => product)

    const displayServiceArea = {
      id: serviceArea.sa_id,
      name: serviceArea.name,
      slug: serviceArea.slug,
      owner: serviceArea.owner,
      products,
    }

    return res.render('pages/serviceArea', { serviceArea: displayServiceArea })
  })

  get('/:serviceAreaSlug/diagram', async (req, res) => {
    const { serviceAreaSlug } = req.params
    const serviceAreas = (await serviceCatalogueService.getServiceAreas()).map(({ attributes }) => ({
      name: attributes.name,
      slug: attributes.slug,
    }))
    const serviceArea = await serviceCatalogueService.getServiceArea({ serviceAreaSlug, withProducts: true })
    const products = serviceArea.products?.data?.map(({ attributes }) => {
      return {
        productName: attributes.name,
        productCode: attributes.slug,
        components: attributes.components.data.map(component => component.attributes),
      }
    })

    const displayServiceArea = {
      id: serviceArea.sa_id,
      slug: serviceAreaSlug,
      name: serviceArea.name,
      owner: serviceArea.owner,
      products,
    }
    const orientation = req.query.orientation !== 'TB' ? 'LR' : 'TB'
    return res.render('pages/serviceAreaDiagram', { serviceAreas, serviceArea: displayServiceArea, orientation })
  })

  return router
}
