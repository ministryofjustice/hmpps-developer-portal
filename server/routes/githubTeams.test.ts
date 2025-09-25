import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { GithubTeam, ScheduledJob } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express

const mockScheduledJob = {
  id: 12,
  name: 'hmpps-mock-scheduled-job',
  description: 'Mock description.',
  schedule: '05 */6 * * *',
  last_scheduled_run: '2025-09-08T06:08:39.972Z',
  createdAt: '2025-04-24T12:27:23.968Z',
  updatedAt: '2025-09-08T06:08:39.988Z',
  publishedAt: '2025-04-24T12:27:24.732Z',
  result: 'Succeeded',
  error_details: [],
  last_successful_run: '2025-09-08T06:08:39.972Z',
  documentId: 'mockId',
} as ScheduledJob

const mockGithubTeams = [
  {
    id: 123,
    github_team_id: 12345678,
    team_name: 'mock-team-1',
    parent_team_name: 'hmpps-mock-parent-team-1',
    team_desc: 'HMPPS Mock Team 1',
    createdAt: '2025-07-01T15:03:50.752Z',
    updatedAt: '2025-07-01T15:03:50.752Z',
    publishedAt: '2025-07-01T15:03:50.751Z',
    members: ['alice', 'ben', 'charlotte'],
    terraform_managed: true,
    documentId: 'mockId123',
  },
  {
    id: 456,
    github_team_id: 45678901,
    team_name: 'mock-team-2',
    parent_team_name: 'hmpps-mock-parent-team-2',
    team_desc: 'HMPPS Mock Team 2',
    createdAt: '2025-07-01T15:03:31.089Z',
    updatedAt: '2025-07-01T15:03:31.089Z',
    publishedAt: '2025-07-01T15:03:31.088Z',
    members: ['david', 'emma', 'frank'],
    terraform_managed: true,
    documentId: 'mockId456',
  },
]

const mockGithubTeamRequest = {
  id: 123,
  github_team_id: 12345678,
  team_name: 'mock-team-1',
  parent_team_name: 'hmpps-mock-parent-team-1',
  team_desc: 'HMPPS Mock Team 1',
  createdAt: '2025-07-01T15:03:50.752Z',
  updatedAt: '2025-07-01T15:03:50.752Z',
  publishedAt: '2025-07-01T15:03:50.751Z',
  members: ['alice', 'ben', 'charlotte'],
  terraform_managed: true,
  documentId: 'mockId123',
}

beforeEach(() => {
  serviceCatalogueService.getScheduledJob.mockResolvedValue(mockScheduledJob)
  serviceCatalogueService.getGithubTeams.mockResolvedValue(mockGithubTeams)
  serviceCatalogueService.getGithubTeam.mockResolvedValue(mockGithubTeamRequest)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/githubTeams', () => {
  describe('GET /', () => {
    it('should render the githubTeams page', async () => {
      return request(app)
        .get('/githubTeams')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          expect(serviceCatalogueService.getScheduledJob).toHaveBeenCalled()
          const $ = cheerio.load(res.text)
          const table = $('#githubTeamsTable')
          expect(table.length).toBe(1)
        })
    })
  })

  describe('GET /data', () => {
    it('should fetch githubTeams data', async () => {
      const mockResult = [
        {
          id: 123,
          github_team_id: 12345678,
          team_name: 'mock-team-1',
          parent_team_name: 'hmpps-mock-parent-team-1',
          team_desc: 'HMPPS Mock Team 1',
          createdAt: '2025-07-01T15:03:50.752Z',
          updatedAt: '2025-07-01T15:03:50.752Z',
          publishedAt: '2025-07-01T15:03:50.751Z',
          members: ['alice', 'ben', 'charlotte'],
          terraform_managed: true,
          documentId: 'mockId123',
        },
        {
          id: 456,
          github_team_id: 45678901,
          team_name: 'mock-team-2',
          parent_team_name: 'hmpps-mock-parent-team-2',
          team_desc: 'HMPPS Mock Team 2',
          createdAt: '2025-07-01T15:03:31.089Z',
          updatedAt: '2025-07-01T15:03:31.089Z',
          publishedAt: '2025-07-01T15:03:31.088Z',
          members: ['david', 'emma', 'frank'],
          terraform_managed: true,
          documentId: 'mockId456',
        },
      ]
      return request(app)
        .get('/githubTeams/data')
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual(mockResult)
          expect(serviceCatalogueService.getGithubTeams).toHaveBeenCalled()
        })
    })
  })

  describe('GET /:github_team_name', () => {
    it('should fetch githubTeam data and display description, parent team, team members, the github team link and the sub teams as "none"', async () => {
      const mockTeamName = 'hmpps-mock-team'

      const mockSubTeams = [] as GithubTeam[]

      serviceCatalogueService.getGithubSubTeams.mockResolvedValue(mockSubTeams)

      return request(app)
        .get(`/githubTeams/${mockTeamName}`)
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const tableRows = $('.componentData tbody tr')

          expect($(tableRows).eq(0).find('td').text().trim()).toBe('HMPPS Mock Team 1')
          expect($(tableRows).eq(1).find('td a').text().trim()).toBe('hmpps-mock-parent-team-1')
          expect($(tableRows).eq(1).find('td a').attr('href')).toBe('/github-teams/hmpps-mock-parent-team-1')
          expect($(tableRows).eq(2).find('td').text().trim()).toBe('None')
          expect($(tableRows).eq(3).find('td ul li').length).toBe(3)
          expect($(tableRows).eq(4).find('td a').text().trim()).toBe('mock-team-1')
          expect($(tableRows).eq(4).find('td a').attr('href')).toBe(
            'https://github.com/orgs/ministryofjustice/teams/mock-team-1',
          )
        })
    })
    it('should fetch githubTeam data and display description, parent team, team members, the github team link and the sub team list', async () => {
      const mockTeamName = 'hmpps-mock-team'

      const mockSubTeams = [
        {
          id: 123,
          github_team_id: 12345678,
          team_name: 'mock-sub-team-1',
          parent_team_name: 'hmpps-mock-team',
          team_desc: 'HMPPS Mock Sub Team 1',
          createdAt: '2025-07-01T15:03:50.752Z',
          updatedAt: '2025-07-01T15:03:50.752Z',
          publishedAt: '2025-07-01T15:03:50.751Z',
          members: ['alice', 'ben', 'charlotte'],
          terraform_managed: true,
          documentId: 'mockId123',
        },
        {
          id: 456,
          github_team_id: 45678901,
          team_name: 'mock-sub-team-2',
          parent_team_name: 'hmpps-mock-team',
          team_desc: 'HMPPS Mock Sub Team 2',
          createdAt: '2025-07-01T15:03:31.089Z',
          updatedAt: '2025-07-01T15:03:31.089Z',
          publishedAt: '2025-07-01T15:03:31.088Z',
          members: ['david', 'emma', 'frank'],
          terraform_managed: true,
          documentId: 'mockId456',
        },
      ] as GithubTeam[]

      serviceCatalogueService.getGithubSubTeams.mockResolvedValue(mockSubTeams)

      return request(app)
        .get(`/githubTeams/${mockTeamName}`)
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const tableRows = $('.componentData tbody tr')

          expect($(tableRows).eq(0).find('td').text().trim()).toBe('HMPPS Mock Team 1')
          expect($(tableRows).eq(1).find('td a').text().trim()).toBe('hmpps-mock-parent-team-1')
          expect($(tableRows).eq(1).find('td a').attr('href')).toBe('/github-teams/hmpps-mock-parent-team-1')
          expect($(tableRows).eq(2).find('td ul li').length).toBe(2)
          expect($(tableRows).eq(3).find('td ul li').length).toBe(3)
          expect($(tableRows).eq(4).find('td a').text().trim()).toBe('mock-team-1')
          expect($(tableRows).eq(4).find('td a').attr('href')).toBe(
            'https://github.com/orgs/ministryofjustice/teams/mock-team-1',
          )
        })
    })
  })
})
