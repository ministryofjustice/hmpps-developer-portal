import logger from '../../logger'
import type { StrapiApiClient, RestClientBuilder } from '../data'
import { Component, DataItem, Product, SingleResponse, VeracodeResultsSummary } from '../data/strapiApiTypes'
import AlertsService from './alertsService'
import ServiceCatalogueService from './serviceCatalogueService'
import { formatMonitorName } from '../utils/utils'

// Valid Veracode severity levels
export const VALID_SEVERITIES = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'] as const
export type Severity = (typeof VALID_SEVERITIES)[number]

type StrapiProduct = { id?: number; attributes?: Record<string, unknown> }

type TeamAlertSummary = {
  products: Record<string, Record<string, number>>
  total: number
}

export default class TeamsSummaryCountService {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly serviceCatalogueService: ServiceCatalogueService,
    private readonly strapiClient: RestClientBuilder<StrapiApiClient>,
  ) {}

  /**
   * Helper: Fetch all products for a team by team slug
   */
  async getProductsForTeam(teamSlug: string): Promise<DataItem<Product>[]> {
    try {
      const team = await this.strapiClient('').getTeam({ teamSlug })
      const products = Array.isArray(team.data)
        ? team.data[0]?.attributes?.products?.data || []
        : team.data?.attributes?.products?.data || []
      logger.info(`[getProductsForTeam] Found ${products.length} products for team ${teamSlug}`)
      return products
    } catch (err) {
      logger.error(`[getProductsForTeam] Error fetching products for team ${teamSlug}:`, err)
      return []
    }
  }

  /**
   * Helper: Fetch all components for a list of products
   */
  async getComponentsForProducts(products: DataItem<Product>[]): Promise<Record<string, DataItem<Component>[]>> {
    const promises = products.map(async product => {
      const productSlug = product.attributes?.slug
      try {
        const productResp: SingleResponse<Product> = await this.strapiClient('').getProduct({ productSlug })
        const components = Array.isArray(productResp.data)
          ? productResp.data[0]?.attributes?.components?.data || []
          : productResp.data?.attributes?.components?.data || []

        logger.info(
          `[getComponentsForProducts] Found ${components.length} components for product ${product.attributes.name}`,
        )
        return { name: product.attributes.name, components }
      } catch (err) {
        logger.error(
          `[getComponentsForProducts] Error fetching components for product ${product.attributes.name}:`,
          err,
        )
        return { name: product.attributes.name, components: [] }
      }
    })

    const results = await Promise.all(promises)

    const entries = results.map(({ name, components }) => [name, components])
    const result = Object.fromEntries(entries) as Record<string, DataItem<Component>[]>

    return result
  }

  /**
   * Orchestrator: For a teamSlug, get product -> component -> firing alert count
   * @param teamSlug string
   * @returns { products: { [productName: string]: { [componentName: string]: number } }, total: number }
   */
  async getTeamAlertSummary(teamSlug: string): Promise<TeamAlertSummary> {
    logger.info(`[getTeamAlertSummary] Start for team ${teamSlug}`)
    try {
      const products = await this.getProductsForTeam(teamSlug)
      const productComponentMap = await this.getComponentsForProducts(products)

      const allComponentNames = Object.values(productComponentMap).flatMap(components =>
        components.map(c => c.attributes.name),
      )
      logger.info(`[getTeamAlertSummary] Total components found: ${allComponentNames.length}`)

      const alertCounts = await this.getFiringAlertCountsForComponents(allComponentNames)
      const productAlertSummary = Object.entries(productComponentMap).reduce(
        (accumulatedSummary, [productName, components]) => {
          const componentAlertCounts = components.reduce(
            (componentCounts, component) => {
              const componentName = component.attributes?.name
              if (!componentName) return componentCounts
              const alertCount = alertCounts[componentName] || 0
              return {
                ...componentCounts,
                [componentName]: alertCount,
              }
            },
            {} as Record<string, number>,
          )

          const productTotalAlerts = Object.values(componentAlertCounts).reduce((sum, count) => sum + count, 0)
          return {
            products: {
              ...accumulatedSummary.products,
              [productName]: componentAlertCounts,
            },
            total: accumulatedSummary.total + productTotalAlerts,
          }
        },
        { products: {} as Record<string, Record<string, number>>, total: 0 },
      )

      logger.info(`[getTeamAlertSummary] Done for team ${teamSlug}`)
      return productAlertSummary
    } catch (err) {
      logger.error(`[getTeamAlertSummary] Error for team ${teamSlug}:`, err)
      return { products: {}, total: 0 }
    }
  }

  /**
   * Utility: Get count of currently firing alerts for each component in a list
   * @param componentNames Array of component names
   * @returns Map of component name to count of firing alerts
   */
  async getFiringAlertCountsForComponents(componentNames: string[]): Promise<Record<string, number>> {
    try {
      const allAlerts = await this.alertsService.getAlerts()
      logger.info(`[getFiringAlertCountsForComponents] Total alerts fetched: ${allAlerts.length}`)

      const nameSet = new Set(componentNames)
      const countsMap = new Map<string, number>()

      allAlerts
        .filter(alert => alert.status?.state === 'active')
        .forEach(alert => {
          const componentLabel = alert.labels?.application ?? alert.labels?.component
          if (componentLabel && nameSet.has(componentLabel)) {
            countsMap.set(componentLabel, (countsMap.get(componentLabel) || 0) + 1)
          }
        })

      return componentNames.reduce(
        (alertCountsMap, componentName) => {
          const count = countsMap.get(componentName) || 0
          logger.info(`Component ${componentName}: ${count} firing alerts`)
          return { ...alertCountsMap, [componentName]: count }
        },
        {} as Record<string, number>,
      )
    } catch (err) {
      logger.error(`[getFiringAlertCountsForComponents] Error:`, err)
      return {}
    }
  }

  /**
   * Helper: Get Trivy CRITICAL & HIGH vuln counts for a team's products
   */
  async getTeamTrivyVulnerabilityCounts(products: StrapiProduct[]): Promise<{ critical: number; high: number }> {
    if (!Array.isArray(products) || products.length === 0) {
      return { critical: 0, high: 0 }
    }

    try {
      const trivyScans = await this.serviceCatalogueService.getTrivyScans()
      const allComponents = await this.serviceCatalogueService.getComponents()

      const productIds = new Set(products.map(p => p.id))
      const validComponents = allComponents
        .filter(component => {
          const productId = component?.product?.id
          return productId && productIds.has(productId)
        })
        .map(component => formatMonitorName(component.name))

      const componentNamesSet = new Set(validComponents)

      const counts = trivyScans.reduce(
        (accumulator, scan) => {
          if (!componentNamesSet.has(formatMonitorName(scan.name))) {
            return accumulator
          }

          const vulns = [
            ...(scan?.scan_summary?.scan_result?.['os-pkgs'] || []),
            ...(scan?.scan_summary?.scan_result?.['lang-pkgs'] || []),
          ]

          return vulns.reduce((innerAccumulator, vuln) => {
            if (vuln.Severity === 'CRITICAL') {
              return {
                ...innerAccumulator,
                critical: innerAccumulator.critical + 1,
              }
            }
            if (vuln.Severity === 'HIGH') {
              return {
                ...innerAccumulator,
                high: innerAccumulator.high + 1,
              }
            }
            return innerAccumulator
          }, accumulator)
        },
        { critical: 0, high: 0 },
      )

      logger.info(`[Trivy] Total CRITICAL: ${counts.critical}, HIGH: ${counts.high}`)
      return counts
    } catch (err) {
      logger.error('Error in getTeamTrivyVulnerabilityCounts:', err)
      return { critical: 0, high: 0 }
    }
  }

  /**
   * Helper: Get Veracode VERY_HIGH, HIGH, MEDIUM, LOW vuln counts for a team's products
   */
  async getTeamVeracodeVulnerabilityCounts(
    products: StrapiProduct[],
  ): Promise<{ veryHigh: number; high: number; medium: number; low: number }> {
    if (!Array.isArray(products) || products.length === 0) {
      return { veryHigh: 0, high: 0, medium: 0, low: 0 }
    }
    try {
      const allComponents = await this.serviceCatalogueService.getComponents()
      const productIds = new Set(products.map(p => p.id))
      const validComponents = allComponents.filter(component => {
        const productId = component?.product?.id
        return productId && productIds.has(productId)
      })

      const counts: Record<Severity, number> = {} as Record<Severity, number>

      // Initialize counts with all valid severities set to 0
      for (const sev of VALID_SEVERITIES) {
        counts[sev] = 0
      }

      for (const component of validComponents) {
        const summary = component.veracode_results_summary as unknown as VeracodeResultsSummary | undefined

        for (const severity of summary?.severity || []) {
          for (const category of severity.category) {
            const severityKey = category.severity as Severity
            if (VALID_SEVERITIES.includes(severityKey)) {
              counts[severityKey] += category.count
            } else {
              logger.warn(`[getTeamVeracodeVulnerabilityCounts] Unexpected severity: ${category.severity}`)
            }
          }
        }
      }

      logger.info(
        `[Veracode] VERY_HIGH: ${counts.VERY_HIGH}, HIGH: ${counts.HIGH}, MEDIUM: ${counts.MEDIUM}, LOW: ${counts.LOW}`,
      )
      return {
        veryHigh: counts.VERY_HIGH,
        high: counts.HIGH,
        medium: counts.MEDIUM,
        low: counts.LOW,
      }
    } catch (err) {
      logger.error('Error in getTeamVeracodeVulnerabilityCounts:', err)
      return { veryHigh: 0, high: 0, medium: 0, low: 0 }
    }
  }
}
