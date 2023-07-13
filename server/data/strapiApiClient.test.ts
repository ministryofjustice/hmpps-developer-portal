import nock from 'nock'
import config from '../config'
import StrapiApiClient from './strapiApiClient'
import {
  ComponentResponse,
  ComponentListResponse,
  TeamResponse,
  TeamListResponse,
  ProductSetListResponse,
  ProductSetResponse,
  ProductListResponse,
  ProductResponse,
  ServiceAreaListResponse,
  ServiceAreaResponse,
} from './strapiApiTypes'

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
        data: [{ id: 1, attributes: { name: 'Product', p_id: '1' } }],
      } as ProductListResponse
      fakeStrapiApi.get('/products?populate=product_set').reply(200, allProducts)
      const output = await strapiApiClient.getProducts()
      expect(output).toEqual(allProducts)
    })
  })

  describe('getProduct', () => {
    it('should return a single product', async () => {
      const product = {
        data: { id: 1, attributes: { name: 'Product', p_id: '1' } },
      } as ProductResponse
      fakeStrapiApi.get('/products/1?populate=product_set%2Cteam%2Ccomponents%2Cservice_area').reply(200, product)
      const output = await strapiApiClient.getProduct('1')
      expect(output).toEqual(product)
    })
  })

  describe('getComponents', () => {
    it('should return all components', async () => {
      const allComponents = { data: [{ attributes: { name: 'Component' } }] } as ComponentListResponse
      fakeStrapiApi.get('/components?populate=product').reply(200, allComponents)
      const output = await strapiApiClient.getComponents()
      expect(output).toEqual(allComponents)
    })
  })

  describe('getComponent', () => {
    it('should return a single component', async () => {
      const component = {
        data: { id: 1, attributes: { name: 'Component' } },
      } as ComponentResponse
      fakeStrapiApi.get('/components/1').reply(200, component)
      const output = await strapiApiClient.getComponent('1')
      expect(output).toEqual(component)
    })
  })

  describe('getTeams', () => {
    it('should return all teams', async () => {
      const allTeams = { data: [{ attributes: { name: 'Team' } }] } as TeamListResponse
      fakeStrapiApi.get('/teams').reply(200, allTeams)
      const output = await strapiApiClient.getTeams()
      expect(output).toEqual(allTeams)
    })
  })

  describe('getTeam', () => {
    it('should return a single team', async () => {
      const team = { data: { id: 1, attributes: { name: 'Team' } } } as TeamResponse
      fakeStrapiApi.get('/teams/1?populate=products').reply(200, team)
      const output = await strapiApiClient.getTeam('1')
      expect(output).toEqual(team)
    })
  })

  describe('getProductSets', () => {
    it('should return all product sets', async () => {
      const allProductSets = { data: [{ attributes: { name: 'Product Set' } }] } as ProductSetListResponse
      fakeStrapiApi.get('/product-sets').reply(200, allProductSets)
      const output = await strapiApiClient.getProductSets()
      expect(output).toEqual(allProductSets)
    })
  })

  describe('getProductSet', () => {
    it('should return a single product set', async () => {
      const productSet = {
        data: { id: 1, attributes: { name: 'Product Set' } },
      } as ProductSetResponse
      fakeStrapiApi.get('/product-sets/1?populate=products').reply(200, productSet)
      const output = await strapiApiClient.getProductSet('1')
      expect(output).toEqual(productSet)
    })
  })

  describe('getServiceAreas', () => {
    it('should return all service areas', async () => {
      const allServiceAreas = { data: [{ attributes: { name: 'Service Area' } }] } as ServiceAreaListResponse
      fakeStrapiApi.get('/service-areas').reply(200, allServiceAreas)
      const output = await strapiApiClient.getServiceAreas()
      expect(output).toEqual(allServiceAreas)
    })
  })

  describe('getServiceArea', () => {
    it('should return a single service area', async () => {
      const serviceArea = {
        data: { id: 1, attributes: { name: 'Service Area' } },
      } as ServiceAreaResponse
      fakeStrapiApi.get('/service-areas/1?populate=products').reply(200, serviceArea)
      const output = await strapiApiClient.getServiceArea('1')
      expect(output).toEqual(serviceArea)
    })
  })
})
