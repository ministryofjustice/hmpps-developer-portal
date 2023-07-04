import nock from 'nock'
import config from '../config'
import StrapiApiClient from './strapiApiClient'
import { Product } from './strapiApiTypes'

describe('strapiApiClient', () => {
  let fakeStrapiApi: nock.Scope
  let strapiApiClient: StrapiApiClient

  beforeEach(() => {
    fakeStrapiApi = nock(config.apis.strapi.products.url)
    strapiApiClient = new StrapiApiClient()
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getPrisons', () => {
    it('should return all prisons from the Prison Register', async () => {
      const allProducts = [{ name: 'testProduct', pid: '1' } as Product]
      fakeStrapiApi.get('/products').reply(200, allProducts)
      const output = await strapiApiClient.getProducts()
      expect(output).toEqual(allProducts)
    })
  })
})
