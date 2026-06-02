import { Router } from 'express'
import type { Services } from '../services'

export default function routes({ snykVulnerabilityService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    return res.render('pages/snykScans')
  })

  router.get('/data', async (req, res) => {
    const tableRows = await snykVulnerabilityService.getSnykScansTableData()
    res.json(tableRows)
  })

  router.get('/critical-cves', async (req, res) => {
    return res.render('pages/snykCriticalCves')
  })

  router.get('/critical-cves/data', async (req, res) => {
    const criticalReferences = await snykVulnerabilityService.getCriticalReferenceRowsForProd()
    return res.json(criticalReferences)
  })

  router.get('/:componentName/environments/:environmentName', async (req, res) => {
    const { componentName, environmentName } = req.params
    const scanPageData = await snykVulnerabilityService.getSnykScanPageData({ componentName, environmentName })

    return res.render('pages/snykScan', scanPageData)
  })

  return router
}
