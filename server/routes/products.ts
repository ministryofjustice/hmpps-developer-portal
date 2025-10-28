import { Router } from 'express'
import config from '../config'
import type { Services } from '../services'
import logger from '../../logger'
import { getFormattedName, utcTimestampToUtcDateTime, mapToCanonicalEnv } from '../utils/utils'
import {
  getProductionEnvironment,
  countTrivyHighAndCritical,
  countVeracodeHighAndVeryHigh,
} from '../utils/vulnerabilitySummary'
import { compareComponentsDependencies } from '../services/dependencyComparison'

interface DisplayAlert {
  alertname: string
  environment: string
  summary: string
  message: string
}

export default function routes({
  serviceCatalogueService,
  alertsService,
  recommendedVersionsService,
}: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-sharepoint-discovery' })
    return res.render('pages/products', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const products = await serviceCatalogueService.getProducts({})

    res.send(products)
  })

  router.get('/:productSlug', async (req, res) => {
    const productSlug = getFormattedName(req, 'productSlug')
    const product = await serviceCatalogueService.getProduct({ productSlug })

    const productSet = product.product_set
    const { team } = product
    const teamName = encodeURIComponent(team.name).replace(/%20/g, '+')
    const components = product.components
      ?.map(component => component)
      .sort((a, b) => {
        if (a.name > b.name) {
          return 1
        }
        if (a.name < b.name) {
          return -1
        }
        return 0
      })

    const displayProduct = {
      name: product.name,
      description: product.description,
      confluenceLinks: product.confluence_link
        ?.split(',')
        .filter(link => link !== '')
        .map(link => link.trim()),
      gDriveLink: product.gdrive_link,
      id: product.p_id,
      isPrisonProduct: product.p_id.startsWith('DPS'),
      productManager: product.product_manager,
      leadDeveloper: product.lead_developer,
      deliveryManager: product.delivery_manager,
      subProduct: product.subproduct,
      legacyProduct: product.legacy,
      phase: product.phase,
      slackChannelId: product.slack_channel_id,
      slackChannelName: product.slack_channel_name,
      productSet,
      team,
      teamName,
      components,
      slug: productSlug,
      alerts: [] as DisplayAlert[],
      trivyVulnerabilityCount: 0,
      veracodeVulnerabilityCount: 0,
    }
    const componentsNeedingUpdates: string[] = []
    const bannerPromises = displayProduct.components?.map(async component => {
      try {
        const allAlerts = await alertsService.getAlertsForComponent(component.name)
        const activeAlerts = allAlerts
          .filter(alert => alert.status?.state === 'active')
          .map(alert => ({
            componentName: component.description,
            componentSlug: component.name,
            alertname: alert.labels?.alertname ?? '',
            startsAt: utcTimestampToUtcDateTime(alert.startsAt),
            environment: mapToCanonicalEnv(alert.labels?.environment ?? ''),
            summary: alert.annotations?.summary ?? '',
            message: alert.annotations?.message ?? '',
          }))

        const thisComponent = await serviceCatalogueService.getComponent({ componentName: component.name })
        const productionEnvironment = getProductionEnvironment(thisComponent.envs)

        const trivyCount = countTrivyHighAndCritical(productionEnvironment?.trivy_scan?.scan_summary?.summary)
        const veracodeCount = countVeracodeHighAndVeryHigh(component.veracode_results_summary)

        displayProduct.trivyVulnerabilityCount += trivyCount
        displayProduct.veracodeVulnerabilityCount += veracodeCount

        const isKotlin = (component.language || '') === 'Kotlin'
        const { kotlinOnly } = config.recommendedVersions

        // Dependency comparison for this component
        if (!kotlinOnly || isKotlin) {
          try {
            const recommended = await recommendedVersionsService.getRecommendedVersions()
            const comparison = await compareComponentsDependencies([component], recommended)

            const { totalItems, aligned, needsUpgrade, aboveBaseline, missing } = comparison.summary
            logger.debug(
              `[DependencyComparison] component=${component.name} source=${comparison.recommendedSource} items=${totalItems} aligned=${aligned} needsUpgrade=${needsUpgrade} aboveBaseline=${aboveBaseline} missing=${missing}`,
            )

            const relevantItems = comparison.items.filter(
              item =>
                item.current !== '-' &&
                !!item.current &&
                (item.status === 'needs-attention' || item.status === 'needs-upgrade'),
            )

            if (relevantItems.length > 0) {
              componentsNeedingUpdates.push(component.name)
            }
          } catch (e) {
            logger.warn(`[DependencyComparison] Failed for component='${component.name}': ${String(e)}`)
          }
        }
        return { activeAlerts, componentsNeedingUpdates }
      } catch (err) {
        logger.error(`Error fetching alerts for ${component.name}: ${err instanceof Error ? err.message : String(err)}`)
        return { activeAlerts: [], componentsNeedingUpdates: [] }
      }
    })

    const productResults = await Promise.all(bannerPromises)
    displayProduct.alerts = productResults
      .filter(result => result && Array.isArray(result.activeAlerts))
      .flatMap(result => result.activeAlerts)

    const upgradeNeeded = Array.from(
      new Set(
        productResults
          .filter(result => result && Array.isArray(result.componentsNeedingUpdates))
          .flatMap(result => result.componentsNeedingUpdates),
      ),
    )

    return res.render('pages/product', { product: displayProduct, upgradeNeeded })
  })

  return router
}
