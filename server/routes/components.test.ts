import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { Component } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testComponents = [{ name: 'testProduct' } as Component]

beforeEach(() => {
  serviceCatalogueService.getComponents.mockResolvedValue(testComponents)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/components', () => {
  describe('GET /', () => {
    it('should render components page', () => {
      return request(app)
        .get('/components')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#components')).toBeDefined()
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for components', () => {
      return request(app)
        .get('/components/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testComponents))
        })
    })
  })
})