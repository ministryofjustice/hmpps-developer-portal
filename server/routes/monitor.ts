import { Router } from 'express'
import type { Services } from '../services'
import logger from '../../logger'
import { getMonitorName, getMonitorType, relativeTimeFromNow, formatMonitorName } from '../utils/utils'
import { Component, Product } from '../data/modelTypes'

type MonitorEnvironment = {
  componentName: string
  environmentName: string
  environmentUrl: string
  environmentHealth: string
  environmentType: string
  isPrisons: boolean
  isProbation: boolean
  dependentCount: number
}

type HealthResult = { version: string; lastMessageTime: string; dateAdded: string; healthStatus: string }

export default function routes({ serviceCatalogueService, redisService, dataFilterService }: Services): Router {
  const router = Router()

  router.get(['/', '/:monitorType/:monitorName'], async (req, res) => {
    const monitorType = getMonitorType(req)
    const monitorName = getMonitorName(req)

    // If we have a product name, look up its ID
    let monitorId: number = 0

    if (monitorName) {
      if (monitorType === 'product') {
        try {
          const products = await serviceCatalogueService.getProducts({})
          logger.debug(`Looking for product with name that matches: ${monitorName}`)
          // Try to match by name, slug, or formatted name
          const matchingProduct = products.find(
            product => product.slug === monitorName || formatMonitorName(product.slug) === monitorName,
          )
          if (matchingProduct?.id) {
            monitorId = matchingProduct.id
          }
        } catch (error) {
          logger.error(`Failed to find product by name ${monitorName}`, error)
        }
      }

      if (monitorType === 'team') {
        try {
          const teams = await serviceCatalogueService.getTeams({})
          const matchingTeam = teams.find(
            team => team.slug === monitorName || formatMonitorName(team.slug) === monitorName,
          )
          if (matchingTeam?.id) {
            monitorId = matchingTeam.id
          }
        } catch (error) {
          logger.error(`Failed to find team by name ${monitorName}`, error)
        }
      }

      if (monitorType === 'service-area') {
        try {
          const serviceAreas = await serviceCatalogueService.getServiceAreas({})
          const matchingServiceArea = serviceAreas.find(
            serviceArea => serviceArea.slug === monitorName || formatMonitorName(serviceArea.slug) === monitorName,
          )
          if (matchingServiceArea?.id) {
            monitorId = matchingServiceArea.id
          }
        } catch (error) {
          logger.error(`Failed to find service area by name ${monitorName}`, error)
        }
      }
    }

    const [teamList, productList, serviceAreaList, customComponentsList] = await dataFilterService.getDropDownLists({
      teamName: monitorName,
      productName: monitorName,
      serviceAreaName: monitorName,
      customComponentName: monitorName,
    })

    if (monitorId !== 0) {
      // Update the selected item in the product list
      if (monitorType === 'product') {
        // Mark the matching product as selected without reassigning the array
        productList.forEach((item, index) => {
          if (item.value === monitorId.toString()) {
            productList[index] = {
              ...item,
              selected: true,
            }
          }
        })
      }

      // Update the selected item in the teams list
      if (monitorType === 'team') {
        // Mark the matching team as selected without reassigning the array
        teamList.forEach((item, index) => {
          if (item.value === monitorId.toString()) {
            teamList[index] = {
              ...item,
              selected: true,
            }
          }
        })
      }

      // Update the selected item in the service area list
      if (monitorType === 'service-area') {
        // Mark the matching service area as selected without reassigning the array
        serviceAreaList.forEach((item, index) => {
          if (item.value === monitorId.toString()) {
            serviceAreaList[index] = {
              ...item,
              selected: true,
            }
          }
        })
      }
    }

    return res.render('pages/monitor', {
      serviceAreaList,
      teamList,
      productList,
      customComponentsList,
      monitorName,
      monitorType,
      monitorId,
    })
  })

  router.get('/components/:monitorType{/:monitorId}', async (req, res) => {
    try {
      const monitorType = getMonitorType(req)
      let { monitorId } = req.params
      let environments: MonitorEnvironment[] = []

      // If we have no ID but have a product name in query, look it up
      if (monitorType === 'product' && monitorId === '' && req.query.name) {
        try {
          const products = await serviceCatalogueService.getProducts({})
          const productName = req.query.name as string

          // Try to match by name, slug, or formatted name
          const matchingProduct = products.find(
            p => p.name === productName || formatMonitorName(p.name) === formatMonitorName(productName),
          )

          if (matchingProduct?.id) {
            monitorId = matchingProduct.documentId
          }
        } catch (error) {
          logger.error(`Failed to find product by name ${req.query.name}`, error)
        }
      }

      if (monitorType === 'custom-component-view') {
        const customComponentView = await serviceCatalogueService.getCustomComponentView({
          customComponentDocumentId: monitorId.toString(),
          withEnvironments: true,
        })
        customComponentView.components.forEach(component => {
          environments = environments.concat(getUnwrappedEnvironmentData(component))
        })
      } else if (monitorType === 'product') {
        const productSlug = formatMonitorName(req.query.slug as string)
        const product = await serviceCatalogueService.getProduct({
          productSlug,
          productDocumentId: monitorId.toString(),
          withEnvironments: true,
        })

        product.components.forEach(component => {
          environments = environments.concat(getUnwrappedEnvironmentData(component, product))
        })
      } else if (monitorType === 'team') {
        const teamSlug = formatMonitorName(req.query.slug as string)
        const team = await serviceCatalogueService.getTeam({
          teamDocumentId: monitorId.toString(),
          teamSlug,
          withEnvironments: true,
        })
        team.products.forEach(product => {
          product.components.forEach(component => {
            environments = environments.concat(getUnwrappedEnvironmentData(component, product))
          })
        })
      } else if (monitorType === 'service-area') {
        const serviceAreaSlug = formatMonitorName(req.query.slug as string)
        const serviceArea = await serviceCatalogueService.getServiceArea({
          serviceAreaDocumentId: monitorId,
          serviceAreaSlug,
          withProducts: true,
        })
        serviceArea.products.forEach(product => {
          product.components.forEach(component => {
            environments = environments.concat(getUnwrappedEnvironmentData(component, product))
          })
        })
      } else {
        const components = await serviceCatalogueService.getComponents()

        components.forEach(component => {
          environments = environments.concat(getUnwrappedEnvironmentData(component))
        })
      }
      res.json(environments)
    } catch (error) {
      logger.error('Error fetching component environments', error)
      res.status(500).json({ error: 'Failed to fetch component environments' })
    }
  })

  const getHealthStatus = (json: string): string => {
    const healthPayload = (json && JSON.parse(json)) || { status: 'UNKNOWN' }

    if (Object.prototype.hasOwnProperty.call(healthPayload, 'status')) {
      return healthPayload.status
    }
    return healthPayload.healthy === true ? 'UP' : 'DOWN'
  }

  router.get('/queue', async (req, res) => {
    const versions = await redisService.readLatest('latest:versions')
    const health = await redisService.readLatest('latest:health')

    const envNames = Array.from(new Set([health, versions].flatMap(Object.keys)))

    const result = envNames.reduce(
      (acc, key) => {
        const { v: version } = versions[key] || {}
        const { json, dateAdded } = health[key] || {}

        const lastMessageTime = relativeTimeFromNow(new Date(dateAdded))
        const healthStatus = getHealthStatus(json)

        acc[key] = { version, lastMessageTime, dateAdded, healthStatus }
        return acc
      },
      {} as Record<string, HealthResult>,
    )
    console.log('Health Queue Result:', result)
    res.send(JSON.stringify(Object.entries(result)))
  })

  return router
}

const getUnwrappedEnvironmentData = (component: Component, product?: Product): MonitorEnvironment[] => {
  const typedEnvironments = component.envs
  const environments: MonitorEnvironment[] = []

  if (Array.isArray(typedEnvironments) && typedEnvironments.length > 0) {
    typedEnvironments.forEach(environment => {
      if (environment.monitor) {
        environments.push({
          componentName: component.name as string,
          environmentName: environment.name as string,
          environmentUrl: environment.url as string,
          environmentHealth: environment.health_path as string,
          environmentType: environment.type as string,
          isPrisons: product?.portfolio === 'Prisons' || component.product?.portfolio === 'Prisons',
          isProbation: product?.portfolio === 'Probation' || component.product?.portfolio === 'Probation',
          dependentCount: component.dependent_count || 0,
        })
      }
    })
  }
  return environments
}
