import { dataAccess } from '../data'
import ServiceCatalogueService from './serviceCatalogueService'
import ProductDependenciesService from './productDependenciesService'
import RedisService from './redisService'
import { createRedisClient } from '../data/redisClient'
import logger from '../../logger'
import TeamsSummaryCountService from './teamsSummaryCountService'
import ComponentNameService from './componentNameService'
import DataFilterService from './dataFilterService'
import TeamHealthService from './teamHealthService'
import AlertsService from './alertsService'

export const services = () => {
  const { strapiApiClientBuilder, applicationInfo, alertsApiClient } = dataAccess()
  const client = createRedisClient()
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const serviceCatalogueService = new ServiceCatalogueService(strapiApiClientBuilder)
  const componentNameService = new ComponentNameService(strapiApiClientBuilder)
  const redisService = new RedisService(client)
  const productDependenciesService = new ProductDependenciesService(strapiApiClientBuilder, redisService)
  const dataFilterService = new DataFilterService(strapiApiClientBuilder)
  const teamHealthService = new TeamHealthService(redisService, serviceCatalogueService)
  const alertsService = new AlertsService(alertsApiClient)
  const teamsSummaryCountService = new TeamsSummaryCountService(
    alertsService,
    serviceCatalogueService,
    strapiApiClientBuilder,
  )

  return {
    applicationInfo,
    serviceCatalogueService,
    componentNameService,
    redisService,
    dataFilterService,
    productDependenciesService,
    teamHealthService,
    alertsService,
    teamsSummaryCountService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService, RedisService, ComponentNameService, DataFilterService, AlertsService }
