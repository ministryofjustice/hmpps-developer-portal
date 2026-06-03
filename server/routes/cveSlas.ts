import { Router } from 'express'
import assert from 'assert'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService, cveSlaService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const serviceAreas = await serviceCatalogueService.getServiceAreas({ withComponents: false })
    assert(serviceAreas.length > 0, 'No service areas found in the service catalogue')
    res.redirect(`cve-slas/${serviceAreas[0].slug}`)
  })

  router.get('/:serviceAreaSlug', async (req, res) => {
    const { serviceAreaSlug } = req.params
    const cves = await cveSlaService.getCveSlaForServiceArea(serviceAreaSlug)
    res.json(cves)
  })

  return router
}
