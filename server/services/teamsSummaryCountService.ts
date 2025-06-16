import logger from '../../logger'
import { StrapiApiClient } from '../data'
import {
  ProductListResponseDataItem,
  ProductResponse,
  TeamResponse,
  ComponentListResponseDataItem,
} from '../data/strapiApiTypes'
import { AlertListResponseDataItem } from '../@types'

// Interface for alerts service to replace 'any' type
interface AlertsService {
  getAlerts(): Promise<AlertListResponseDataItem[]>
}

export default class TeamsSummaryCountService {
  /**
   * Helper: Fetch all products for a team by team slug
   */
  async getProductsForTeam(teamSlug: string): Promise<ProductListResponseDataItem[]> {
    const client = new StrapiApiClient()
    try {
      const teamResp: TeamResponse = await client.getTeam({ teamSlug })
      const products = Array.isArray(teamResp.data)
        ? teamResp.data[0]?.attributes?.products?.data || []
        : teamResp.data?.attributes?.products?.data || []
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
  async getComponentsForProducts(
    products: ProductListResponseDataItem[],
  ): Promise<{ [productName: string]: ComponentListResponseDataItem[] }> {
    const client = new StrapiApiClient()
    const promises = products.map(async product => {
      const productSlug = product.attributes.slug
      try {
        const productResp: ProductResponse = await client.getProduct({ productSlug })
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

    const result = results.reduce(
      (acc, { name, components }) => {
        acc[name] = components
        return acc
      },
      {} as { [productName: string]: ComponentListResponseDataItem[] },
    )

    return result
  }

  /**
   * Orchestrator: For a teamSlug, get product -> component -> firing alert count
   * @param teamSlug string
   * @param alertsService alerts service instance
   * @returns { [productName: string]: { [componentName: string]: number } }
   */
  async getTeamAlertSummary(
    teamSlug: string,
    alertsService: AlertsService,
  ): Promise<{ [productName: string]: { [componentName: string]: number } }> {
    logger.info(`[getTeamAlertSummary] Start for team ${teamSlug}`)

    const products = await this.getProductsForTeam(teamSlug)
    const productComponentMap = await this.getComponentsForProducts(products)

    // Flatten all component names
    const allComponentNames = Object.values(productComponentMap)
      .flat()
      .map(c => c.attributes.name)
    logger.info(`[getTeamAlertSummary] Total components found: ${allComponentNames.length}`)

    const alertCounts = await this.getFiringAlertCountsForComponents(allComponentNames, alertsService)

    // Build the result using functional constructs
    const result = Object.fromEntries(
      Object.entries(productComponentMap).map(([productName, components]) => [
        productName,
        Object.fromEntries(
          components.map(c => {
            const componentName = c.attributes.name
            return [componentName, alertCounts[componentName] || 0]
          }),
        ),
      ]),
    )

    logger.info(`[getTeamAlertSummary] Done for team ${teamSlug}`)
    return result
  }

  /**
   * Utility: Get count of currently firing alerts for each component in a list
   * @param componentNames Array of component names
   * @param alertsService Alerts service instance (must have getAlerts())
   * @returns Map of component name to count of firing alerts
   */
  async getFiringAlertCountsForComponents(
    componentNames: string[],
    alertsService: AlertsService,
  ): Promise<{ [componentName: string]: number }> {
    // This assumes alertsService.getAlerts() returns all alerts with .labels.application or .labels.component
    try {
      const allAlerts = await alertsService.getAlerts()
      logger.info(`[getFiringAlertCountsForComponents] Total alerts fetched: ${allAlerts.length}`)

      const nameSet = new Set(componentNames)
      const countsMap = new Map<string, number>()

      for (const alert of allAlerts) {
        // Replace continue with conditional logic
        if (alert.status?.state === 'active') {
          const label = alert.labels?.application ?? alert.labels?.component
          if (label && nameSet.has(label)) {
            countsMap.set(label, (countsMap.get(label) || 0) + 1)
          }
        }
      }

      // Single pass for result + logging
      return componentNames.reduce(
        (acc, name) => {
          acc[name] = countsMap.get(name) || 0
          logger.info(`Component ${name}: ${acc[name]} firing alerts`)
          return acc
        },
        {} as Record<string, number>,
      )
    } catch (err) {
      logger.error(`[getFiringAlertCountsForComponents] Error:`, err)
      return {}
    }
  }
}
