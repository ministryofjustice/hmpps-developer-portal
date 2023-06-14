import type ServiceCatalogueClient from '../data/serviceCatalogueClient'

interface ServiceCatalogue {
  services: Service[]
}

interface Service {
  name: string
}

export default class CatalogueService {
  constructor(private readonly serviceCatalogueClient: ServiceCatalogueClient) {}

  async getServiceCatalogue(): Promise<ServiceCatalogue> {
    return this.serviceCatalogueClient.getServiceCatalogue()
  }
}
