import StrapiApiClient from '../data/strapiApiClient'
import {
  Component,
  ComponentResponse,
  ComponentListResponse,
  ComponentListResponseDataItem,
  ProductListResponseDataItem,
  ProductListResponse,
  ProductSet,
  ProductSetListResponse,
  ServiceArea,
  ServiceAreaListResponse,
  Team,
  TeamResponse,
  TeamListResponse,
  TeamListResponseDataItem,
  ProductResponse,
  Product,
} from '../data/strapiApiTypes'
import ServiceCatalogueService from './serviceCatalogueService'

jest.mock('../data/strapiApiClient')

describe('Strapi service', () => {
  const strapiApiClient = new StrapiApiClient() as jest.Mocked<StrapiApiClient>

  let serviceCatalogueService: ServiceCatalogueService

  const StrapiApiClientFactory = jest.fn()

  beforeEach(() => {
    StrapiApiClientFactory.mockReturnValue(strapiApiClient)
    serviceCatalogueService = new ServiceCatalogueService(StrapiApiClientFactory)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getProduct', () => {
    const testProductResponse = {
      data: {
        id: 1,
        attributes: { name: 'z-index testProduct', pid: '1' },
      },
    } as ProductResponse
    const testProduct = { name: 'z-index testProduct', pid: '1' } as Product

    it('should return the selected product', async () => {
      strapiApiClient.getProduct.mockResolvedValue(testProductResponse)

      const results = await serviceCatalogueService.getProduct('1')

      expect(strapiApiClient.getProduct).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testProduct)
    })
  })

  describe('getTeam', () => {
    const testTeamResponse = {
      data: {
        id: 1,
        attributes: { name: 'z-index testTeam' },
      },
    } as TeamResponse
    const testTeam = { name: 'z-index testTeam' } as Team

    it('should return the selected team', async () => {
      strapiApiClient.getTeam.mockResolvedValue(testTeamResponse)

      const results = await serviceCatalogueService.getTeam('1')

      expect(strapiApiClient.getTeam).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testTeam)
    })
  })

  describe('getComponent', () => {
    const testComponentResponse = {
      data: {
        id: 1,
        attributes: { name: 'z-index testComponent' },
      },
    } as ComponentResponse
    const testComponent = { name: 'z-index testComponent' } as Component

    it('should return the selected component', async () => {
      strapiApiClient.getComponent.mockResolvedValue(testComponentResponse)

      const results = await serviceCatalogueService.getComponent('1')

      expect(strapiApiClient.getComponent).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testComponent)
    })
  })

  describe('getProducts', () => {
    const testProductsResponse = {
      data: [
        {
          id: 1,
          attributes: { name: 'z-index testProduct', pid: '1' },
        },
        {
          id: 2,
          attributes: { name: 'testProduct', pid: '2' },
        },
      ],
    } as ProductListResponse
    const testProducts = [
      {
        id: 2,
        attributes: { name: 'testProduct', pid: '2' },
      },
      {
        id: 1,
        attributes: { name: 'z-index testProduct', pid: '1' },
      },
    ] as ProductListResponseDataItem[]

    it('should return an ordered array of products', async () => {
      strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

      const results = await serviceCatalogueService.getProducts()

      expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testProducts)
    })
  })

  describe('getComponents', () => {
    const testComponentsResponse = {
      data: [
        {
          id: 1,
          attributes: { name: 'z-index testComponent' },
        },
        {
          id: 2,
          attributes: { name: 'testComponent' },
        },
      ],
    } as ComponentListResponse
    const testComponents = [
      { id: 2, attributes: { name: 'testComponent' } },
      { id: 1, attributes: { name: 'z-index testComponent' } },
    ] as ComponentListResponseDataItem[]

    it('should return an ordered array of components', async () => {
      strapiApiClient.getComponents.mockResolvedValue(testComponentsResponse)

      const results = await serviceCatalogueService.getComponents()

      expect(strapiApiClient.getComponents).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testComponents)
    })
  })

  describe('getTeams', () => {
    const testTeamsResponse = {
      data: [
        {
          id: 1,
          attributes: { name: 'z-index testTeam' },
        },
        {
          id: 2,
          attributes: { name: 'testTeam' },
        },
      ],
    } as TeamListResponse
    const testTeams = [
      {
        id: 2,
        attributes: { name: 'testTeam' },
      },
      {
        id: 1,
        attributes: { name: 'z-index testTeam' },
      },
    ] as TeamListResponseDataItem[]

    it('should return an ordered array of teams', async () => {
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

      const results = await serviceCatalogueService.getTeams()

      expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testTeams)
    })
  })

  describe('getProductSets', () => {
    const testProductSetsResponse = {
      data: [
        {
          attributes: { name: 'z-index testProductSet' },
        },
        {
          attributes: { name: 'testProductSet' },
        },
      ],
    } as ProductSetListResponse
    const testProductSets = [{ name: 'testProductSet' }, { name: 'z-index testProductSet' }] as ProductSet[]

    it('should return an ordered array of product sets', async () => {
      strapiApiClient.getProductSets.mockResolvedValue(testProductSetsResponse)

      const results = await serviceCatalogueService.getProductSets()

      expect(strapiApiClient.getProductSets).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testProductSets)
    })
  })

  describe('getServiceAreas', () => {
    const testServiceAreasResponse = {
      data: [
        {
          attributes: { name: 'z-index testServiceArea' },
        },
        {
          attributes: { name: 'testServiceArea' },
        },
      ],
    } as ServiceAreaListResponse
    const testServiceAreas = [{ name: 'testServiceArea' }, { name: 'z-index testServiceArea' }] as ServiceArea[]

    it('should return an ordered array of product sets', async () => {
      strapiApiClient.getServiceAreas.mockResolvedValue(testServiceAreasResponse)

      const results = await serviceCatalogueService.getServiceAreas()

      expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testServiceAreas)
    })
  })
})
