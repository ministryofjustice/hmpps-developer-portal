import nock from 'nock'

import config from '../config'
import ServiceCatalogueClient from './serviceCatalogueClient'
import TokenStore from './tokenStore'

jest.mock('./tokenStore')

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

describe('serviceCatalogueClient', () => {
  let fakeServiceCatalogueApi: nock.Scope
  let serviceCatalogueClient: ServiceCatalogueClient

  beforeEach(() => {
    fakeServiceCatalogueApi = nock(config.apis.serviceCatalogue.url)
    serviceCatalogueClient = new ServiceCatalogueClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getServiceCatalogue', () => {
    it('should return data from api', async () => {
      const response = { services: ['data'] }

      fakeServiceCatalogueApi.get('/api/catalogue').reply(200, response)

      const output = await serviceCatalogueClient.getServiceCatalogue()
      expect(output).toEqual(response)
    })
  })
})
