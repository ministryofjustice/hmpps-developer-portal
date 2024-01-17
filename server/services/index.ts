import { dataAccess } from '../data'
import ServiceCatalogueService from './serviceCatalogueService'
import RedisService from './redisService'
import { createRedisClient } from '../data/redisClient'
import logger from '../../logger'
import ComponentNameService from './componentNameService'

export const services = () => {
  const { strapiApiClientBuilder, applicationInfo } = dataAccess()
  const client = createRedisClient()
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const serviceCatalogueService = new ServiceCatalogueService(strapiApiClientBuilder)
  const componentNameService = new ComponentNameService(strapiApiClientBuilder)
  const redisService = new RedisService(client)

  return {
    applicationInfo,
    serviceCatalogueService,
    componentNameService,
    redisService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService, RedisService, ComponentNameService }
