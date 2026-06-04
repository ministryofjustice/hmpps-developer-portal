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
import MonitoringChannelService from './monitoringChannelService'
import RecommendedVersionsService from './recommendedVersionsService'
import SnykVulnerabilityService from './snykVulnerabilityService'
import CveSlaService from './cveSlaService'

export const services = () => {
  const { strapiApiClient, applicationInfo, alertsApiClient } = dataAccess()
  const client = createRedisClient()
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const serviceCatalogueService = new ServiceCatalogueService(strapiApiClient)
  const componentNameService = new ComponentNameService(strapiApiClient)
  const redisService = new RedisService(client)
  const productDependenciesService = new ProductDependenciesService(strapiApiClient, redisService)
  const dataFilterService = new DataFilterService(strapiApiClient)
  const teamHealthService = new TeamHealthService(redisService, serviceCatalogueService)
  const alertsService = new AlertsService(alertsApiClient)
  const teamsSummaryCountService = new TeamsSummaryCountService(alertsService, serviceCatalogueService, strapiApiClient)
  const monitoringChannelService = new MonitoringChannelService()
  const recommendedVersionsService = new RecommendedVersionsService(serviceCatalogueService)
  const snykVulnerabilityService = new SnykVulnerabilityService(strapiApiClient)
  const cveSlaService = new CveSlaService(serviceCatalogueService)

  return {
    applicationInfo,
    cveSlaService,
    serviceCatalogueService,
    componentNameService,
    redisService,
    dataFilterService,
    productDependenciesService,
    teamHealthService,
    alertsService,
    teamsSummaryCountService,
    monitoringChannelService,
    recommendedVersionsService,
    snykVulnerabilityService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService, RedisService, ComponentNameService, DataFilterService, AlertsService, CveSlaService }
