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
    All: {
      teamSlug: 'all',
      serviceAreaSlug: 'undefined',
      numberOfComponents: 262,
      stats: {
        avg: 2.7,
        median: 0,
        max: 102,
        maxComponent: {
          staleness: {
            millis: 259200000,
            days: 3,
            hours: 72,
            description: '3 days',
            present: true,
            sortValue: 3,
          },
          drift: {
            millis: 8812800000,
            days: 102,
            hours: 2448,
            description: '3 months',
            present: true,
            sortValue: 102,
          },
          name: 'mock-component-1',
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

    // it('should render the staleness table', async () => {
    //   return request(app)
    //     .get('/team-health#staleness')
    //     .expect('Content-Type', /html/)
    //     .expect(200)
    //     .expect(res => {
    //       const $ = cheerio.load(res.text)
    //       const stalenessTable = $('#staleness .govuk-table')
    //       const cells = stalenessTable.find('tbody tr:first-child td')
    //       expect(cells.eq(0).text().trim()).toBe('All');
    //       expect(cells.eq(1).text().trim()).toBe('262');
    //       expect(cells.eq(2).text().trim()).toBe('0.64');
    //       expect(cells.eq(3).text().trim()).toBe('0');
    //       expect(cells.eq(4).text().trim()).toBe('6');
    //       expect(cells.eq(5).text()).toContain('mock-component-1');
    //       expect(cells.eq(5).text()).toContain('(5 days)');
    //       expect(cells.eq(5).attr('href')).toBe('/components/mock-component-1')
    //     })
    // })

    // it('should render the drift table', async () => {
    //   return request(app)
    //     .get('/team-health#drift')
    //     .expect('Content-Type', /html/)
    //     .expect(200)
    //     .expect(res => {
    //       const $ = cheerio.load(res.text)
    //       const driftTable = $('#drift .govuk-table')
    //       const cells = driftTable.find('tbody tr:first-child td')
    //       expect(cells.eq(0).text().trim()).toBe('All');
    //       expect(cells.eq(1).text().trim()).toBe('262');
    //       expect(cells.eq(2).text().trim()).toBe('2.70');
    //       expect(cells.eq(3).text().trim()).toBe('0');
    //       expect(cells.eq(4).text().trim()).toBe('102');
    //       // expect(cells.eq(5).text()).toContain('mock-component-1');
    //       expect(cells.eq(5).text()).toContain('mock-component-1 (102 days)');
    //       expect(cells.eq(5).attr('href')).toBe('/components/mock-component-1')
    //     })
    // })
  })
})
