import StrapiApiClient from '../data/strapiApiClient'
import { MoJSelectDataItem } from '../@types'
import DataFilterService from './dataFilterService'
import { CustomComponentView, Product, ServiceArea, Team } from '../data/modelTypes'

jest.mock('../data/strapiApiClient')

const testServiceAreasResponse = [
  {
    id: 1,
    name: 'Service Area 1',
    owner: 'The Owner',
    sa_id: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        id: 456,
        name: 'A Product name',
        p_id: 'DPS000',
        slug: 'a-product-name-1',
      },
    ],
  },
  {
    id: 2,
    name: 'Service Area 2',
    owner: 'The Owner',
    sa_id: 'SA01',
    slug: 'a-service-area-name',
    products: [
      {
        id: 456,
        name: 'A Product name',
        p_id: 'DPS000',
        slug: 'a-product-name-1',
      },
    ],
  },
] as ServiceArea[]

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

  describe('getCustomComponentsDropDownList', () => {
    const testCustomComponentsResponse = [
      {
        id: 1,
        name: 'Custom Component 1',
      },
      {
        id: 2,
        name: 'Custom Component 2',
      },
    ] as CustomComponentView[]

    it('should return all custom compoentns as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
          text: 'Custom Component 1',
          value: '1',
        },
        {
          selected: false,
          text: 'Custom Component 2',
          value: '2',
        },
      ]
      strapiApiClient.getCustomComponentViews.mockResolvedValue(testCustomComponentsResponse)

      const results = await dataFilterService.getCustomComponentsDropDownList({
        customComponentName: 'Custom Component 1',
      })

      expect(strapiApiClient.getCustomComponentViews).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })

    it('should return all custom components as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
          text: 'Custom Component 1',
          value: 'custom-component-1',
        },
        {
          selected: false,
          text: 'Custom Component 2',
          value: 'custom-component-2',
        },
      ]
      strapiApiClient.getCustomComponentViews.mockResolvedValue(testCustomComponentsResponse)

      const results = await dataFilterService.getCustomComponentsDropDownList({
        customComponentName: 'custom-component-1',
        useFormattedName: true,
      })

      expect(strapiApiClient.getCustomComponentViews).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })

  describe('getServiceAreasDropDownList', () => {
    it('should return all service areas as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
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
          selected: true,
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
        serviceAreaName: 'service-area-1',
        useFormattedName: true,
      })

      expect(strapiApiClient.getServiceAreas).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })

  describe('getTeamsDropDownList', () => {
    const testTeamsResponse = [
      {
        id: 1,
        name: 'Team 1',
      },
      {
        id: 2,
        name: 'Team 2',
      },
    ] as Team[]

    it('should return all teams as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
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
          selected: true,
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

      const results = await dataFilterService.getTeamsDropDownList({ teamName: 'team-1', useFormattedName: true })

      expect(strapiApiClient.getTeams).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })

  describe('getProductsDropDownList', () => {
    const testProductsResponse = [
      {
        id: 1,
        name: 'Product 1',
        p_id: '1',
      },
      {
        id: 2,
        name: 'Product 2',
        p_id: '2',
      },
    ] as Product[]

    it('should return all products as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
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

    it('should return all products as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
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
        productName: 'product-1',
        useFormattedName: true,
      })

      expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })

  describe('getProductsIdDropDownList', () => {
    const testProductsResponse = [
      {
        id: 1,
        name: 'Product 1',
        p_id: '1',
      },
      {
        id: 2,
        name: 'Product 2',
        p_id: '2',
      },
    ] as Product[]

    it('should return all products with id as a sorted list for Select component with value set to the id by default', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
          text: 'Product 1 [1]',
          value: '1',
        },
        {
          selected: false,
          text: 'Product 2 [2]',
          value: '2',
        },
      ]
      strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

      const results = await dataFilterService.getProductsIdDropDownList({ productId: '1' })

      expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })

    it('should return all products with id as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      const sortedDropDownList: MoJSelectDataItem[] = [
        {
          selected: false,
          text: '',
          value: '',
        },
        {
          selected: true,
          text: 'product-1 [1]',
          value: '1',
        },
        {
          selected: false,
          text: 'product-2 [2]',
          value: '2',
        },
      ]
      strapiApiClient.getProducts.mockResolvedValue(testProductsResponse)

      const results = await dataFilterService.getProductsIdDropDownList({
        productId: '1',
        useFormattedName: true,
      })

      expect(strapiApiClient.getProducts).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual(sortedDropDownList)
    })
  })

  describe('getDropDownLists', () => {
    const teamsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Team 1',
        value: '1',
      },
      {
        selected: false,
        text: 'Team 2',
        value: '2',
      },
    ]
    const productsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Product 1',
        value: '1',
      },
      {
        selected: false,
        text: 'Product 2',
        value: '2',
      },
    ]
    const serviceAreasDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Service Area 1',
        value: '1',
      },
      {
        selected: false,
        text: 'Service Area 2',
        value: '2',
      },
    ]
    const customComponentsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Custom Component 1',
        value: '1',
      },
      {
        selected: false,
        text: 'Custom Component 2',
        value: '2',
      },
    ]
    const formattedTeamsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Team 1',
        value: 'team-1',
      },
      {
        selected: false,
        text: 'Team 2',
        value: 'team-2',
      },
    ]
    const formattedProductsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Product 1',
        value: 'product-1',
      },
      {
        selected: false,
        text: 'Product 2',
        value: 'product-2',
      },
    ]
    const formattedServiceAreasDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Service Area 1',
        value: 'service-area-1',
      },
      {
        selected: false,
        text: 'Service Area 2',
        value: 'service-area-2',
      },
    ]
    const formattedCustomComponentsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Custom Component 1',
        value: 'custom-component-1',
      },
      {
        selected: false,
        text: 'Custom Component 2',
        value: 'custom-component-2',
      },
    ]

    const teamsDropDownListMock = jest.fn()
    const productsDropDownListMock = jest.fn()
    const serviceAreasDropDownListMock = jest.fn()
    const customComponentsDropDownListMock = jest.fn()

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should return all teams, products, service areas and custom components as a sorted list for Select component with value set to the id by default', async () => {
      teamsDropDownListMock.mockResolvedValue(teamsDropDownList)
      productsDropDownListMock.mockResolvedValue(productsDropDownList)
      serviceAreasDropDownListMock.mockResolvedValue(serviceAreasDropDownList)
      customComponentsDropDownListMock.mockResolvedValue(customComponentsDropDownList)
      dataFilterService.getTeamsDropDownList = teamsDropDownListMock
      dataFilterService.getProductsDropDownList = productsDropDownListMock
      dataFilterService.getServiceAreasDropDownList = serviceAreasDropDownListMock
      dataFilterService.getCustomComponentsDropDownList = customComponentsDropDownListMock

      const results = await dataFilterService.getDropDownLists({
        teamName: 'Team 1',
        productName: 'Product 1',
        serviceAreaName: 'Service Area 1',
        customComponentName: 'Custom Component 1',
      })

      expect(teamsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(productsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(serviceAreasDropDownListMock).toHaveBeenCalledTimes(1)
      expect(customComponentsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual([
        teamsDropDownList,
        productsDropDownList,
        serviceAreasDropDownList,
        customComponentsDropDownList,
      ])
    })

    it('should return all teams, products, service areas and custom components as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      teamsDropDownListMock.mockResolvedValue(formattedTeamsDropDownList)
      productsDropDownListMock.mockResolvedValue(formattedProductsDropDownList)
      serviceAreasDropDownListMock.mockResolvedValue(formattedServiceAreasDropDownList)
      customComponentsDropDownListMock.mockResolvedValue(formattedCustomComponentsDropDownList)
      dataFilterService.getTeamsDropDownList = teamsDropDownListMock
      dataFilterService.getProductsDropDownList = productsDropDownListMock
      dataFilterService.getServiceAreasDropDownList = serviceAreasDropDownListMock
      dataFilterService.getCustomComponentsDropDownList = customComponentsDropDownListMock

      const results = await dataFilterService.getDropDownLists({
        teamName: 'team-1',
        productName: 'product-1',
        serviceAreaName: 'service-area-1',
        customComponentName: 'custom-component-1',
        useFormattedName: true,
      })

      expect(teamsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(productsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(serviceAreasDropDownListMock).toHaveBeenCalledTimes(1)
      expect(customComponentsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual([
        formattedTeamsDropDownList,
        formattedProductsDropDownList,
        formattedServiceAreasDropDownList,
        formattedCustomComponentsDropDownList,
      ])
    })
  })

  describe('getFormsDropdownLists', () => {
    const productIdsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Product 1 [1]',
        value: '1',
      },
      {
        selected: false,
        text: 'Product 2 [2]',
        value: '2',
      },
    ]
    const formattedProductIdsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'product-1 [1]',
        value: '1',
      },
      {
        selected: false,
        text: 'product-2 [2]',
        value: '2',
      },
    ]
    const teamsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Team 1',
        value: '1',
      },
      {
        selected: false,
        text: 'Team 2',
        value: '2',
      },
    ]
    const formattedTeamsDropDownList: MoJSelectDataItem[] = [
      {
        selected: false,
        text: '',
        value: '',
      },
      {
        selected: true,
        text: 'Team 1',
        value: 'team-1',
      },
      {
        selected: false,
        text: 'Team 2',
        value: 'team-2',
      },
    ]

    const getProductsIdDropDownListMock = jest.fn()
    const teamsDropDownListMock = jest.fn()

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should return all products with id and teams as a sorted list for Select component with value set to the id by default', async () => {
      getProductsIdDropDownListMock.mockResolvedValue(productIdsDropDownList)
      teamsDropDownListMock.mockResolvedValue(teamsDropDownList)
      dataFilterService.getProductsIdDropDownList = getProductsIdDropDownListMock
      dataFilterService.getTeamsDropDownList = teamsDropDownListMock

      const results = await dataFilterService.getFormsDropdownLists({ productId: '1', teamName: 'Team 1' })

      expect(getProductsIdDropDownListMock).toHaveBeenCalledTimes(1)
      expect(teamsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual([teamsDropDownList, productIdsDropDownList])
    })

    it('should return all products with id and teams as a sorted list for Select component with value set to the cleaned monitor name when useFormattedName is set', async () => {
      getProductsIdDropDownListMock.mockResolvedValue(formattedProductIdsDropDownList)
      teamsDropDownListMock.mockResolvedValue(formattedTeamsDropDownList)
      dataFilterService.getProductsIdDropDownList = getProductsIdDropDownListMock
      dataFilterService.getTeamsDropDownList = teamsDropDownListMock

      const results = await dataFilterService.getFormsDropdownLists({
        productId: '1',
        teamName: 'team-1',
        useFormattedName: true,
      })

      expect(getProductsIdDropDownListMock).toHaveBeenCalledTimes(1)
      expect(teamsDropDownListMock).toHaveBeenCalledTimes(1)
      expect(results).toStrictEqual([formattedTeamsDropDownList, formattedProductIdsDropDownList])
    })
  })
})
