import { MoJSelectDataItem } from '../@types'
import type { StrapiApiClient, RestClientBuilder } from '../data'
import {
  formatMonitorName,
  sortData,
  sortProductIdData,
  sortGithubTeamsData,
  sortGithubUsersData,
} from '../utils/utils'

export default class DataFilterService {
  constructor(private readonly strapiApiClientFactory: RestClientBuilder<StrapiApiClient>) {}

  async getCustomComponentsDropDownList({
    customComponentName,
    useFormattedName = false,
  }: {
    customComponentName: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const customComponentsData = await strapiApiClient.getCustomComponentViews({})
    const customComponents = customComponentsData.data.sort(sortData)
    const customComponentsList = customComponents.map(customComponentView => {
      const formattedName = formatMonitorName(customComponentView.attributes.name)

      return {
        value: useFormattedName ? formattedName : customComponentView.id.toString(),
        text: customComponentView.attributes.name,
        selected: formattedName === customComponentName,
      }
    })
    customComponentsList.unshift({ value: '', text: '', selected: false })

    return customComponentsList
  }

  async getServiceAreasDropDownList({
    serviceAreaName,
    useFormattedName = false,
  }: {
    serviceAreaName: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const serviceAreasData = await strapiApiClient.getServiceAreas()
    const serviceAreas = serviceAreasData.data.sort(sortData)
    const serviceAreaList = serviceAreas.map(serviceArea => {
      const formattedName = formatMonitorName(serviceArea.attributes.name)

      return {
        value: useFormattedName ? formattedName : serviceArea.id.toString(),
        text: serviceArea.attributes.name,
        selected: formattedName === serviceAreaName,
      }
    })
    serviceAreaList.unshift({ value: '', text: '', selected: false })

    return serviceAreaList
  }

  async getTeamsDropDownList({
    teamName,
    useFormattedName = false,
  }: {
    teamName: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamsData = await strapiApiClient.getTeams()
    const teams = teamsData.data.sort(sortData)
    const teamsList = teams.map(team => {
      const formattedName = formatMonitorName(team.attributes.name)

      return {
        value: useFormattedName ? formattedName : team.id.toString(),
        text: team.attributes.name,
        selected: formattedName === teamName,
      }
    })
    teamsList.unshift({ value: '', text: '', selected: false })

    return teamsList
  }

  async getUsersDropDownList({
    userName,
    useFormattedName = false,
  }: {
    userName: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const usersData = await strapiApiClient.getGithubUsers()
    const users = usersData.data.sort(sortGithubUsersData)
    const usersList = users.map(user => {
      const formattedName = formatMonitorName(user.attributes.github_username)

      return {
        value: useFormattedName ? formattedName : user.id.toString(),
        text: user.attributes.github_username,
        selected: formattedName === userName,
      }
    })
    usersList.unshift({ value: '', text: '', selected: false })

    return usersList
  }

  async getGithubTeamsDropDownList({
    githubTeamName,
    useFormattedName = false,
  }: {
    githubTeamName: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamsData = await strapiApiClient.getGithubTeams()
    const teams = teamsData.data.sort(sortGithubTeamsData)
    const teamsList = teams.map(team => {
      const formattedName = formatMonitorName(team.attributes.team_name)

      return {
        value: useFormattedName ? formattedName : team.id.toString(),
        text: team.attributes.team_name,
        selected: formattedName === githubTeamName,
      }
    })
    teamsList.unshift({ value: '', text: '', selected: false })

    return teamsList
  }

  async getProductsDropDownList({
    productName,
    useFormattedName = false,
  }: {
    productName: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productsData = await strapiApiClient.getProducts({})
    const products = productsData.data.sort(sortData)
    const productsList = products.map(product => {
      const formattedName = formatMonitorName(product.attributes.name)

      return {
        value: useFormattedName ? formattedName : product.id.toString(),
        text: product.attributes.name,
        selected: formattedName === productName,
      }
    })
    productsList.unshift({ value: '', text: '', selected: false })

    return productsList
  }

  async getProductsIdDropDownList({
    productId,
    useFormattedName = false,
  }: {
    productId: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const productsData = await strapiApiClient.getProducts({})
    const products = productsData.data.sort(sortProductIdData)
    const productsIdList = products.map(product => {
      const formattedName = formatMonitorName(product.attributes.name)
      const concatenatedformattedName = `${formattedName} [${product.attributes.p_id}]`

      return {
        value: product.attributes.p_id,
        text: useFormattedName ? concatenatedformattedName : `${product.attributes.name} [${product.attributes.p_id}]`,
        selected: product.attributes.p_id === productId,
      }
    })
    productsIdList.unshift({ value: '', text: '', selected: false })
    return productsIdList
  }

  async getDropDownLists({
    teamName = '',
    productName = '',
    serviceAreaName = '',
    customComponentName = '',
    useFormattedName = false,
  }: {
    teamName?: string
    productName?: string
    serviceAreaName?: string
    customComponentName?: string
    useFormattedName?: boolean
  }) {
    return Promise.all([
      await this.getTeamsDropDownList({ teamName, useFormattedName }),
      await this.getProductsDropDownList({ productName, useFormattedName }),
      await this.getServiceAreasDropDownList({ serviceAreaName, useFormattedName }),
      await this.getCustomComponentsDropDownList({ customComponentName, useFormattedName }),
    ])
  }

  async getFormsDropdownLists({
    teamName = '',
    productId = '',
    useFormattedName = false,
  }: {
    teamName?: string
    productId?: string
    useFormattedName?: boolean
  }) {
    return Promise.all([
      await this.getTeamsDropDownList({ teamName, useFormattedName }),
      await this.getProductsIdDropDownList({ productId, useFormattedName }),
    ])
  }

  async getSubTeamsDropDownList({
    subTeamName,
    useFormattedName = false,
  }: {
    subTeamName: string
    useFormattedName?: boolean
  }): Promise<MoJSelectDataItem[]> {
    const strapiApiClient = this.strapiApiClientFactory('')
    const teamsData = await strapiApiClient.getGithubTeams()
    const teams = teamsData.data.sort(sortGithubTeamsData)
    const subTeamsList = teams
      .filter(team => {
        return team.attributes.parent_team_name === 'hmpps-developers'
      })
      .map(team => {
        const formattedName = formatMonitorName(team.attributes.team_name)

        return {
          value: useFormattedName ? formattedName : team.id.toString(),
          text: team.attributes.team_name,
          selected: formattedName === subTeamName,
        }
      })
    subTeamsList.unshift({ value: '', text: '', selected: false })

    return subTeamsList
  }

  async getTeamsFormsLists({
    subTeamName = '',
    teamName = '',
    userName = '',
    githubTeamName = '',
    useFormattedName = false,
  }: {
    subTeamName?: string
    teamName?: string
    userName?: string
    githubTeamName?: string
    useFormattedName?: boolean
  }) {
    return Promise.all([
      await this.getSubTeamsDropDownList({ subTeamName, useFormattedName }),
      await this.getTeamsDropDownList({ teamName, useFormattedName }),
      await this.getUsersDropDownList({ userName, useFormattedName }),
      await this.getGithubTeamsDropDownList({ githubTeamName, useFormattedName }),
    ])
  }
}
