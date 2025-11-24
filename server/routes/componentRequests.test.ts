import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ComponentNameService from '../services/componentNameService'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import DataFilterService from '../services/dataFilterService'
import { buildFormData, convertTeamsStringToArray } from './componentRequests'
import { GithubProjectVisibility, GithubRepoRequestRequest } from '../data/modelTypes'

jest.mock('../services/componentNameService.ts')
jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../services/dataFilterService')

const componentNameService = new ComponentNameService(null) as jest.Mocked<ComponentNameService>
const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const dataFilterService = new DataFilterService(null) as jest.Mocked<DataFilterService>

let app: Express
const testProductList = [
  { value: 'HMPPS123', text: 'example-product-one [HMPPS123]', selected: false },
  { value: 'HMPPS456', text: 'example-product-two [HMPPS456]', selected: false },
]

const testComponentsRequest = [
  {
    id: 12,
    github_repo: 'example-github-repo-1',
    repo_description: 'Example Component Team 1',
    requester_name: 'A.Bravo',
    request_github_pr_status: 'Completed',
    request_github_pr_number: 1234,
  },
  {
    id: 34,
    github_repo: 'example-github-repo-2',
    repo_description: 'Example Component Team 2',
    requester_name: 'C.Delta',
    request_github_pr_status: 'Completed',
    request_github_pr_number: 5678,
  },
]

const testComponentRequest = [
  {
    id: 123,
    github_repo: 'hmpps-visit-allocation-api',
    repo_description: 'Example service.',
    base_template: '',
    jira_project_keys: ['ABC'],
    github_project_visibility: 'internal' as const,
    product: 'HMPPS12',
    github_project_teams_write: ['hmpps-developers'],
    github_projects_teams_admin: ['hmpps-admijn'],
    github_project_branch_protection_restricted_teams: ['hmpps-example-team'],
    prod_alerts_severity_label: 'hmpps-severity-prod',
    nonprod_alerts_severity_label: 'hmpps-severity-nonprod',
    createdAt: '2025-10-14T12:11:12.820Z',
    updatedAt: '2025-10-14T12:24:14.784Z',
    publishedAt: '2025-10-14T12:24:14.793Z',
    slack_channel_prod_release_notify: 'C59LHEYAB9DI',
    alerts_nonprod_slack_channel: '',
    alerts_prod_slack_channel: '',
    slack_channel_nonprod_release_notify: 'C09L7PMQB9A',
    slack_channel_security_scans_notify: 'C08LL8N1Y6GE',
    requester_name: 'Alan Brown',
    requester_email: 'alan.brown@justice.gov.uk',
    requester_team: 'Example Team',
    request_github_pr_status: 'Completed',
    request_github_pr_number: 1193,
    namespace: '',
    documentId: 'q79n93czvi3pj45fut0vkjnu',
    request_type: 'Add',
  },
]

beforeEach(() => {
  componentNameService.checkComponentExists = jest.fn().mockResolvedValue(false)
  componentNameService.checkComponentRequestExists = jest.fn().mockResolvedValue(false)
  componentNameService.checkComponentArchiveRequestExists.mockResolvedValue(false)
  dataFilterService.getFormsDropdownLists.mockResolvedValue([[], testProductList])
  serviceCatalogueService.getGithubRepoRequests.mockResolvedValue(testComponentsRequest)
  serviceCatalogueService.getGithubRepoRequest.mockResolvedValue(testComponentRequest)
  serviceCatalogueService.postGithubRepoRequest = jest.fn().mockResolvedValue({})

  app = appWithAllRoutes({ services: { componentNameService, serviceCatalogueService, dataFilterService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/component-requests', () => {
  describe('GET /new', () => {
    it('should render component requests form', () => {
      return request(app)
        .get('/component-requests/new')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Assert page title
          expect($('title').text()).toContain('Component Request Form')
          // Assert form exists
          expect($('form').length).toBe(1)
          // Assert product dropdown exists
          const productSelect = $('#product')
          expect(productSelect.length).toBe(1)
          // Assert product options are rendered
          const options = productSelect.find('option')
          expect(options.length).toBe(2)
          expect(options.eq(0).attr('value')).toBe('HMPPS123')
          expect(options.eq(0).text()).toBe('example-product-one [HMPPS123]')
          expect(options.eq(1).attr('value')).toBe('HMPPS456')
          expect(options.eq(1).text()).toBe('example-product-two [HMPPS456]')
          // Assert service call was made
          expect(dataFilterService.getFormsDropdownLists).toHaveBeenCalledWith({
            teamName: '',
            productId: '',
            useFormattedName: true,
          })
        })
    })
  })

  describe('GET /', () => {
    it('should render component requests table', () => {
      return request(app)
        .get('/component-requests')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const table = $('#componentRequestsTable')
          expect(table.length).toBe(1)
        })
    })
  })

  describe('GET /data', () => {
    it('should return component requests as JSON', async () => {
      const response = await request(app)
        .get('/component-requests/data')
        .expect('Content-Type', /application\/json/)
        .expect(200)
      expect(serviceCatalogueService.getGithubRepoRequests).toHaveBeenCalled()
      expect(response.body).toEqual(testComponentsRequest)
    })
  })

  describe('GET /:repo_name/:requestType', () => {
    it('should render component request details in the table', async () => {
      return request(app)
        .get('/component-requests/hmpps-visit-allocation-api/Add')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(serviceCatalogueService.getGithubRepoRequest).toHaveBeenCalled()
          // Description
          expect($('.componentData th').first().text()).toBe('Request Type')
          expect($('.componentData td').first().text().trim()).toBe('Add')
          // Jira project keys
          const jiraLink = $('[data-test="jira-project-keys"] a').attr('href')
          expect(jiraLink).toContain('ABC')
          // Product
          expect($('.componentData td').filter((i, el) => $(el).text().includes('HMPPS12')).length).toBeGreaterThan(0)
          // GitHub Write team
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('hmpps-developers')).length,
          ).toBeGreaterThan(0)
          // GitHub Admin team
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('hmpps-admijn')).length,
          ).toBeGreaterThan(0)
          // GitHub Visibility
          expect($('.componentData td').filter((i, el) => $(el).text().includes('internal')).length).toBeGreaterThan(0)
          // Slack channel for security notification
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('C08LL8N1Y6GE')).length,
          ).toBeGreaterThan(0)
          // Slack channel for Production release notification
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('C59LHEYAB9DI')).length,
          ).toBeGreaterThan(0)
          // Slack channel for Non-Production release notification
          expect($('.componentData td').filter((i, el) => $(el).text().includes('C09L7PMQB9A')).length).toBeGreaterThan(
            0,
          )
          // Production alert severity label
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('hmpps-severity-prod')).length,
          ).toBeGreaterThan(0)
          // Non-Production alert severity label
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('hmpps-severity-nonprod')).length,
          ).toBeGreaterThan(0)
          // Request Status
          expect($('.componentData td').filter((i, el) => $(el).text().includes('Completed')).length).toBeGreaterThan(0)
          // Deployment PR
          expect(
            $('.componentData td a').filter((i, el) => $(el).attr('href')?.includes('1193')).length,
          ).toBeGreaterThan(0)
          // Requester Name
          expect($('.componentData td').filter((i, el) => $(el).text().includes('Alan Brown')).length).toBeGreaterThan(
            0,
          )
          // Requester Email
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('alan.brown@justice.gov.uk')).length,
          ).toBeGreaterThan(0)
          // Requesting Team
          expect(
            $('.componentData td').filter((i, el) => $(el).text().includes('Example Team')).length,
          ).toBeGreaterThan(0)
        })
    })
  })

  describe('POST /new', () => {
    const validFormTestData = {
      github_repo: 'hmpps-example-repo',
      repo_description: 'An example repo',
      base_template: 'node-template',
      jira_project_keys: ['ABC'],
      github_project_visibility: 'internal',
      product: 'HMPPS12',
      github_project_teams_write: ['hmpps-devs'],
      github_projects_teams_admin: ['hmpps-admins'],
      github_project_branch_protection_restricted_teams: ['example-team'],
      prod_alerts_severity_label: 'hmpps-severity-prod',
      nonprod_alerts_severity_label: 'hmpps-severity-nonprod',
      slack_channel_prod_release_notify: 'C1234567890',
      slack_channel_security_scans_notify: 'C0987654321',
      slack_channel_nonprod_release_notify: 'C1122334455',
      requester_name: 'Adam Bowie',
      requester_email: 'adam.bowie@justice.gov.uk',
      requester_team: 'Example Team',
    }

    it('should render component requests table', () => {
      dataFilterService.getFormsDropdownLists.mockResolvedValue([[], testProductList])
      return request(app)
        .post('/component-requests/new')
        .send(validFormTestData)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toContain('Request submitted.')
          expect($('.govuk-panel__title').text()).toContain('Request submitted.')
          expect($('.govuk-panel__body').text()).toContain('hmpps-example-repo')
        })
    })
  })

  describe('buildFormData', () => {
    it('should correctly transform and sanitize formData input', () => {
      const input = {
        github_repo: ' my-repo\n',
        repo_description: 'A test repo\r\nwith newlines',
        base_template: 'none',
        jira_project_keys: 'ABC,DEF',
        github_project_visibility: 'private' as GithubProjectVisibility,
        product: 'MyProduct',
        slack_channel_prod_release_notify: '#prod-channel',
        slack_channel_nonprod_release_notify: '#nonprod-channel',
        slack_channel_security_scans_notify: '#security-channel',
        prod_alerts_severity_label: 'high ',
        nonprod_alerts_severity_label: 'low',
        github_project_teams_write: 'team-a, team-b ',
        github_projects_teams_admin: 'admin-team',
        github_project_branch_protection_restricted_teams: 'restricted-team',
        requester_name: ' Amy Barnes ',
        requester_email: 'amy.barnes@justice.gov.uk ',
        requester_team: 'Engineering',
      }

      const expected: GithubRepoRequestRequest = {
        data: {
          github_repo: 'my-repo',
          repo_description: 'A test repo with newlines',
          base_template: '',
          jira_project_keys: ['ABC', 'DEF'],
          github_project_visibility: 'private',
          product: 'MyProduct',
          slack_channel_prod_release_notify: 'prod-channel',
          slack_channel_nonprod_release_notify: 'nonprod-channel',
          slack_channel_security_scans_notify: 'security-channel',
          prod_alerts_severity_label: 'high',
          nonprod_alerts_severity_label: 'low',
          github_project_teams_write: ['team-a', 'team-b'],
          github_projects_teams_admin: ['admin-team'],
          github_project_branch_protection_restricted_teams: ['restricted-team'],
          requester_name: 'Amy Barnes',
          requester_email: 'amy.barnes@justice.gov.uk',
          requester_team: 'Engineering',
          request_github_pr_status: 'Pending',
        },
      }

      const result = buildFormData(input)
      expect(result).toEqual(expected)
    })

    it('should handle missing optional fields gracefully', () => {
      const input = {
        github_repo: 'repo',
        github_project_visibility: 'public' as GithubProjectVisibility,
        github_projects_teams_admin: 'admin-team',
        requester_name: 'Amy',
        requester_email: 'amy.barnes@justice.gov.uk',
      }

      const result = buildFormData(input)
      expect(result.data.github_repo).toBe('repo')
      expect(result.data.github_project_visibility).toBe('public')
      expect(result.data.github_projects_teams_admin).toEqual(['admin-team'])
      expect(result.data.requester_name).toBe('Amy')
      expect(result.data.requester_email).toBe('amy.barnes@justice.gov.uk')
      expect(result.data.request_github_pr_status).toBe('Pending')
    })
  })

  describe('convertTeamsStringToArray', () => {
    it('should split a comma-separated string into trimmed array items', () => {
      const input = 'team-a, team-b ,team-c'
      const expected = ['team-a', 'team-b', 'team-c']
      expect(convertTeamsStringToArray(input)).toEqual(expected)
    })
    it('should remove empty entries and trim whitespace', () => {
      const input = ' team-a, , , team-b '
      const expected = ['team-a', 'team-b']
      expect(convertTeamsStringToArray(input)).toEqual(expected)
    })
    it('should return an empty array for an empty string', () => {
      expect(convertTeamsStringToArray('')).toEqual([])
    })
    it('should handle single team name correctly', () => {
      expect(convertTeamsStringToArray('team-a')).toEqual(['team-a'])
    })
    it('should handle extra commas gracefully', () => {
      const input = ',team-a,,team-b,,'
      const expected = ['team-a', 'team-b']
      expect(convertTeamsStringToArray(input)).toEqual(expected)
    })
  })
})
