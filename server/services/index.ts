import { dataAccess } from '../data'
import UserService from './userService'
import StrapiService from './strapiService'

export const services = () => {
  const { strapiApiClientBuilder, hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)
  const strapiService = new StrapiService(strapiApiClientBuilder)

  return {
    applicationInfo,
    userService,
    strapiService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService, StrapiService }
