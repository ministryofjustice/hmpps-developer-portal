import { dataAccess } from '../data'
import ServiceCatalogueService from './serviceCatalogueService'
import PingdomService from './pingdomService'
import ProductDependenciesService from './productDependenciesService'
import RedisService from './redisService'
import { createRedisClient } from '../data/redisClient'
import logger from '../../logger'
import ComponentNameService from './componentNameService'
import DataFilterService from './dataFilterService'
import TeamHealthService from './teamHealthService'

export const services = () => {
  const { pingdomApiClientBuilder, strapiApiClientBuilder, applicationInfo } = dataAccess()
  const client = createRedisClient()
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const serviceCatalogueService = new ServiceCatalogueService(strapiApiClientBuilder)
  const pingdomService = new PingdomService(pingdomApiClientBuilder)
  const componentNameService = new ComponentNameService(strapiApiClientBuilder)
  const redisService = new RedisService(client)
  const productDependenciesService = new ProductDependenciesService(strapiApiClientBuilder, redisService)
  const dataFilterService = new DataFilterService(strapiApiClientBuilder)
  const teamHealthService = new TeamHealthService(redisService, serviceCatalogueService)

  return {
    applicationInfo,
    serviceCatalogueService,
    pingdomService,
    componentNameService,
    redisService,
    dataFilterService,
    productDependenciesService,
    teamHealthService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService, RedisService, ComponentNameService, DataFilterService }
