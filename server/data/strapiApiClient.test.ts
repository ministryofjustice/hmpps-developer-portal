import nock from 'nock'
import config from '../config'
import StrapiApiClient from './strapiApiClient'
import { Component, Team, ProductSet, ServiceArea, ProductListResponse, ProductResponse } from './strapiApiTypes'

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
      const allProducts = {
        data: [{ id: 1, attributes: { name: 'testProduct', pid: '1' } }],
      } as ProductListResponse
      fakeStrapiApi.get('/products').reply(200, allProducts)
      const output = await strapiApiClient.getProducts()
      expect(output).toEqual(allProducts)
    })
  })

  describe('getProduct', () => {
    it('should return a single product', async () => {
      const product = {
        data: { id: 1, attributes: { name: 'testProduct', pid: '1' } },
      } as ProductResponse
      fakeStrapiApi.get('/products/1').reply(200, product)
      const output = await strapiApiClient.getProduct('1')
      expect(output).toEqual(product)
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

  describe('getTeams', () => {
    it('should return all teams', async () => {
      const allTeams = [{ name: 'testTeam' } as Team]
      fakeStrapiApi.get('/teams').reply(200, allTeams)
      const output = await strapiApiClient.getTeams()
      expect(output).toEqual(allTeams)
    })
  })

  describe('getProductSets', () => {
    it('should return all product sets', async () => {
      const allProductSets = [{ name: 'testProductSet' } as ProductSet]
      fakeStrapiApi.get('/product-sets').reply(200, allProductSets)
      const output = await strapiApiClient.getProductSets()
      expect(output).toEqual(allProductSets)
    })
  })

  describe('getServiceAreas', () => {
    it('should return all service areas', async () => {
      const allServiceAreas = [{ name: 'testServiceArea' } as ServiceArea]
      fakeStrapiApi.get('/service-areas').reply(200, allServiceAreas)
      const output = await strapiApiClient.getServiceAreas()
      expect(output).toEqual(allServiceAreas)
    })
  })
})
