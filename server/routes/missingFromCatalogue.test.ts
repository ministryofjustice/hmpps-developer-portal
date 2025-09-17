import type { Express } from 'express'

import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'

import ProductDependenciesService from '../services/productDependenciesService'
import TeamHealthService from '../services/teamHealthService'

jest.mock('../services/productDependenciesService')
jest.mock('../services/teamHealthService')

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

describe('/missingFromCatalogue', () => {
  const productDependenciesService = new ProductDependenciesService(
    null,
    null,
  ) as jest.Mocked<ProductDependenciesService>
  const teamHealthService = new TeamHealthService(null, null) as jest.Mocked<TeamHealthService>

  let app: Express
  const renderSpy = jest.fn()

  const mockComponentsWithoutProducts = ['mock-component-1', 'mock-component-2']

  const mockHostNamesWithoutComponents = ['mock.host.name.one.justice.gov.uk', 'mock.host.name.two.justice.gov.uk']

  const mockComponentsMissingTeams = [
    {
      product: 'Mock Product 1',
      productSlug: 'mock-product-1',
      component: 'hmpps-mock-programmes-api',
    },
    {
      product: 'Mock Product 2',
      productSlug: 'mock-product-2',
      component: 'hmpps-mock-programmes-api',
    },
  ]

  const mockComponentsWeCannotCalculateTeamHealthFor = [
    {
      component: 'mock-component-1',
      reason: 'Missing version info in redis',
    },
    {
      component: 'mock-component-2',
      reason: 'Missing version info in redis',
    },
  ]

  beforeEach(() => {
    renderSpy.mockReset()

    productDependenciesService.getComponentsWithUnknownProducts = jest
      .fn()
      .mockResolvedValue(mockComponentsWithoutProducts)
    productDependenciesService.getHostNamesMissingComponents = jest
      .fn()
      .mockResolvedValue(mockHostNamesWithoutComponents)
    teamHealthService.getComponentsMissingTeams = jest.fn().mockResolvedValue(mockComponentsMissingTeams)
    teamHealthService.getComponentsWeCannotCalculateHealthFor = jest
      .fn()
      .mockResolvedValue(mockComponentsWeCannotCalculateTeamHealthFor)

    app = appWithAllRoutes({ services: { productDependenciesService, teamHealthService } })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /', () => {
    it('should render missingFromCatalogue page with `Components missing products` table', async () => {
      return request(app)
        .get('/missing-from-catalogue')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const componentsMissingProductsTable = $('#components-missing-products .govuk-table')
          expect(componentsMissingProductsTable.length).toBe(1)

          const rows = componentsMissingProductsTable.find('tbody .govuk-table__row')
          expect(rows.length).toBe(2)

          const firstCellText = rows.eq(0).find('.govuk-table__cell').text().trim()
          expect(firstCellText).toBe('mock-component-1')
        })
    })

    it('should render missingFromCatalogue page with `Hostnamess without components` table', async () => {
      return request(app)
        .get('/missing-from-catalogue')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const missingProductsTable = $('#missing-components .govuk-table')
          expect(missingProductsTable.length).toBe(1)

          const rows = missingProductsTable.find('tbody .govuk-table__row')
          expect(rows.length).toBe(2)

          const firstCellText = rows.eq(0).find('.govuk-table__cell').text().trim()
          expect(firstCellText).toBe('mock.host.name.one.justice.gov.uk')
        })
    })

    it('should render missingFromCatalogue page with `Components with products missing teams` table', async () => {
      return request(app)
        .get('/missing-from-catalogue')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const componentsMissingTeamsTable = $('#components-missing-teams .govuk-table')
          expect(componentsMissingTeamsTable.length).toBe(1)

          const rows = componentsMissingTeamsTable.find('tbody .govuk-table__row')
          expect(rows.length).toBe(2)

          const row = componentsMissingTeamsTable.find('tbody .govuk-table__row').eq(0)
          // Select the first cell's link
          const componentLink = row.find('td').eq(0).find('.govuk-table__cell a')
          expect(componentLink.text().trim()).toBe('hmpps-mock-programmes-api')
          expect(componentLink.attr('href')).toBe('/components/hmpps-mock-programmes-api')
          // Select the second cell's link
          const productLink = row.find('td').eq(1).find('.govuk-table__cell a')
          expect(productLink.text().trim()).toBe('Mock Product 1')
          expect(productLink.attr('href')).toBe('/products/mock-product-1')
        })
    })

    it('should render missingFromCatalogue page with `Components we cannot calculate team health for` table', async () => {
      return request(app)
        .get('/missing-from-catalogue')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const componentsMissingTeamsTable = $('#incalculable-health-components .govuk-table')
          expect(componentsMissingTeamsTable.length).toBe(1)

          const rows = componentsMissingTeamsTable.find('tbody .govuk-table__row')
          expect(rows.length).toBe(2)

          const row = componentsMissingTeamsTable.find('tbody .govuk-table__row').eq(0)
          // Select the first cell's link
          const componentLink = row.find('td').eq(0).find('.govuk-table__cell a')
          expect(componentLink.text().trim()).toBe('mock-component-1')
          expect(componentLink.attr('href')).toBe('/components/mock-component-1')
          // Select the second cell's text
          const reason = row.find('td').eq(1)
          expect(reason.text().trim()).toBe('Missing version info in redis')
        })
    })
  })
})
