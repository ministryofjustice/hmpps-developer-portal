import CatalogueService from './catalogueService'
import ServiceCatalogueClient, { ServiceCatalogue } from '../data/serviceCatalogueClient'

jest.mock('../data/serviceCatalogueClient')

describe('Catalogue service', () => {
  let serviceCatalogueClient: jest.Mocked<ServiceCatalogueClient>
  let catalogueService: CatalogueService

  describe('getListOfServices', () => {
    beforeEach(() => {
      serviceCatalogueClient = new ServiceCatalogueClient() as jest.Mocked<ServiceCatalogueClient>
      catalogueService = new CatalogueService(serviceCatalogueClient)
    })
    it('Retrieves and formats user name', async () => {
      serviceCatalogueClient.getServiceCatalogue.mockResolvedValue({
        services: [{ name: 'hmpps-foo' }, { name: 'hmpps-bar' }, { name: 'hmpps-baz' }],
      } as ServiceCatalogue)

      const result = await catalogueService.getServiceCatalogue()

      expect(result.services.map(service => service.name)).toEqual(['hmpps-foo', 'hmpps-bar', 'hmpps-baz'])
    })

    it('Propagates error', async () => {
      serviceCatalogueClient.getServiceCatalogue.mockRejectedValue(new Error('some error'))

      await expect(catalogueService.getServiceCatalogue()).rejects.toEqual(new Error('some error'))
    })
  })
})
