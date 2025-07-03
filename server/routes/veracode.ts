import { Router } from 'express'
import dayjs from 'dayjs'
import type { Services } from '../services'
import { veracodeFilters, utcTimestampToUtcDateTime } from '../utils/utils'
import { VeracodeResultsSummary } from '../data/strapiApiTypes'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-veracode-discovery' })
    return res.render('pages/veracode', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const resultFilters = getResultFilters(req.query.results as string)
    const exemptionFilters = getExemptionFilters(req.query.exemption as string)
    const allComponents = await serviceCatalogueService.getComponents(exemptionFilters)
    const passed = resultFilters.includes('passed')
    const failed = resultFilters.includes('failed')
    const unknown = resultFilters.includes('unknown')

    const rows = allComponents
      .filter(component => veracodeFilters(passed, failed, unknown, component.veracode_policy_rules_status))
      .map(component => {
        const hasVeracode = !!component.veracode_results_summary
        const severityLevels = {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          VERY_HIGH: 0,
        }

        const veracodeSummary = component.veracode_results_summary as VeracodeResultsSummary

        veracodeSummary?.severity?.forEach(severity => {
          severity.category.forEach(category => {
            // @ts-expect-error Suppress any declaration
            severityLevels[category.severity] += category.count
          })
        })

        let result = 'Failed'

        if (!hasVeracode) {
          result = 'N/A'
        } else if (component.veracode_policy_rules_status === 'Pass') {
          result = 'Passed'
        }

        return {
          name: component.name,
          hasVeracode,
          result,
          report: hasVeracode ? component.veracode_results_url : 'N/A',
          date: hasVeracode
            ? dayjs(component.veracode_last_completed_scan_date).format('YYYY-MM-DD HH:mm')
            : 'N/A',
          codeScore: hasVeracode ? veracodeSummary['static-analysis'].score : 0,
          severityLevels,
        }
      })

    res.send(rows)
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
