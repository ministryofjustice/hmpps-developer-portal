import nock from 'nock'
import config from '../config'
import StrapiApiClient from './strapiApiClient'
import { Product, Component } from './strapiApiTypes'

describe('strapiApiClient', () => {
  let fakeStrapiApi: nock.Scope
  let strapiApiClient: StrapiApiClient

  beforeEach(() => {
    fakeStrapiApi = nock(`${config.apis.serviceCatalogue.url}/v1`)
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

  describe('getProducts', () => {
    it('should return all products', async () => {
      const allProducts = [{ name: 'testProduct', pid: '1' } as Product]
      fakeStrapiApi.get('/products').reply(200, allProducts)
      const output = await strapiApiClient.getProducts()
      expect(output).toEqual(allProducts)
    })
  })

  describe('getComponents', () => {
    it('should return all components', async () => {
      const allComponents = [{ name: 'testComponent' } as Component]
      fakeStrapiApi.get('/components').reply(200, allComponents)
      const output = await strapiApiClient.getComponents()
      expect(output).toEqual(allComponents)
    })
  })
})
