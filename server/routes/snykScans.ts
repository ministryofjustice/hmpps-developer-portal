import { Router } from 'express'
import type { Services } from '../services'
import { utcTimestampToUtcDateTime, addTeamAndPortfolioToSnykScan } from '../utils/utils'

type SnykCveRef = { snyk_id?: string }
type SnykScanRecord = Record<string, unknown> & {
  snyk_scan_timestamp?: string
  snyk_ids?: string[]
  snyk_cves?: SnykCveRef[]
  snyk_vulnerabilities?: unknown[]
}

const createSummaryTable = (scan: Record<string, unknown>): Array<{ type: string; count: number }> => {
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] as const
  const keyBySeverity = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    UNKNOWN: 'unknown',
  } as const

  const displayBySeverity = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    UNKNOWN: 'Unknown',
  } as const

  return severities.flatMap(severity => {
    const key = keyBySeverity[severity]
    const displaySeverity = displayBySeverity[severity]
    const rows = [
      {
        type: `${displaySeverity} Fixable`,
        count: Number(scan?.[`${key}_fixable`] || 0),
      },
      {
        type: `${displaySeverity} Unfixable`,
        count: Number(scan?.[`${key}_unfixable`] || 0),
      },
    ]

    return rows.filter(row => row.count > 0)
  })
}

const createVulnerabilitiesResultsTable = (scan: Record<string, unknown>) => {
  const snykVulnerabilities = Array.isArray(scan?.snyk_vulnerabilities) ? scan.snyk_vulnerabilities : []
  const severityOrder = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    UNKNOWN: 4,
  } as const

  return [...snykVulnerabilities].sort((a, b) => {
    const aSeverity = `${a?.severity || 'UNKNOWN'}`.toUpperCase() as keyof typeof severityOrder
    const bSeverity = `${b?.severity || 'UNKNOWN'}`.toUpperCase() as keyof typeof severityOrder
    const aRank = severityOrder[aSeverity] ?? severityOrder.UNKNOWN
    const bRank = severityOrder[bSeverity] ?? severityOrder.UNKNOWN
    if (aRank !== bRank) {
      return aRank - bRank
    }

    return `${a?.snyk_id || ''}`.localeCompare(`${b?.snyk_id || ''}`)
  })
}

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    return res.render('pages/snykScans')
  })

  router.get('/data', async (req, res) => {
    const snykScans = await serviceCatalogueService.getSnykScans()
    const teams = await serviceCatalogueService.getTeams({ withComponents: true })
    const revisedScans = await addTeamAndPortfolioToSnykScan(teams, snykScans)
    res.json(revisedScans)
  })

  router.get('/:componentName/environments/:environmentName', async (req, res) => {
    const { componentName, environmentName } = req.params
    const scan = (await serviceCatalogueService.getSnykScan({
      name: componentName,
      environmentName,
    })) as SnykScanRecord

    if (!scan) {
      return res.status(404).send('Snyk scan not found')
    }

    const scanSnykIds = new Set<string>([
      ...(Array.isArray(scan.snyk_ids) ? scan.snyk_ids.filter(Boolean) : []),
      ...(Array.isArray(scan.snyk_cves) ? scan.snyk_cves.map(item => item?.snyk_id).filter(Boolean) : []),
    ])

    const snykVulnerabilities = await serviceCatalogueService.getSnykVulnerabilities()
    const vulnerabilitiesBySnykId = new Map(
      snykVulnerabilities.filter(item => item?.snyk_id).map(item => [item.snyk_id, item]),
    )

    const enrichedVulnerabilities = Array.from(scanSnykIds).map(snykId => {
      const vuln = vulnerabilitiesBySnykId.get(snykId)
      return {
        snyk_id: snykId,
        title: vuln?.title || '',
        description: vuln?.description || '',
        severity: vuln?.severity || 'UNKNOWN',
        cvss_score: vuln?.cvss_score,
        exploit_maturity: vuln?.exploit_maturity || '',
        cves: Array.isArray(vuln?.cves) ? vuln.cves : [],
        published_date: vuln?.published_date || '',
        fix_available: vuln?.fix_available || '',
        affected_package_name: vuln?.affected_package_name || '',
        affected_versions: Array.isArray(vuln?.affected_versions) ? vuln.affected_versions : [],
        fixed_versions: Array.isArray(vuln?.fixed_versions) ? vuln.fixed_versions : [],
        PrimaryURL: `https://security.snyk.io/vuln/${snykId}`,
      }
    })

    const scanWithVulnerabilityDetails: SnykScanRecord = {
      ...scan,
      snyk_vulnerabilities: enrichedVulnerabilities,
    }

    const scanDate = utcTimestampToUtcDateTime(`${scanWithVulnerabilityDetails.snyk_scan_timestamp || ''}`)

    const summaryTable = createSummaryTable(scanWithVulnerabilityDetails)
    const vulnerabilitiesResultsTable = createVulnerabilitiesResultsTable(scanWithVulnerabilityDetails)
    const secretResultTable: Record<string, string>[] = []
    return res.render('pages/snykScan', {
      snykScan: scanWithVulnerabilityDetails,
      scanDate,
      summaryTable,
      vulnerabilitiesResultsTable,
      secretResultTable,
    })
  })
  return router
}
