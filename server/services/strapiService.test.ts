import StrapiApiClient from '../data/strapiApiClient'
import { Product, ProductListResponse } from '../data/strapiApiTypes'
import StrapiService from './strapiService'

jest.mock('../data/strapiApiClient')

describe('Strapi service', () => {
  const strapiApiClient = new StrapiApiClient() as jest.Mocked<StrapiApiClient>

  let strapiService: StrapiService

  const StrapiApiClientFactory = jest.fn()

  const testResponse = {
    data: [
      {
        attributes: { name: 'testProduct', pid: '1' },
      },
    ],
  } as ProductListResponse
  const testProducts = [{ name: 'testProduct', pid: '1' } as Product]

  beforeEach(() => {
    StrapiApiClientFactory.mockReturnValue(strapiApiClient)
    strapiService = new StrapiService(StrapiApiClientFactory)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getProducts', () => {
    it('should return an array of available support options', async () => {
      strapiApiClient.getProducts.mockResolvedValue(testResponse)

      const results = await strapiService.getProducts()

      expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
      expect(results).toEqual(testProducts)
    })
  })
})
