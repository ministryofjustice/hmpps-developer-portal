import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getFormattedName, utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService, componentNameService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const components = await componentNameService.getAllDeployedComponents()
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-sharepoint-discovery' })
    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: '',
      productName: '',
      serviceAreaName: '',
      customComponentName: '',
      useFormattedName: true,
    })
    return res.render('pages/trivyScans', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
      components,
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
    })
  })

  get('/data', async (req, res) => {
    const trivyScans = await serviceCatalogueService.getTrivyScans()
    // trivyScans.forEach(scan => {
    //   console.log("scan.id:", JSON.stringify(scan.attributes.trivy_scan.data.attributes.scan_summary.scan_summary.summary);
    // });
    res.send(trivyScans)
  })

  return router
}
