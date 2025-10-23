import { Router } from 'express'
import type { Services } from '../services'
import logger from '../../logger'
import { getFormattedName, utcTimestampToUtcDateTime, mapToCanonicalEnv } from '../utils/utils'
import {
  getProductionEnvironment,
  countTrivyHighAndCritical,
  countVeracodeHighAndVeryHigh,
} from '../utils/vulnerabilitySummary'

interface DisplayAlert {
  alertname: string
  environment: string
  summary: string
  message: string
}

export default function routes({ serviceCatalogueService, alertsService }: Services): Router {
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

    const bannerPromises = displayProduct.components?.map(async component => {
      try {
        const allAlerts = await alertsService.getAlertsForComponent(component.name)
        const activeAlerts = allAlerts
          .filter(alert => alert.status?.state === 'active')
          .map(alert => ({
            componentname: component.description,
            componentslug: component.name,
            alertname: alert.labels?.alertname ?? '',
            startsat: utcTimestampToUtcDateTime(alert.startsAt),
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

        return activeAlerts
      } catch (err) {
        logger.error(`Error fetching alerts for ${component.name}: ${err instanceof Error ? err.message : String(err)}`)
        return []
      }
    })

    const alertResults = await Promise.all(bannerPromises)
    displayProduct.alerts = alertResults.flat()

    return res.render('pages/product', { product: displayProduct })
  })

  return router
}
