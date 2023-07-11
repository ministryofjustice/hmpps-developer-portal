import StrapiApiClient from '../data/strapiApiClient'
import { Component, Product, ProductListResponse } from '../data/strapiApiTypes'
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
          attributes: { name: 'z-index testProduct', pid: '1' },
        },
        {
          attributes: { name: 'testProduct', pid: '2' },
        },
      ],
    } as ProductListResponse
    const testProducts = [
      { name: 'testProduct', pid: '2' },
      { name: 'z-index testProduct', pid: '1' },
    ] as Product[]

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
    } as ProductListResponse
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
    } as ProductListResponse
    const testTeams = [{ name: 'testTeam' }, { name: 'z-index testTeam' }] as Component[]

    it('should return an ordered array of teams', async () => {
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

      const results = await serviceCatalogueService.getTeams()

      expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testTeams)
    })
  })
})
