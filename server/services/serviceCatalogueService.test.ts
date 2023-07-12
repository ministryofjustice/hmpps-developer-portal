import StrapiApiClient from '../data/strapiApiClient'
import {
  Component,
  ComponentListResponse,
  ProductListResponseDataItem,
  ProductListResponse,
  ProductSet,
  ProductSetListResponse,
  ServiceArea,
  ServiceAreaListResponse,
  Team,
  TeamListResponse,
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
          attributes: { name: 'z-index testComponent' },
        },
        {
          attributes: { name: 'testComponent' },
        },
      ],
    } as ComponentListResponse
    const testComponents = [{ name: 'testComponent' }, { name: 'z-index testComponent' }] as Component[]

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
          attributes: { name: 'z-index testTeam' },
        },
        {
          attributes: { name: 'testTeam' },
        },
      ],
    } as TeamListResponse
    const testTeams = [{ name: 'testTeam' }, { name: 'z-index testTeam' }] as Team[]

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
