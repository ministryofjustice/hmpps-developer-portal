import { Router } from 'express'
import cookieParser from 'cookie-parser'
import type { Services } from '../services'
import { cookieService } from '../services/cookieService'
import { sanitizeCookieInput } from '../services/sanitizeCookieInput'
import config from '../config'
import { DisplayAlert } from './products'
import { formatMonitorName, mapToCanonicalEnv, utcTimestampToUtcDateTime } from '../utils/utils'
import { Component, Product } from '../data/modelTypes'
import { countVeracodeHighAndVeryHigh } from '../utils/vulnerabilitySummary'
import { compareComponentsDependencies, DependencyComparisonItem } from '../services/dependencyComparison'
import logger from '../../logger'

export default function routes({
  serviceCatalogueService,
  alertsService,
  recommendedVersionsService,
}: Services): Router {
  const router = Router()

  router.use(cookieParser())

  // dashboard GET route for both users name and saved products
  router.get('/', async (req, res) => {
    const name = cookieService.getString(req.cookies, config.cookieKeys.userNameCookie)
    const productsList = cookieService.getFavouritesFromCookie(req.cookies, config.cookieKeys.productNameCookie)
    const error = req.query.error as string | undefined
    const attemptedProduct = req.query.value as string | undefined
    const products: Product[] = await serviceCatalogueService.getProducts({})
    const newProductSet = new Set(productsList.map(product => product.trim().toLowerCase()))
    const filteredProductsObject = products.filter(product => {
      const normalisedName = (product.name || '').trim().toLowerCase()
      return newProductSet.has(normalisedName)
    })
    const recommended = await recommendedVersionsService.getRecommendedVersions()
    const productSlugs = filteredProductsObject.map(product => product.slug)
    const productBySlug: Product[] = await Promise.all(
      productSlugs.map(productSlug => serviceCatalogueService.getProduct({ productSlug })),
    )
    const productsNameList = products.map(prod => prod.name)
    const components = productBySlug.map(prod => prod.components)
    const usersCookiePrefs = cookieService.getString(req.cookies, config.cookieKeys.userPreferencesCookie)
    const displayProduct = {
      name,
      productsList,
      error,
      attemptedProduct,
      products,
      productsNameList,
      product: productBySlug,
      component: components,
      usersCookiePrefs,
      filteredProductsObject,
      alerts: [] as DisplayAlert[],
    }

    const componentArray: Component[] = components.flat()
    const bannerPromises = componentArray
      .filter(component => !component.archived)
      .map(async component => {
        try {
          const allAlerts = await alertsService.getAlertsForComponent(component.name)

          const activeAlerts = allAlerts
            .filter(alert => alert.status?.state === 'active')
            .map(alert => ({
              componentName: component.description,
              componentSlug: formatMonitorName(component.name),
              alertname: alert.labels?.alertname ?? '',
              startsAt: utcTimestampToUtcDateTime(alert.startsAt),
              environment: mapToCanonicalEnv(alert.labels?.environment ?? ''),
              summary: alert.annotations?.summary ?? '',
              message: alert.annotations?.message ?? '',
            }))

          const veracodeCount = countVeracodeHighAndVeryHigh(component.veracode_results_summary)
          let relevantItems: DependencyComparisonItem[] = []

          const isKotlin = (component.language || '') === 'Kotlin'
          const { kotlinOnly } = config.recommendedVersions

          // Dependency comparison for this component
          if (!kotlinOnly || isKotlin) {
            try {
              // const recommended = await recommendedVersionsService.getRecommendedVersions()
              const comparison = compareComponentsDependencies([component], recommended)
              relevantItems = comparison.items.filter(
                item =>
                  item.current !== '-' &&
                  !!item.current &&
                  (item.status === 'needs-attention' || item.status === 'needs-upgrade'),
              )
            } catch (e) {
              logger.warn(`[DependencyComparison] Failed for component='${component.name}': ${String(e)}`)
            }
          }
          return {
            activeAlerts,
            needsUpdate: relevantItems.length > 0 ? component.name : null,
            veracodeCount,
            veracodeComponentName: veracodeCount > 0 ? component.name : null,
          }
        } catch (err) {
          logger.error(
            `Error fetching alerts for ${component.name}: ${err instanceof Error ? err.message : String(err)}`,
          )
          return {
            activeAlerts: [],
            needsUpdate: null,
            veracodeCount: 0,
            veracodeComponentName: null,
          }
        }
      })

    const productResults = await Promise.all(bannerPromises)
    displayProduct.alerts = productResults
      .filter(result => result && Array.isArray(result.activeAlerts))
      .flatMap(result => result.activeAlerts)

    const upgradeNeeded = productResults
      .map(i => i.needsUpdate)
      .filter((needsUpdate): needsUpdate is string => needsUpdate !== null)

    const veracodeName = productResults
      .map(i => i.veracodeComponentName)
      .filter((compName): compName is string => compName !== null)

    const veracodeCount = productResults.map(i => i.veracodeCount).filter((count): count is number => count !== 0)

    return res.render('pages/dashboard.njk', { dashboard: displayProduct, upgradeNeeded, veracodeName, veracodeCount })
  })

  // Route to add users name
  router.post('/name', (req, res) => {
    const rawInput = req.body?.name
    const safeName = sanitizeCookieInput(rawInput, {
      maxLength: 30,
      collapseWhitespace: false,
      defaultInput: 'User',
    })
    const header = cookieService.setStringHeader(config.cookieKeys.userNameCookie, safeName)
    const nameHeader = cookieService.removeEncodedQuotes(header)
    res.setHeader('Set-Cookie', nameHeader)
    res.redirect('/dashboard')
  })

  // Route to add saved products
  router.post('/saved-products/add', async (req, res) => {
    const rawInput = req.body.product
    const productInput = sanitizeCookieInput(rawInput, {
      collapseWhitespace: false,
      defaultInput: '',
    })
    if (!productInput) {
      return res.redirect('/dashboard')
    }
    // Fetch full product list from API
    const products = await serviceCatalogueService.getProducts({})
    // Match
    const exists = products.some(product => product.name.toLowerCase().trim() === productInput.toLowerCase())
    if (!exists) {
      return res.redirect(`/dashboard?error=notfound&value=${encodeURIComponent(productInput)}`)
    }

    // Load users current saved product list
    const currentProductsList: string[] = cookieService.getFavouritesFromCookie(
      req.cookies,
      config.cookieKeys.productNameCookie,
    )
    // Add new product if not already in array
    if (
      !currentProductsList.some(
        product => typeof product === 'string' && product.toLowerCase() === productInput.toLowerCase(),
      )
    ) {
      currentProductsList.push(productInput)
    }
    // Save to cookie
    const header = cookieService.setStringHeader(config.cookieKeys.productNameCookie, currentProductsList)
    res.setHeader('Set-Cookie', header)
    return res.redirect('/dashboard')
  })

  // Route to delete a saved product
  router.post('/saved-products/delete', (req, res) => {
    const rawName = req.body.delete
    if (!rawName || typeof rawName !== 'string') {
      return res.redirect('/dashboard')
    }
    const name = rawName.trim()
    const currentProductsList = cookieService.getFavouritesFromCookie(req.cookies, config.cookieKeys.productNameCookie)
    // Remove a product from current product list
    const updatedList = currentProductsList.filter(product => product.toLowerCase() !== name.toLowerCase())
    // Save updated list to cookie
    const header = cookieService.setStringHeader(config.cookieKeys.productNameCookie, updatedList)
    res.setHeader('Set-Cookie', header)
    return res.redirect('/dashboard')
  })

  return router
}
