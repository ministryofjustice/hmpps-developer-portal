import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { getDropDownOptions } from './dependencies'
// import { Component, ComponentListResponseDataItem } from '../data/strapiApiTypes'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testDependencies = ['type1::dependency1,type1::dependency2,type2::dependency3']

beforeEach(() => {
  serviceCatalogueService.getDependencies.mockResolvedValue(testDependencies)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/components', () => {
  describe.only('getDropDownOptions()', () => {
    const dependencies = getDropDownOptions(serviceCatalogueService)
  })

  describe('GET /', () => {
    it('should render components page', () => {
      return request(app)
        .get('/components')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#componentsTable').length).toBe(1)
        })
    })
  })

  describe('GET /:componentId', () => {
    it('should render component page', () => {
      return request(app)
        .get('/components/1')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testComponent.name)
          expect($('[data-test="description"]').text()).toBe(testComponent.description)
          expect($('[data-test="title"]').text()).toBe(testComponent.title)
          expect($('[data-test="jira-project-keys"]').text()).toBe(
            (testComponent.jira_project_keys as string[]).join(','),
          )
          expect($('[data-test="github-write"]').text()).toBe(
            (testComponent.github_project_teams_write as string[]).join(','),
          )
          expect($('[data-test="github-admin"]').text()).toBe(
            (testComponent.github_project_teams_admin as string[]).join(','),
          )
          expect($('[data-test="github-restricted"]').text()).toBe(
            (testComponent.github_project_branch_protection_restricted_teams as string[]).join(','),
          )
          expect($('[data-test="github-repo"]').text()).toBe(testComponent.github_repo)
          expect($('[data-test="github-visibility"]').text()).toBe(testComponent.github_project_visibility)
          expect($('[data-test="appinsights-name"]').text()).toBe(testComponent.app_insights_cloud_role_name)
          expect($('[data-test="api"]').text()).toBe(testComponent.api ? 'Yes' : 'No')
          expect($('[data-test="frontend"]').text()).toBe(testComponent.frontend ? 'Yes' : 'No')
          expect($('[data-test="part-of-monorepo"]').text()).toBe(testComponent.part_of_monorepo ? 'Yes' : 'No')
          expect($('[data-test="language"]').text()).toBe(testComponent.language)
          expect($('[data-test="product"]').text()).toBe(testComponent.product.data.attributes.name)

          const environments = testComponent.environments.reduce(
            (environmentList, environment) => `${environmentList}${environment.type}`,
            '',
          )

          expect($('[data-test="environment"]').text()).toBe(environments)
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
