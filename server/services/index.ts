import { dataAccess } from '../data'
import ServiceCatalogueService from './serviceCatalogueService'

export const services = () => {
  const { strapiApiClientBuilder, applicationInfo } = dataAccess()

  const serviceCatalogueService = new ServiceCatalogueService(strapiApiClientBuilder)

  return {
    applicationInfo,
    serviceCatalogueService,
  }
}

export type Services = ReturnType<typeof services>

export { ServiceCatalogueService }
