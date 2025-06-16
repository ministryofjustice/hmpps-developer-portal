import logger from '../../logger'
import { StrapiApiClient } from '../data'
import {
  ProductListResponseDataItem,
  ProductResponse,
  TeamResponse,
  ComponentListResponseDataItem,
} from '../data/strapiApiTypes'
import AlertsService from './alertsService'

export default class TeamsSummaryCountService {
  private readonly alertsService: AlertsService

  private readonly strapiClient: StrapiApiClient

  constructor(alertsService: AlertsService, strapiClient: StrapiApiClient) {
    this.alertsService = alertsService
    this.strapiClient = strapiClient
  }

  /**
   * Helper: Fetch all products for a team by team slug
   */
  async getProductsForTeam(teamSlug: string): Promise<ProductListResponseDataItem[]> {
    try {
      const teamResp: TeamResponse = await this.strapiClient.getTeam({ teamSlug })
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
  ): Promise<Record<string, ComponentListResponseDataItem[]>> {
    const promises = products.map(async product => {
      const productSlug = product.attributes.slug
      try {
        const productResp: ProductResponse = await this.strapiClient.getProduct({ productSlug })
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
    const result = Object.fromEntries(entries) as Record<string, ComponentListResponseDataItem[]>

    return result
  }

  /**
   * Orchestrator: For a teamSlug, get product -> component -> firing alert count
   * @param teamSlug string
   * @returns { [productName: string]: { [componentName: string]: number } }
   */
  async getTeamAlertSummary(teamSlug: string): Promise<Record<string, Record<string, number>>> {
    logger.info(`[getTeamAlertSummary] Start for team ${teamSlug}`)

    const products = await this.getProductsForTeam(teamSlug)
    const productComponentMap = await this.getComponentsForProducts(products)

    const allComponentNames = Object.values(productComponentMap).flatMap(components =>
      components.map(c => c.attributes.name),
    )
    logger.info(`[getTeamAlertSummary] Total components found: ${allComponentNames.length}`)

    const alertCounts = await this.getFiringAlertCountsForComponents(allComponentNames)

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
   * @returns Map of component name to count of firing alerts
   */
  async getFiringAlertCountsForComponents(componentNames: string[]): Promise<Record<string, number>> {
    try {
      const allAlerts = await this.alertsService.getAlerts()
      logger.info(`[getFiringAlertCountsForComponents] Total alerts fetched: ${allAlerts.length}`)

      const nameSet = new Set(componentNames)
      const countsMap = new Map<string, number>()

      allAlerts.forEach(alert => {
        if (alert.status?.state === 'active') {
          const label = alert.labels?.application ?? alert.labels?.component
          if (label && nameSet.has(label)) {
            countsMap.set(label, (countsMap.get(label) || 0) + 1)
          }
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
}
