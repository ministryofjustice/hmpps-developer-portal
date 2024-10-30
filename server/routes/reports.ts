import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { TrivyDisplayEntry, TrivyResult, TrivyScanResults, TrivyVulnerability } from '../@types'
import { getFormattedName } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/trivy', async (req, res) => {
    return res.render('pages/trivy')
  })

  post('/trivy/data', async (req, res) => {
    const componentsToInclude = req.body.componentNames
    const components = (await serviceCatalogueService.getComponents())
      .filter(component => componentsToInclude.includes(component.attributes.name))
      .map(component => {
        const hasResults = component.attributes.trivy_scan_summary !== null

        if (hasResults) {
          const results: TrivyResult[] = (component.attributes.trivy_scan_summary as TrivyScanResults).Results ?? []

          return results.reduce((displayEntries: TrivyDisplayEntry[], result: TrivyResult) => {
            displayEntries.push(
              result.Vulnerabilities?.map((vulnerability: TrivyVulnerability) => {
                const referenceUrls = vulnerability.References.map(url => `<a href="${url}">${url}</a>`)
                const references = `<details class="govuk-details"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Links</span></summary><div class="govuk-details__text">${referenceUrls.join('<br>')}</div></details>`

                return {
                  name: component.attributes.name,
                  title: vulnerability.Title,
                  lastScan: component.attributes.trivy_last_completed_scan_date,
                  vulnerability: vulnerability.VulnerabilityID,
                  primaryUrl: vulnerability.PrimaryURL,
                  severity: vulnerability.Severity,
                  references,
                }
              }) as unknown as TrivyDisplayEntry,
            )

            return displayEntries
          }, [])
        }

        return []
      })
      .flat(Infinity)
      .filter(n => n)
      .map(n => JSON.stringify(n))

    const uniqueRows = new Set(components)

    res.send(Array.from(uniqueRows).map(n => JSON.parse(n)))
  })

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
