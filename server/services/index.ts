import { dataAccess } from '../data'
import ServiceCatalogueService from './serviceCatalogueService'
import ProductDependenciesService from './productDependenciesService'
import RedisService from './redisService'
import { createRedisClient } from '../data/redisClient'
import logger from '../../logger'
import ComponentNameService from './componentNameService'
import DataFilterService from './dataFilterService'

export const services = () => {
  const { strapiApiClientBuilder, applicationInfo } = dataAccess()
  const client = createRedisClient()
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const serviceCatalogueService = new ServiceCatalogueService(strapiApiClientBuilder)
  const componentNameService = new ComponentNameService(strapiApiClientBuilder)
  const redisService = new RedisService(client)
  const productDependenciesService = new ProductDependenciesService(strapiApiClientBuilder, redisService)
  const dataFilterService = new DataFilterService(strapiApiClientBuilder)

  return {
    applicationInfo,
    serviceCatalogueService,
    componentNameService,
    redisService,
    dataFilterService,
    productDependenciesService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService, RedisService, ComponentNameService, DataFilterService }
