import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { CookieService } from '../services/cookieService'
import { Product } from '../data/modelTypes'
import { sanitizeCookieInput } from '../services/sanitizeCookieInput'
import config from '../config'
import RecommendedVersionsService from '../services/recommendedVersionsService'

jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../services/cookieService')
jest.mock('../services/sanitizeCookieInput')
jest.mock('../services/RecommendedVersionsService', () => ({
  _esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getRecommendedVersions: jest.fn().mockResolvedValue(undefined),
  })),
}))

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const mockedSanitizeService = jest.mocked(sanitizeCookieInput)
const MockedCookieService = CookieService as jest.MockedClass<typeof CookieService>
let app: Express

const mockProductsList = [{ name: 'sanitizedValue', slug: 'sanitizedValue' }, { name: 'product 2' }] as Product[]
const mockCurrentProductsList = ['product 3']
const testProduct = {
  name: 'sanitizedValue',
  p_id: '1',
  lead_developer: 'Some Lead Developer',
  product_manager: 'Some Product Manager',
  delivery_manager: 'Some Lead Developer',
  team: {
    name: 'Test Team',
  },
  components: [
    {
      name: 'test-component',
      description: 'Test Component Description',
      language: 'Kotlin',
    },
  ],
} as Product

beforeEach(() => {
  jest.clearAllMocks()
  MockedCookieService.prototype.setStringHeader.mockReturnValue(
    'user_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax',
  )
  jest
    .spyOn(MockedCookieService.prototype, 'setStringHeader')
    .mockReturnValue('product_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax')
  jest.spyOn(MockedCookieService.prototype, 'getFavouritesFromCookie').mockReturnValue(mockCurrentProductsList)
  jest.spyOn(MockedCookieService.prototype, 'removeEncodedQuotes').mockReturnValue('user_name=sanitizedValue')

  serviceCatalogueService.getProducts.mockResolvedValue(mockProductsList)
  mockedSanitizeService.mockReturnValue('sanitizedValue')
  serviceCatalogueService.getProduct.mockResolvedValue(testProduct)

  // const mockRecommendedVersionService = new RecommendedVersionsService(serviceCatalogueService)
  // mockRecommendedVersionService.getRecommendedVersions()

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

// describe('/dashboard', () => {
//   describe('GET /', () => {
//     it('should render dashboard page', () => {
//       return request(app)
//         .get('/dashboard/?value=product&error=none')
//         .expect('Content-Type', 'text/html; charset=utf-8')
//         .expect(200)
//     })
//     it('shows the users name when it has been set', () => {
//       MockedCookieService.prototype.getString.mockReturnValueOnce('testName').mockReturnValueOnce('yes')
//       return request(app)
//         .get('/dashboard')
//         .set('Cookie', [
//           `${config.cookieKeys.userNameCookie}=testName`,
//           `${config.cookieKeys.userPreferencesCookie}=yes`,
//           `${config.cookieKeys.hideCookies}=yes`,
//         ])
//         .expect(res => {
//           expect(res.text).toContain('id="welcome-known-user-heading"')
//         })
//     })
//     it('shows the enter user name input box when it has not been set', () => {
//       MockedCookieService.prototype.getString.mockReturnValueOnce(undefined).mockReturnValueOnce('yes')
//       return request(app)
//         .get('/dashboard')
//         .set('Cookie', [`${config.cookieKeys.userPreferencesCookie}=yes`, `${config.cookieKeys.hideCookies}=yes`])
//         .expect(res => {
//           expect(res.text).toContain('id="welcome-unknown-user-heading"')
//         })
//     })
//     it('shows the products summary box when it has been set', () => {
//       MockedCookieService.prototype.getFavouritesFromCookie.mockReturnValue(['sanitizedValue'])
//       MockedCookieService.prototype.getString.mockReturnValue('yes')
//       return request(app)
//         .get('/dashboard')
//         .set('Cookie', [
//           `${config.cookieKeys.userPreferencesCookie}=yes`,
//           `${config.cookieKeys.productNameCookie}=%5B%22sanitizedValue%22%5D`,
//         ])
//         .expect(res => {
//           expect(res.text).toContain('class="govuk-summary-card"')
//         })
//     })
//     it('shows that you have no pinned products box when no products have been set', () => {
//       MockedCookieService.prototype.getFavouritesFromCookie.mockReturnValue(undefined)
//       MockedCookieService.prototype.getString.mockReturnValue('yes')
//       return request(app)
//         .get('/dashboard')
//         .set('Cookie', [`${config.cookieKeys.userPreferencesCookie}=yes`])
//         .expect(res => {
//           expect(res.text).not.toContain('class="govuk-summary-card"')
//         })
//     })
//   })

describe('POST /name', () => {
  it('should set the users name as a user_name cookie and redirect user to dashboard', () => {
    return request(app)
      .post('/dashboard/name')
      .set('Cookie', [`${config.cookieKeys.userPreferencesCookie}=yes`])
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
        expect(res.header.location).toBe('/dashboard')
      })
  })
})

describe('POST/saved-products/add', () => {
  it('should add a product to the product cookie and redirect user to the dashboard', () => {
    return request(app)
      .post('/dashboard/saved-products/add')
      .set('Cookie', [
        `${config.cookieKeys.userPreferencesCookie}=yes`,
        `${config.cookieKeys.productNameCookie}=%5B%22test%22%5D`,
      ])
      .send({ product: 'product 1' })
      .expect(async res => {
        expect(mockedSanitizeService).toHaveBeenCalledWith('product 1', {
          collapseWhitespace: false,
          defaultInput: '',
        })
        const sanitizedProductValue = mockedSanitizeService('product 1')
        expect(sanitizedProductValue).toEqual('sanitizedValue')
        expect(MockedCookieService.prototype.getFavouritesFromCookie).toHaveBeenCalledWith(
          expect.any(Object),
          'product_name',
        )
        expect(MockedCookieService.prototype.setStringHeader).toHaveBeenCalledWith(
          'product_name',
          mockCurrentProductsList,
        )
        const prodList = MockedCookieService.prototype.setStringHeader.mock.calls[0]
        const finalSavedProdList = prodList[1]
        expect(finalSavedProdList).toEqual(['product 3', 'sanitizedValue'])
        expect(res.header['set-cookie'][0]).toContain('product_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax')
        expect(res.status).toBe(302)
        expect(res.header.location).toBe('/dashboard')
      })
  })
})

describe('POST/saved-products/delete', () => {
  it('should remove a product from the product cookie and redirect user to the dashboard', () => {
    return request(app)
      .post('/dashboard/saved-products/delete')
      .set('Cookie', [
        `${config.cookieKeys.userPreferencesCookie}=yes`,
        `${config.cookieKeys.productNameCookie}=%5B%22test%22%5D`,
      ])
      .send({ delete: 'sanitizedValue' })
      .expect(res => {
        expect(MockedCookieService.prototype.setStringHeader).toHaveBeenCalledWith('product_name', ['product 3'])
        const prodList = MockedCookieService.prototype.setStringHeader.mock.calls[0]
        const finalSavedProdList = prodList[1]
        expect(finalSavedProdList).toEqual(['product 3'])
        expect(res.header['set-cookie'][0]).toContain('product_name=sanitizedValue; Path=/; HttpOnly; SameSite=Lax')
        expect(res.status).toBe(302)
        expect(res.header.location).toBe('/dashboard')
      })
  })
})
// })
