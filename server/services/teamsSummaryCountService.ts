import logger from '../../logger'
import type { StrapiApiClient, RestClientBuilder } from '../data'
import {
  ProductListResponseDataItem,
  ProductResponse,
  TeamResponse,
  ComponentListResponseDataItem,
} from '../data/strapiApiTypes'
import AlertsService from './alertsService'

type TeamAlertSummary = {
  products: Record<string, Record<string, number>>
  total: number
}

export default class TeamsSummaryCountService {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly strapiClient: RestClientBuilder<StrapiApiClient>,
  ) {}

  /**
   * Helper: Fetch all products for a team by team slug
   */
  async getProductsForTeam(teamSlug: string): Promise<ProductListResponseDataItem[]> {
    try {
      const teamResp: TeamResponse = await this.strapiClient('').getTeam({ teamSlug })
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
      const productSlug = product.attributes?.slug
      try {
        const productResp: ProductResponse = await this.strapiClient('').getProduct({ productSlug })
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
}
