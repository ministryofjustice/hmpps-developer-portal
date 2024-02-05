import { dataAccess } from '../data'
import ServiceCatalogueService from './serviceCatalogueService'
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
  const dataFilterService = new DataFilterService(strapiApiClientBuilder)
  const redisService = new RedisService(client)

  return {
    applicationInfo,
    serviceCatalogueService,
    componentNameService,
    redisService,
    dataFilterService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService, RedisService, ComponentNameService, DataFilterService }
