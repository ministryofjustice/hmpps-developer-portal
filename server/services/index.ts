import { dataAccess } from '../data'
import ServiceCatalogueService from './serviceCatalogueService'
import PingdomService from './pingdomService'
import RedisService from './redisService'
import { createRedisClient } from '../data/redisClient'
import logger from '../../logger'

export const services = () => {
  const { pingdomApiClientBuilder, strapiApiClientBuilder, applicationInfo } = dataAccess()
  const client = createRedisClient()
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const serviceCatalogueService = new ServiceCatalogueService(strapiApiClientBuilder)
  const pingdomService = new PingdomService(pingdomApiClientBuilder)
  const redisService = new RedisService(client)

  return {
    applicationInfo,
    serviceCatalogueService,
    pingdomService,
    redisService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService, RedisService }
