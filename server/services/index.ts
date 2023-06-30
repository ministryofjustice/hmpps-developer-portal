import { dataAccess } from '../data'
import UserService from './userService'
import ProductService from './productService'

export const services = () => {
  const { apiClientBuilder, hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)
  const productService = new ProductService(apiClientBuilder)

  return {
    applicationInfo,
    userService,
    productService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService, ProductService }
