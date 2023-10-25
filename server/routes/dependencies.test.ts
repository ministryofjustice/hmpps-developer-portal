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
      const dependencies = await getDropDownOptions(serviceCatalogueService)

      expect(dependencies).toEqual([
        { value: '', text: 'Please select' },
        {
          value: 'type1::dependency1',
          text: 'type1: dependency1',
          selected: false,
          attributes: {
            'data-test': 'type1::dependency1',
          },
        },
        {
          value: 'type1::dependency2',
          text: 'type1: dependency2',
          selected: false,
          attributes: {
            'data-test': 'type1::dependency2',
          },
        },
        {
          value: 'type2::dependency3',
          text: 'type2: dependency3',
          selected: false,
          attributes: {
            'data-test': 'type2::dependency3',
          },
        },
      ])
    })

    it('should provide drop down data from dependencies selecting the chosen option when provided', async () => {
      const dependencies = await getDropDownOptions(serviceCatalogueService, 'type1::dependency2')

      expect(dependencies).toEqual([
        { value: '', text: 'Please select' },
        {
          value: 'type1::dependency1',
          text: 'type1: dependency1',
          selected: false,
          attributes: {
            'data-test': 'type1::dependency1',
          },
        },
        {
          value: 'type1::dependency2',
          text: 'type1: dependency2',
          selected: true,
          attributes: {
            'data-test': 'type1::dependency2',
          },
        },
        {
          value: 'type2::dependency3',
          text: 'type2: dependency3',
          selected: false,
          attributes: {
            'data-test': 'type2::dependency3',
          },
        },
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
          expect($('[data-test="type1::dependency1"]').length).toBe(1)
          expect($('[data-test="type1::dependency2"]').length).toBe(1)
          expect($('[data-test="type2::dependency3"]').length).toBe(1)
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
