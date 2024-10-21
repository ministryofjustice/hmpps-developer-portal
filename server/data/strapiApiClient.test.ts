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

  describe('Products', () => {
    describe('getProducts', () => {
      it('should return all products by default', async () => {
        const allProducts = {
          data: [{ id: 1, attributes: { name: 'Product', p_id: '1' } }],
        } as ProductListResponse
        fakeStrapiApi.get('/products?populate=product_set').reply(200, allProducts)
        const output = await strapiApiClient.getProducts({})
        expect(output).toEqual(allProducts)
      })

      it('should return products with environments if selected', async () => {
        const allProducts = {
          data: [{ id: 1, attributes: { name: 'Product', p_id: '1' } }],
        } as ProductListResponse
        fakeStrapiApi.get('/products?populate=product_set%2Ccomponents.environments').reply(200, allProducts)
        const output = await strapiApiClient.getProducts({ withEnvironments: true })
        expect(output).toEqual(allProducts)
      })
    })

    describe('getProduct', () => {
      describe('with productId', () => {
        it('should return a single product', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as ProductResponse
          fakeStrapiApi.get('/products/1?populate=product_set%2Cteam%2Ccomponents%2Cservice_area').reply(200, product)
          const output = await strapiApiClient.getProduct({ productId: 1 })
          expect(output).toEqual(product)
        })

        it('should return a single product with environments if selected', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as ProductResponse
          fakeStrapiApi
            .get('/products/1?populate=product_set%2Cteam%2Ccomponents%2Cservice_area%2Ccomponents.environments')
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productId: 1, withEnvironments: true })
          expect(output).toEqual(product)
        })
      })
      describe('with productSlug', () => {
        it('should return a single product', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as ProductResponse
          fakeStrapiApi
            .get('/products?filters[slug][$eq]=product&populate=product_set%2Cteam%2Ccomponents%2Cservice_area')
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productSlug: 'product' })
          expect(output).toEqual(product)
        })

        it('should return a single product with environments if selected', async () => {
          const product = {
            data: { id: 1, attributes: { name: 'Product', p_id: '1', slug: 'product' } },
          } as ProductResponse
          fakeStrapiApi
            .get(
              '/products?filters[slug][$eq]=product&populate=product_set%2Cteam%2Ccomponents%2Cservice_area%2Ccomponents.environments',
            )
            .reply(200, product)
          const output = await strapiApiClient.getProduct({ productSlug: 'product', withEnvironments: true })
          expect(output).toEqual(product)
        })
      })
    })
  })

  describe('Components', () => {
    describe('getComponents', () => {
      it('should return all components', async () => {
        const allComponents = { data: [{ attributes: { name: 'Component' } }] } as ComponentListResponse
        fakeStrapiApi.get('/components?populate=product%2Cenvironments').reply(200, allComponents)
        const output = await strapiApiClient.getComponents()
        expect(output).toEqual(allComponents)
      })
    })

    describe('getComponent', () => {
      it('should return a single component', async () => {
        const component = {
          data: [{ id: 1, attributes: { name: 'component' } }],
        } as ComponentResponse
        fakeStrapiApi
          .get('/components?filters[name][$eq]=component&populate=product.team%2Cenvironments')
          .reply(200, component)
        const output = await strapiApiClient.getComponent({ componentName: 'component' })
        expect(output).toEqual(component)
      })
    })
  })

  describe('Teams', () => {
    describe('getTeams', () => {
      it('should return all teams', async () => {
        const allTeams = { data: [{ attributes: { name: 'Team' } }] } as TeamListResponse
        fakeStrapiApi.get('/teams?populate=products').reply(200, allTeams)
        const output = await strapiApiClient.getTeams()
        expect(output).toEqual(allTeams)
      })
    })

    describe('getTeam', () => {
      it('should return a single team', async () => {
        const team = { data: { id: 1, attributes: { name: 'Team' } } } as TeamResponse
        fakeStrapiApi.get('/teams/1?populate=products').reply(200, team)
        const output = await strapiApiClient.getTeam({ teamId: 1 })
        expect(output).toEqual(team)
      })

      it('should return a single team with environments if selected', async () => {
        const team = { data: { id: 1, attributes: { name: 'Team' } } } as TeamResponse
        fakeStrapiApi.get('/teams/1?populate=products%2Cproducts.components.environments').reply(200, team)
        const output = await strapiApiClient.getTeam({ teamId: 1, withEnvironments: true })
        expect(output).toEqual(team)
      })
    })
  })

  describe('Product Sets', () => {
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
        const output = await strapiApiClient.getProductSet({ productSetId: 1 })
        expect(output).toEqual(productSet)
      })
    })
  })

  describe('Service Areas', () => {
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
        const output = await strapiApiClient.getServiceArea({ serviceAreaId: 1 })
        expect(output).toEqual(serviceArea)
      })
    })
  })
})
