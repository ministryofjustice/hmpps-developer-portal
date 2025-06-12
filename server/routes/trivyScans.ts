import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { utcTimestampToUtcDateTime } from '../utils/utils'
import { ScanResult, Summary } from '../data/converters/modelTypes'

const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']

const createSummaryTable = (summary: Summary): Array<{ category: string; severity: string; count: number }> => {
  const dataTable: Array<{ category: string; severity: string; count: number }> = []

  // Add rows for "config"
  if (summary.config) {
    Object.entries(summary.config).forEach(([severity, count]) => {
      dataTable.push({
        category: 'Config',
        severity,
        count,
      })
    })
  }

  // Add rows for "os-pkgs"
  if (summary['os-pkgs']) {
    Object.entries(summary['os-pkgs']).forEach(([status, severities]) => {
      Object.entries(severities).forEach(([severity, count]) => {
        dataTable.push({
          category: `OS Packages (${status})`,
          severity,
          count,
        })
      })
    })
  }

  // Add rows for "lang-pkgs"
  if (summary['lang-pkgs']) {
    Object.entries(summary['lang-pkgs']).forEach(([status, severities]) => {
      Object.entries(severities).forEach(([severity, count]) => {
        dataTable.push({
          category: `Language Packages (${status})`,
          severity,
          count,
        })
      })
    })
  }

  // Add rows for "secret"
  if (summary.secret) {
    Object.entries(summary.secret).forEach(([severity, count]) => {
      dataTable.push({
        category: 'Secret',
        severity,
        count,
      })
    })
  }
  dataTable.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))
  return dataTable
}

const createVulnerabilitiesResultsTable = (results: ScanResult) => {
  const dataTable: Record<string, string>[] = []

  // Add rows for "lang-pkgs"
  if (results['lang-pkgs']) {
    results['lang-pkgs'].forEach(pkg => {
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
    })
  }

  // Add rows for "os-pkgs"
  if (results['os-pkgs']) {
    results['os-pkgs'].forEach(pkg => {
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
    })
  }

  // Sort the dataTable by severity
  dataTable.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))

  return dataTable
}

const createSecretResultsTable = (results: ScanResult) => {
  const dataTable: Record<string, string>[] = []
  // Add rows for "secret"
  if (results.secret) {
    results.secret.forEach(secret => {
      dataTable.push({
        category: 'Secret',
        severity: secret.Severity,
        description: secret.Description,
        filePath: secret.FilePath,
        lineNumber: secret.LineNumber,
        additionalContext: secret.AdditionalContext.replace(/\*+/g, '*'),
      })
    })
  }

  // Sort the dataTable by severity
  dataTable.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))

  return dataTable
}

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
    const summary = scan.scan_summary?.summary
    const scanResults = scan.scan_summary?.scan_result
    const scanDate = utcTimestampToUtcDateTime(scan.trivy_scan_timestamp)

    const summaryTable = createSummaryTable(summary)
    const vulnerabilitiesResultsTable = createVulnerabilitiesResultsTable(scanResults)
    const secretResultTable = createSecretResultsTable(scanResults)

    return res.render('pages/trivyScan', {
      trivyScan: scan,
      scanDate,
      summaryTable,
      vulnerabilitiesResultsTable,
      secretResultTable,
    })
  })

  return router
}
