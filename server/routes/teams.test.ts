import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { Team } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testTeams = [{ name: 'testTeam' } as Team]

beforeEach(() => {
  serviceCatalogueService.getTeams.mockResolvedValue(testTeams)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/teams', () => {
  describe('GET /', () => {
    it('should render teams page', () => {
      return request(app)
        .get('/teams')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#teams')).toBeDefined()
        })
    })
  })

  describe('GET /data', () => {
    it('should output JSON data for teams', () => {
      return request(app)
        .get('/teams/data')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          expect(res.text).toStrictEqual(JSON.stringify(testTeams))
        })
    })
  })
})
