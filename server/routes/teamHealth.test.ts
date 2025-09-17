import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import TeamHealthService from '../services/teamHealthService'
import ComponentNameService from '../services/componentNameService'

jest.mock('../services/teamHealthService')
jest.mock('../services/componentNameService')

const teamHealthService = new TeamHealthService(null, null) as jest.Mocked<TeamHealthService>
const componentNameService = new ComponentNameService(null) as jest.Mocked<ComponentNameService>

let app: Express

const mockComponents = ['mock-component-1', 'mock-component-1', 'mock-component-3']

const mockTeamHealth = {
  drift: {
    'Mock Team 1': {
      teamSlug: 'mock-team-1',
      serviceAreaSlug: 'mock-service-area-1',
      numberOfComponents: 5,
      stats: {
        avg: 0,
        median: 0,
        max: 0,
        maxComponent: {
          staleness: {
            millis: 0,
            days: 0,
            hours: 0,
            description: 'not available',
            present: false,
            sortValue: -9007199254740991,
          },
          drift: {
            millis: 0,
            days: 0,
            hours: 0,
            description: 'not available',
            present: false,
            sortValue: -9007199254740991,
          },
          name: 'digital-prison-services',
        },
        days: [0, 0, 0, 0, 0],
      },
    },
    'Mock Team 2': {
      teamSlug: 'mock-team-2',
      serviceAreaSlug: 'mock-service-area-2',
      numberOfComponents: 8,
      stats: {
        avg: 0,
        median: 0,
        max: 0,
        maxComponent: {
          staleness: {
            millis: 0,
            days: 0,
            hours: 0,
            description: 'not available',
            present: false,
            sortValue: -9007199254740991,
          },
          drift: {
            millis: 0,
            days: 0,
            hours: 0,
            description: 'not available',
            present: false,
            sortValue: -9007199254740991,
          },
          name: 'hmpps-book-a-video-link-api',
        },
        days: [0, 0, 0],
      },
    },
  },
}

beforeEach(() => {
  componentNameService.getAllDeployedComponents = jest.fn().mockResolvedValue(mockComponents)
  teamHealthService.getTeamHealth = jest.fn().mockResolvedValue(mockTeamHealth)

  app = appWithAllRoutes({ services: { teamHealthService, componentNameService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/teamHealth', () => {
  describe('GET /', () => {
    it('should render the teamHealth page', async () => {
      return request(app)
        .get('/team-health')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const stalenessTable = $('#staleness .govuk-table')
          expect(stalenessTable.length).toBe(1)
          const driftTable = $('#drift .govuk-table')
          expect(driftTable.length).toBe(1)
        })
    })

    it('should render the staleness table', async () => {
      return request(app)
        .get('/team-health')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const stalenessTable = $('#staleness .govuk-table')
        })
    })

    it('should render the drift table', async () => {
      return request(app)
        .get('/team-health')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const driftTable = $('#drift .govuk-table')
        })
    })
  })
})
