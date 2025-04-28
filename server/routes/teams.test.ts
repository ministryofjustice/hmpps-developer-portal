import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { Team, TeamListResponseDataItem } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testTeams = [{ id: 1, attributes: { name: 'testTeam' } }] as TeamListResponseDataItem[]
const testTeam = {
  t_id: 'testTeamId',
  name: 'testTeamName',
  products: {
    data: [
      {
        id: 23,
        attributes: {
          name: 'productName',
        },
      },
    ],
  },
} as Team

beforeEach(() => {
  serviceCatalogueService.getTeams.mockResolvedValue(testTeams)
  serviceCatalogueService.getTeam.mockResolvedValue(testTeam)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/teams', () => {
  describe('GET /', () => {
    it('should render teams page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/teams')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#teamsTable').length).toBe(1)
        })
    })
  })

  describe('GET /:teamId', () => {
    it('should render team page with products list if there are products', () => {
      return request(app)
        .get('/teams/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testTeam.name)
          expect($('[data-test="team-id"]').text()).toBe(testTeam.t_id)
          expect($('[data-test="no-products"]').text()).toBe('')
          expect($(`[data-test="product-${testTeam.products.data[0].id}"]`).text()).toBe(
            testTeam.products.data[0].attributes.name,
          )
        })
    })

    it('should render team page with none shown if there are no products', () => {
      const testTeamNoProducts = {
        t_id: 'testTeamId',
        name: 'testTeamName',
        products: {},
      } as Team

      serviceCatalogueService.getTeam.mockResolvedValue(testTeamNoProducts)

      return request(app)
        .get('/teams/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testTeamNoProducts.name)
          expect($('[data-test="team-id"]').text()).toBe(testTeamNoProducts.t_id)
          expect($('[data-test="no-products"]').text()).toBe('None')
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
