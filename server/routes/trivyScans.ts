import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/trivyScans')
  })

  get('/data', async (req, res) => {
    const trivyScans = await serviceCatalogueService.getTrivyScans()

    res.send(trivyScans)
  })

  get('/:trivy_scan_name', async (req, res) => {
    const name = req.params.trivy_scan_name
    const scan = await serviceCatalogueService.getTrivyScan({ name })
    const scanSummary = scan.scan_summary?.summary
    const scanResults = scan.scan_summary?.scan_result
    const scanDate = utcTimestampToUtcDateTime(scan.trivy_scan_timestamp)
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']

    const createSummaryTable = (summary: any): Array<{ category: string; severity: string; count: number }> => {
      const dataTable: Array<{ category: string; severity: string; count: number }> = []

      // Add rows for "config"
      if (summary.config) {
        for (const [severity, count] of Object.entries(summary.config)) {
          dataTable.push({
            category: 'Config',
            severity: severity as string,
            count: count as number,
          })
        }
      }

      // Add rows for "os-pkgs"
      if (summary['os-pkgs']) {
        for (const [status, severities] of Object.entries(summary['os-pkgs'])) {
          for (const [severity, count] of Object.entries(severities)) {
            dataTable.push({
              category: `OS Packages (${status})`,
              severity: severity as string,
              count: count as number,
            })
          }
        }
      }

      // Add rows for "lang-pkgs"
      if (summary['lang-pkgs']) {
        for (const [status, severities] of Object.entries(summary['lang-pkgs'])) {
          for (const [severity, count] of Object.entries(severities)) {
            dataTable.push({
              category: `Language Packages (${status})`,
              severity: severity as string,
              count: count as number,
            })
          }
        }
      }

      // Add rows for "secret"
      if (summary.secret) {
        for (const [severity, count] of Object.entries(summary.secret)) {
          dataTable.push({
            category: 'Secret',
            severity: severity as string,
            count: count as number,
          })
        }
      }
      dataTable.sort((a, b) => {
        return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
      })
      return dataTable
    }

    const summaryTable = createSummaryTable(scanSummary)

    // Results section

    const createVulnerabilitiesResultsTable = (results: any) => {
      const dataTable: any[] = []

      // Add rows for "lang-pkgs"
      if (results['lang-pkgs']) {
        for (const pkg of results['lang-pkgs']) {
          dataTable.push({
            category: 'Language Packages',
            pkgName: pkg.PkgName,
            severity: pkg.Severity,
            description: pkg.Description,
            fixedVersion: pkg.FixedVersion,
            vulnerabilityID: pkg.VulnerabilityID,
            PrimaryURL: pkg.PrimaryURL,
            installedVersion: pkg.InstalledVersion,
          })
        }
      }

      // Add rows for "os-pkgs"
      if (results['os-pkgs']) {
        for (const pkg of results['os-pkgs']) {
          dataTable.push({
            category: 'OS Packages',
            pkgName: pkg.PkgName,
            severity: pkg.Severity,
            description: pkg.Description,
            fixedVersion: pkg.FixedVersion,
            vulnerabilityID: pkg.VulnerabilityID,
            PrimaryURL: pkg.PrimaryURL,
            installedVersion: pkg.InstalledVersion,
          })
        }
      }

      // Sort the dataTable by severity
      dataTable.sort((a, b) => {
        return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
      })

      return dataTable
    }
    const vulnerabilitiesResultsTable = createVulnerabilitiesResultsTable(scanResults)

    const createSecretResultsTable = (results: any) => {
      const dataTable: any[] = []
      // Add rows for "secret"
      if (results.secret) {
        for (const secret of results.secret) {
          dataTable.push({
            category: 'Secret',
            severity: secret.Severity,
            description: secret.Description,
            filePath: secret.FilePath,
            lineNumber: secret.LineNumber,
            additionalContext: secret.AdditionalContext.replace(/\*+/g, '*'),
          })
        }
      }

      // Sort the dataTable by severity
      dataTable.sort((a, b) => {
        return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
      })

      return dataTable
    }
    const secretResultTable = createSecretResultsTable(scanResults)

    return res.render('pages/trivyScan', { 
      trivyScan: scan, 
      scanDate, 
      summaryTable, 
      vulnerabilitiesResultsTable, 
      secretResultTable
    })
  })

  return router
}
