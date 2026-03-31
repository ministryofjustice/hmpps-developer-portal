import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { CookieService, fetchProductList } from '../services/cookieService'
import { Product } from '../data/modelTypes'
import { sanitizeCookieInput } from '../services/sanitizeCookieInput'

jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../services/cookieService')
jest.mock('../services/sanitizeCookieInput')

// jest.mock('../services/serviceCatalogueService.ts')
// jest.mock('../services/cookieService')
// jest.mock('../services/sanitizeCookieInput')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const mockedSanitizeService = jest.mocked(sanitizeCookieInput)
const MockedCookieService = CookieService as jest.MockedClass<typeof CookieService>
const mockedFetchProductList = jest.mocked(fetchProductList)

let app: Express
const testProduct = [{ id: 1, name: 'testProduct' }] as Product[]
const mockName = 'testUser'
const mockProductsList = ['sanitizedValue', 'product 2']
const mockCurrentProductsList = ['product 3']

beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()

  MockedCookieService.prototype.setStringHeader.mockReturnValue(
    'user_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax',
  )
  MockedCookieService.prototype.setProductCookie.mockReturnValue(
    'product_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax',
  )
  MockedCookieService.prototype.getFavouritesFromCookie.mockResolvedValue(mockCurrentProductsList)

  serviceCatalogueService.getProducts.mockResolvedValue(testProduct)

  const mockedNameValue = jest.spyOn(MockedCookieService.prototype, 'getString')
  mockedNameValue.mockReturnValue(mockName)

  mockedSanitizeService.mockReturnValue('sanitizedValue')
  mockedFetchProductList.mockResolvedValue(mockProductsList)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/dashboard', () => {
  describe('GET /', () => {
    it('should render dashboard page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        id: 1,
      })
      return request(app)
        .get('/dashboard/?value=product&error=none')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(200)
    })
  })
  // another test here to render with correct name once cookie set and correct products pinned when product list set? Or is this covered by POST/name?

  describe('POST /name', () => {
    it('should set the users name as a user_name cookie and redirect user to dashboard', () => {
      return request(app)
        .post('/dashboard/name')
        .send({ name: 'testUser' })
        .expect(res => {
          expect(mockedSanitizeService).toHaveBeenCalledWith('testUser', {
            maxLength: 30,
            collapseWhitespace: false,
            defaultInput: 'User',
          })
          expect(MockedCookieService.prototype.setStringHeader).toHaveBeenCalledWith('user_name', 'sanitizedValue')
          expect(res.header['set-cookie'][0]).toContain('user_name=sanitizedValue')
          expect(res.status).toBe(302)
          expect(res.header.location).toBe('/dashboard/user-dashboard')
        })
    })
  })

  describe('POST/saved-products/add', () => {
    it('should add a product to the product cookie and redirect user to the dashboard', () => {
      return request(app)
        .post('/dashboard/saved-products/add')
        .send({ product: 'product 1' })
        .expect(async res => {
          expect(mockedSanitizeService).toHaveBeenCalledWith('product 1', {
            collapseWhitespace: false,
            defaultInput: '',
          })
          const sanitizedProductValue = mockedSanitizeService('product 1')
          expect(sanitizedProductValue).toEqual('sanitizedValue')
          const result = await mockedFetchProductList()
          expect(result).toStrictEqual(['sanitizedValue', 'product 2'])
          expect(MockedCookieService.prototype.getFavouritesFromCookie).toHaveBeenCalledWith(
            expect.any(Object),
            'product_name',
          )
          expect(MockedCookieService.prototype.setProductCookie).toHaveBeenCalledWith(
            'product_name',
            mockCurrentProductsList,
          )
          const prodList = MockedCookieService.prototype.setProductCookie.mock.calls[0]
          const finalSavedProdList = prodList[1]
          expect(finalSavedProdList).toEqual(['product 3', 'sanitizedValue'])
          expect(res.header['set-cookie'][0]).toContain('product_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax')
          expect(res.status).toBe(302)
          expect(res.header.location).toBe('/dashboard/user-dashboard')
        })
    })
  })

  describe('POST/saved-products/delete', () => {
    it('should remove a product from the product cookie and redirect user to the dashboard', () => {
      return request(app)
        .post('/dashboard/saved-products/delete')
        .send({ index: '1' })
        .expect(res => {
          expect(MockedCookieService.prototype.getFavouritesFromCookie).toHaveBeenCalledWith(
            expect.any(Object),
            'product_name',
          )
          expect(MockedCookieService.prototype.setProductCookie).toHaveBeenCalledWith(
            'product_name',
            mockCurrentProductsList,
          )
          const prodList = MockedCookieService.prototype.setProductCookie.mock.calls[0]
          const finalSavedProdList = prodList[1]
          expect(finalSavedProdList).toEqual(['sanitizedValue'])
          expect(res.header['set-cookie'][0]).toContain('product_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax')
          expect(res.status).toBe(302)
          expect(res.header.location).toBe('/dashboard/user-dashboard')
        })
    })
  })
})
