import { MoJSelectDataItem } from '../@types'
import type { StrapiApiClient, RestClientBuilder } from '../data'
import { formatMonitorName, sortData } from '../utils/utils'

export default class DataFilterService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getServiceAreasDropDownList(serviceAreaName: string): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreasData = await strapiApiClient.getServiceAreas()
    const serviceAreas = serviceAreasData.data.sort(sortData)
    const serviceAreaList = serviceAreas.map(serviceArea => {
      return {
        value: serviceArea.id.toString(),
        text: serviceArea.attributes.name,
        selected: formatMonitorName(serviceArea.attributes.name) === serviceAreaName,
      }
    })
    serviceAreaList.unshift({ value: '0', text: '', selected: false })

    return serviceAreaList
  }

  async getTeamsDropDownList(teamName: string): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamsData = await strapiApiClient.getTeams()
    const teams = teamsData.data.sort(sortData)
    const teamsList = teams.map(team => {
      return {
        value: team.id.toString(),
        text: team.attributes.name,
        selected: formatMonitorName(team.attributes.name) === teamName,
      }
    })
    teamsList.unshift({ value: '0', text: '', selected: false })

    return teamsList
  }

  async getProductsDropDownList(productName: string): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productsData = await strapiApiClient.getProducts({})
    const products = productsData.data.sort(sortData)
    const productsList = products.map(product => {
      return {
        value: product.id.toString(),
        text: product.attributes.name,
        selected: formatMonitorName(product.attributes.name) === productName,
      }
    })
    productsList.unshift({ value: '0', text: '', selected: false })

    return productsList
  }
}
