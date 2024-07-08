import { type RequestHandler, Router } from 'express'
import dayjs from 'dayjs'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { veracodeFilters } from '../utils/utils'
import { TrivyDisplayEntry, TrivyResult, TrivyScanResults, TrivyVulnerability } from '../@types'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/veracode', async (req, res) => {
    return res.render('pages/veracode')
  })

  get('/veracode/data', async (req, res) => {
    const resultFilters = getResultFilters(req.query.results as string)
    const exemptionFilters = getExemptionFilters(req.query.exemption as string)
    const allComponents = await serviceCatalogueService.getComponents(exemptionFilters)
    const passed = resultFilters.includes('passed')
    const failed = resultFilters.includes('failed')
    const unknown = resultFilters.includes('unknown')

    const rows = allComponents
      .filter(component => veracodeFilters(passed, failed, unknown, component.attributes.veracode_policy_rules_status))
      .map(component => {
        const hasVeracode = !!component.attributes.veracode_results_summary
        const severityLevels = {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          VERY_HIGH: 0,
        }

        component.attributes.veracode_results_summary?.severity?.forEach(severity => {
          severity.category.forEach(category => {
            severityLevels[category.severity] += category.count
          })
        })

        let result = 'Failed'

        if (!hasVeracode) {
          result = 'N/A'
        } else if (component.attributes.veracode_policy_rules_status === 'Pass') {
          result = 'Passed'
        }

        return {
          name: component.attributes.name,
          hasVeracode,
          result,
          report: hasVeracode ? component.attributes.veracode_results_url : 'N/A',
          date: hasVeracode
            ? dayjs(component.attributes.veracode_last_completed_scan_date).format('YYYY-MM-DD HH:mm')
            : 'N/A',
          codeScore: hasVeracode ? component.attributes.veracode_results_summary['static-analysis'].score : 0,
          severityLevels,
        }
      })

    return res.send(rows)
  })

  get('/trivy', async (req, res) => {
    return res.render('pages/trivy')
  })

  get('/trivy/data', async (req, res) => {
    const components = (await serviceCatalogueService.getComponents())
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

    return res.send(Array.from(uniqueRows).map(n => JSON.parse(n)))
  })

  return router
}

const getResultFilters = (resultFilters: string): string[] => {
  if (!resultFilters) {
    return []
  }

  const resultFiltersToCheck = resultFilters.split(',')

  return resultFiltersToCheck.filter(resultFilter => ['passed', 'failed', 'unknown'].includes(resultFilter))
}

const getExemptionFilters = (exemptionFilters: string): string[] => {
  if (!exemptionFilters) {
    return []
  }

  const exemptionFiltersToCheck = exemptionFilters.split(',')

  return exemptionFiltersToCheck.filter(exemptionFilter => ['true', 'false'].includes(exemptionFilter))
}
