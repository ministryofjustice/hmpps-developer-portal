import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import ServiceCatalogueService from '../services/serviceCatalogueService'
import { getDropDownOptions } from './dependencies'

jest.mock('../services/serviceCatalogueService.ts')

const serviceCatalogueService = new ServiceCatalogueService(null) as jest.Mocked<ServiceCatalogueService>

let app: Express
const testDependencies = ['type1::dependency1', 'type1::dependency2', 'type2::dependency3']

beforeEach(() => {
  serviceCatalogueService.getDependencies.mockResolvedValue(testDependencies)

  app = appWithAllRoutes({ services: { serviceCatalogueService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/components', () => {
  describe('getDropDownOptions()', () => {
    it('should provide drop down data from dependencies', async () => {
      const { dependencyTypes, dependencyNames } = await getDropDownOptions(serviceCatalogueService)

      expect(dependencyTypes).toEqual([
        { value: '', text: 'Please select' },
        { value: 'type1', text: 'type1', selected: false },
        { value: 'type2', text: 'type2', selected: false },
      ])

      expect(dependencyNames).toEqual([
        { value: '', text: 'Please select' },
        { value: 'dependency1', text: 'dependency1', selected: false },
        { value: 'dependency2', text: 'dependency2', selected: false },
        { value: 'dependency3', text: 'dependency3', selected: false },
      ])
    })

    it('should mark selected dependency type and name when provided', async () => {
      const { dependencyTypes, dependencyNames } = await getDropDownOptions(
        serviceCatalogueService,
        'type1::dependency2',
      )

      expect(dependencyTypes).toEqual([
        { value: '', text: 'Please select' },
        { value: 'type1', text: 'type1', selected: true },
        { value: 'type2', text: 'type2', selected: false },
      ])

      expect(dependencyNames).toEqual([
        { value: '', text: 'Please select' },
        { value: 'dependency1', text: 'dependency1', selected: false },
        { value: 'dependency2', text: 'dependency2', selected: true },
        { value: 'dependency3', text: 'dependency3', selected: false },
      ])
    })
  })

  describe('GET /', () => {
    it('should render components page', () => {
      return request(app)
        .get('/dependencies')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="dependency-type-select"]').length).toBe(1)
          expect($('[data-test="dependency-name-select"]').length).toBe(1)
          expect($('option[value="type1"]').length).toBe(1)
          expect($('option[value="dependency1"]').length).toBe(1)
          expect($('option[value="type1"]').text()).toBe('type1')
          expect($('option[value="dependency1"]').text()).toBe('dependency1')
        })
    })
  })

  describe.skip('POST /', () => {
    it('should render components page', () => {
      return request(app)
        .get('/dependencies')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test="type1::dependency1"]').length).toBe(1)
          expect($('[data-test="type1::dependency2"]').length).toBe(1)
          expect($('[data-test="type2::dependency3"]').length).toBe(1)
        })
    })
  })

  describe.skip('GET /data/:dependencyType/:dependencyName', () => {
    it('should output JSON data for dependencies', () => {
      return request(app)
        .get('/components/data/:dependencyType/:dependencyName')
        .expect('Content-Type', /application\/json/)
        .expect(res => {
          // expect(res.text).toStrictEqual(JSON.stringify(testComponents))
        })
    })
  })
})
