import { Router } from 'express'
import type { Services } from '../services'
import {
  utcTimestampToUtcDateTime,
  sortBySeverity,
  getComponentName,
  getEnvironmentName,
  addTeamToTrivyScan,
} from '../utils/utils'
import { ScanResult, Summary, TrivyScanType } from '../data/converters/modelTypes'

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
  return dataTable.sort(sortBySeverity)
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
  return dataTable.sort(sortBySeverity)
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
  return dataTable.sort(sortBySeverity)
}

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    return res.render('pages/trivyScans')
  })

  router.get('/data', async (req, res) => {
    const trivyScans = await serviceCatalogueService.getTrivyScans()
    const teams = await serviceCatalogueService.getTeams({ withComponents: true })
    const revisedScans = await addTeamToTrivyScan(teams, trivyScans)

    res.json(revisedScans)
  })

  router.get('/:componentName/environments/:environmentName', async (req, res) => {
    const componentName = getComponentName(req)
    const environmentName = getEnvironmentName(req)
    const component = await serviceCatalogueService.getComponent({ componentName })
    const filteredEnvironment = component.envs?.data?.filter(
      environment => environment.attributes.name === environmentName,
    )
    const envAttributes = filteredEnvironment.length === 0 ? {} : filteredEnvironment[0].attributes
    const scan = envAttributes.trivy_scan.data.attributes as TrivyScanType
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
