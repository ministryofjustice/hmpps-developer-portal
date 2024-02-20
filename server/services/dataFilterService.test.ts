import StrapiApiClient from '../data/strapiApiClient'
import { MoJSelectDataItem } from '../@types'
import { TeamListResponse, ServiceAreaListResponse, ProductListResponse } from '../data/strapiApiTypes'
import DataFilterService from './dataFilterService'

jest.mock('../data/strapiApiClient')

describe('Data Filter service', () => {
  const strapiApiClient = new StrapiApiClient() as jest.Mocked<StrapiApiClient>

  let dataFilterService: DataFilterService

  const StrapiApiClientFactory = jest.fn()

  beforeEach(() => {
    StrapiApiClientFactory.mockReturnValue(strapiApiClient)
    dataFilterService = new DataFilterService(StrapiApiClientFactory)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getServiceAreasDropDownList', () => {
    const testServiceAreasResponse = {
      data: [
        {
          id: 1,
          attributes: { name: 'Service Area 1' },
        },
        {
          id: 2,
          attributes: { name: 'Service Area 2' },
        },
      ],
    } as ServiceAreaListResponse

    it('should return all service areas as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: false,
          text: 'Service Area 1',
          value: '1',
        },
        {
          selected: false,
          text: 'Service Area 2',
          value: '2',
        },
      ]
      strapiApiClient.getServiceAreas.mockResolvedValue(testServiceAreasResponse)

      const results = await dataFilterService.getServiceAreasDropDownList({ serviceAreaName: 'Service Area 1' })

      expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })

    it('should return all service areas as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: false,
          text: 'Service Area 1',
          value: 'service-area-1',
        },
        {
          selected: false,
          text: 'Service Area 2',
          value: 'service-area-2',
        },
      ]
      strapiApiClient.getServiceAreas.mockResolvedValue(testServiceAreasResponse)

      const results = await dataFilterService.getServiceAreasDropDownList({
        serviceAreaName: 'Service Area 1',
        useFormattedName: true,
      })

      expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })

  describe('getTeamsDropDownList', () => {
    const testTeamsResponse = {
      data: [
        {
          id: 1,
          attributes: { name: 'Team 1' },
        },
        {
          id: 2,
          attributes: { name: 'Team 2' },
        },
      ],
    } as TeamListResponse

    it('should return all teams as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: false,
          text: 'Team 1',
          value: '1',
        },
        {
          selected: false,
          text: 'Team 2',
          value: '2',
        },
      ]
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

      const results = await dataFilterService.getTeamsDropDownList({ teamName: 'Team 1' })

      expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })

    it('should return all teams as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: false,
          text: 'Team 1',
          value: 'team-1',
        },
        {
          selected: false,
          text: 'Team 2',
          value: 'team-2',
        },
      ]
      strapiApiClient.getTeams.mockResolvedValue(testTeamsResponse)

      const results = await dataFilterService.getTeamsDropDownList({ teamName: 'Team 1', useFormattedName: true })

      expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })

  describe('getProductsDropDownList', () => {
    const testProductsResponse = {
      data: [
        {
          id: 1,
          attributes: { name: 'Product 1', p_id: '1' },
        },
        {
          id: 2,
          attributes: { name: 'Product 2', p_id: '2' },
        },
      ],
    } as ProductListResponse

    it('should return all teams as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: false,
          text: 'Product 1',
          value: '1',
        },
        {
          selected: false,
          text: 'Product 2',
          value: '2',
        },
      ]
      strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

      const results = await dataFilterService.getProductsDropDownList({ productName: 'Product 1' })

      expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })

    it('should return all teams as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: false,
          text: 'Product 1',
          value: 'product-1',
        },
        {
          selected: false,
          text: 'Product 2',
          value: 'product-2',
        },
      ]
      strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

      const results = await dataFilterService.getProductsDropDownList({
        productName: 'Product 1',
        useFormattedName: true,
      })

      expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })
})
