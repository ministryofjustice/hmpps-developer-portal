import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Developer Portal')
      })
  })
})

describe('GET /info', () => {
  it('should render index page', () => {
    return request(app)
      .get('/info')
      .expect('Content-Type', /application\/json/)
      .expect(res => {
        const info = JSON.parse(res.text)

        expect(info.uptime?.toString()).toMatch(/^\d+\.\d+$/)
        expect(info.version).toEqual('1')
        expect(info.productId).toEqual('product id')
        expect(info.build).toEqual({
          buildNumber: '1',
          gitRef: 'long ref',
        })
      })
  })
})
