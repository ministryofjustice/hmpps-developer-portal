import logger from '../../logger'
import config from '../config'
import RestClient from './restClient'

export interface Service {
  name: string
}

export interface ServiceCatalogue {
  services: Service[]
}

export default class ServiceCatalogueClient {
  private static restClient(): RestClient {
    return new RestClient('Service Catalogue Client', config.apis.serviceCatalogue, null)
  }

  getServiceCatalogue(): Promise<ServiceCatalogue> {
    logger.info(`Getting service catalogue`)
    return ServiceCatalogueClient.restClient().get({ path: '/api/catalogue' }) as Promise<ServiceCatalogue>
  }
}
