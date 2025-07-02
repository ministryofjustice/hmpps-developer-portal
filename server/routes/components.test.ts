import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import RedisService from '../services/redisService'
import { Component, DataItem, Environment } from '../data/strapiApiTypes'
import Dependencies from '../services/Dependencies'

jest.mock('../services/serviceCatalogueService.ts')
jest.mock('../services/redisService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>
const redisService = new RedisService(null) as jest.Mocked<RedisService>

let app: Express
const testComponents = [{ id: 1, attributes: { name: 'testComponent' } }] as DataItem<Component>[]
const testComponent = {
  name: 'testComponent',
  description: 'Test component description',
  jira_project_keys: ['TEST'],
  github_project_teams_write: ['test-write'],
  github_project_teams_admin: ['test-admin'],
  github_project_branch_protection_restricted_teams: ['test-restricted'],
  github_project_visibility: 'public',
  createdAt: '2023-06-07T11:07:00.459Z',
  updatedAt: '2023-10-25T01:25:05.964Z',
  publishedAt: '2023-06-07T11:07:00.444Z',
  title: 'testTitle',
  app_insights_cloud_role_name: 'test-cloud-role-name',
  api: true,
  frontend: false,
  part_of_monorepo: false,
  github_repo: 'test-github-repo',
  language: 'Kotlin',
  include_in_subject_access_requests: false,
  github_project_teams_maintain: [],
  github_topics: [],
  versions: {
    helm: {
      dependencies: {
        'generic-service': '2.1.0',
        'generic-prometheus-alerts': '1.1.0',
      },
    },
    gradle: {
      hmpps_gradle_spring_boot: '5.7.0',
    },
    circleci: {
      orbs: {
        hmpps: '6',
      },
    },
    dockerfile: {
      base_image: 'eclipse-temurin:20-jre-jammy',
    },
  },
  container_image: 'quay.io/test-image',
  product: {
    data: {
      id: 94,
      attributes: {
        name: 'Test Product',
        subproduct: false,
        legacy: false,
        description: 'Test product description',
        phase: 'Alpha',
        delivery_manager: 'Test DM',
        product_manager: 'Test PM',
        confluence_link: '',
        gdrive_link: '',
        createdAt: '2023-07-04T10:48:30.760Z',
        updatedAt: '2023-10-25T06:40:06.112Z',
        publishedAt: '2023-07-04T10:48:30.755Z',
        p_id: 'DPS031',
      },
    },
  },
  envs: {
    data: [
      {
        attributes: {
          id: 46778,
          name: 'dev',
          namespace: 'test-namespace-svc-dev',
          info_path: '/info',
          health_path: '/health',
          url: 'https://dev.test.com',
          cluster: 'live-cluster.com',
          active_agencies: ['LEI', 'EAI'],
          type: 'dev',
          monitor: true,
          swagger_docs: '/swagger-ui.html',
        },
      },
      {
        attributes: {
          id: 48914,
          name: 'staging',
          namespace: 'test-namespace-svc-staging',
          info_path: '/info',
          health_path: '/health',
          url: 'https://stage.test.com',
          cluster: 'live-cluster.com',
          type: 'stage',
          monitor: true,
          swagger_docs: '/swagger-ui.html',
        },
      },
      {
        attributes: {
          id: 46779,
          name: 'dev-all-agencies',
          namespace: 'test-namespace-svc-dev-all-agencies',
          info_path: '/info',
          health_path: '/health',
          url: 'https://dev.test.com',
          cluster: 'live-cluster.com',
          active_agencies: ['***'],
          type: 'dev',
          monitor: true,
          swagger_docs: '/swagger-ui.html',
        },
      },
      {
        attributes: {
          id: 46780,
          name: 'dev-not-set-agencies',
          namespace: 'test-namespace-svc-not-set-agencies',
          info_path: '/info',
          health_path: '/health',
          url: 'https://dev.test.com',
          cluster: 'live-cluster.com',
          active_agencies: undefined,
          type: 'dev',
          monitor: true,
          swagger_docs: '/swagger-ui.html',
        },
      },
    ],
  },
} as unknown as Component

beforeEach(() => {
  serviceCatalogueService.getComponents.mockResolvedValue(testComponents)
  serviceCatalogueService.getComponent.mockResolvedValue(testComponent)

  const dependencies = new Dependencies({
    PROD: {
      categoryToComponent: { GOTENBERG: ['aaa'] },
      componentDependencyInfo: {
        [testComponent.name]: {
          dependencies: {
            components: ['bbbb'],
            categories: ['GOTENBERG'],
            other: [],
          },
          dependents: [{ name: 'aaaa', isKnownComponent: true }],
        },
      },
      missingServices: [],
    },
    PREPROD: {
      categoryToComponent: {},
      componentDependencyInfo: {},
      missingServices: [],
    },
    DEV: {
      categoryToComponent: {},
      componentDependencyInfo: {},
      missingServices: [],
    },
  })

  redisService.getAllDependencies.mockResolvedValue(dependencies)

  app = appWithAllRoutes({ services: { serviceCatalogueService, redisService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/components', () => {
  describe('GET /', () => {
    it('should render components page', () => {
      serviceCatalogueService.getScheduledJob.mockResolvedValue({
        id: 1,
        name: 'hmpps-github-discovery-incremental',
        last_successful_run: '2023-10-01T12:00:00Z',
      })
      return request(app)
        .get('/components')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('#componentsTable').length).toBe(1)
        })
    })
  })

  describe('GET /:componentId', () => {
    it('should render component page', () => {
      return request(app)
        .get(`/components/${testComponent.name}`)
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="detail-page-title"]').text()).toContain(testComponent.name)
          expect($('[data-test="description"]').text()).toBe(testComponent.description)
          expect($('[data-test="title"]').text()).toBe(testComponent.title)
          expect($('[data-test="jira-project-keys"]').text()).toContain(
            (testComponent.jira_project_keys as string[]).join(', '),
          )
          expect($('[data-test="github-write"]').text()).toContain(
            (testComponent.github_project_teams_write as string[]).join(', '),
          )
          expect($('[data-test="github-admin"]').text()).toContain(
            (testComponent.github_project_teams_admin as string[]).join(', '),
          )
          expect($('[data-test="github-restricted"]').text()).toContain(
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
          expect($('[data-test="dependency-types"]').text()).toBe('GOTENBERG')
          expect($('[data-test="dependency-0"]').text()).toContain('bbb')
          expect($('[data-test="dependent-0"]').text()).toContain('aaa')

          const environments = testComponent.envs.data.reduce(
            (environmentList, environment) => `${environmentList}${environment.attributes.name}`,
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

  describe('GET /:componentName/environment/:environmentName', () => {
    it('should render environment page and have multiple active agencies', () => {
      return request(app)
        .get('/components/testComponent/environment/dev')
        .expect('Content-Type', /html/)
        .expect(res => {
          const devEnvironment = testComponent.envs.data.find(env => env.attributes.name === 'dev')
          expect(devEnvironment).not.toBeNull()
          const $ = cheerio.load(res.text)
          expectEnvironmentScreenToBeFilled($, devEnvironment)
          const activeAgencies = devEnvironment.attributes.active_agencies as Array<string>
          expect($('td[data-test="active-agencies"]').text()).toBe(activeAgencies.join(', '))
        })
    })
  })
  it('should render environment page for all agencies, denoted by *** in the info endpoint', () => {
    return request(app)
      .get('/components/testComponent/environment/dev-all-agencies')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const devEnvironment = testComponent.envs.data.find(env => env.attributes.name === 'dev-all-agencies')
        expect(devEnvironment).not.toBeNull()
        const $ = cheerio.load(res.text)
        expectEnvironmentScreenToBeFilled($, devEnvironment)
        expect($('td[data-test="active-agencies"]').text()).toBe('All agencies')
      })
  })
  it('should render environment page for agencies not set on info endpoint', () => {
    return request(app)
      .get('/components/testComponent/environment/dev-not-set-agencies')
      .expect('Content-Type', /html/)
      .expect(res => {
        const devEnvironment = testComponent.envs.data.find(env => env.attributes.name === 'dev-not-set-agencies')
        expect(devEnvironment).not.toBeNull()
        const $ = cheerio.load(res.text)
        expectEnvironmentScreenToBeFilled($, devEnvironment)
        expect($('td[data-test="active-agencies"]').text()).toBe('Not set')
      })
  })
})

function expectEnvironmentScreenToBeFilled(
  $: cheerio.CheerioAPI,
  { attributes: devEnvironment }: DataItem<Environment>,
) {
  expect($('td[data-test="name"]').text()).toBe(devEnvironment.name)
  expect($('td[data-test="type"]').text()).toBe(devEnvironment.type)
  expect($('a[data-test="url"]').attr('href')).toBe(devEnvironment.url)
  expect($('a[data-test="url"]').text()).toBe(devEnvironment.url)
  expect($('a[data-test="api"]').length).toBeGreaterThan(0)
  expect($('a[data-test="api"]').attr('href')).toBe(`${devEnvironment.url}${devEnvironment.swagger_docs}`)
  expect($('a[data-test="namespace"]').attr('href')).toBe(
    `https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/${devEnvironment.namespace}`,
  )
  expect($('a[data-test="namespace"]').text()).toBe(devEnvironment.namespace)
  expect($('a[data-test="namespace-local"]').attr('href')).toBe(`/namespaces/${devEnvironment.namespace}`)
  expect($('a[data-test="namespace-local"]').text()).toBe(devEnvironment.namespace)
  expect($('a[data-test="info"]').attr('href')).toBe(`${devEnvironment.url}${devEnvironment.info_path}`)
  expect($('a[data-test="info"]').text()).toBe(devEnvironment.info_path)
  expect($('a[data-test="health"]').attr('href')).toBe(`${devEnvironment.url}${devEnvironment.health_path}`)
  expect($('a[data-test="health"]').text()).toBe(devEnvironment.health_path)
  expect($('td[data-test="cluster"]').text()).toBe(devEnvironment.cluster)
}
