import { dataAccess } from '../data'
import StrapiService from './strapiService'

export const services = () => {
  const { strapiApiClientBuilder, applicationInfo } = dataAccess()

  const strapiService = new StrapiService(strapiApiClientBuilder)

  return {
    applicationInfo,
    strapiService,
  }
}

export type Services = ReturnType<typeof services>

export { StrapiService }
