import { Router } from 'express'
import type { Services } from '../services'
import { addTeamAndPortfolioToSnykScan } from '../utils/utils'

export default function routes({ serviceCatalogueService, snykVulnerabilityService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    return res.render('pages/snykScans')
  })

  router.get('/data', async (req, res) => {
    const snykScans = await serviceCatalogueService.getSnykScans()
    const teams = await serviceCatalogueService.getTeams({ withComponents: true })
    const revisedScans = await addTeamAndPortfolioToSnykScan(teams, snykScans)
    const tableRows = snykVulnerabilityService.buildSnykScansTableRows(revisedScans)
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

    if (!scanPageData) {
      return res.status(404).send('Snyk scan not found')
    }

    return res.render('pages/snykScan', scanPageData)
  })

  return router
}
