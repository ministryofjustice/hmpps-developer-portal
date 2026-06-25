import { Router } from 'express'
import assert from 'assert'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService, cveSlaService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const serviceAreas = await serviceCatalogueService.getServiceAreas({ withComponents: false })
    assert(serviceAreas.length > 0, 'No service areas found in the service catalogue')
    res.redirect(`/overdue-vulnerabilities/${serviceAreas[0].slug}`)
  })

  router.get('/:serviceAreaSlug.json', async (req, res) => {
    const { serviceAreaSlug } = req.params
    const cves = await cveSlaService.getCveSlaForServiceArea(serviceAreaSlug)
    res.json(cves)
  })

  router.get('/:serviceAreaSlug', async (req, res) => {
    const { serviceAreaSlug } = req.params
    const serviceAreas = await serviceCatalogueService.getServiceAreas({ withComponents: false })
    const serviceArea = await cveSlaService.getCveSlaForServiceArea(serviceAreaSlug)
    res.render(`pages/overdueVulnerabilitiesForServiceArea`, {
      serviceArea,
      serviceAreas,
      selectedServiceArea: serviceAreaSlug,
    })
  })

  router.get('/:serviceAreaSlug/product/:productSlug', async (req, res) => {
    const { serviceAreaSlug, productSlug } = req.params
    const serviceAreas = await serviceCatalogueService.getServiceAreas({ withComponents: false })
    const result = await cveSlaService.getCveSlaForProduct(serviceAreaSlug, productSlug)
    res.render(`pages/overdueVulnerabilitiesForProduct`, {
      serviceArea: result.serviceArea,
      product: result.product,
      serviceAreas,
      selectedServiceArea: serviceAreaSlug,
    })
  })

  return router
}
