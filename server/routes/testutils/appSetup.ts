import express, { Express } from 'express'
import cookieSession from 'cookie-session'
import createError from 'http-errors'

import indexRoutes from '../index'
import productRoutes from '../products'
import componentRoutes from '../components'
import teamRoutes from '../teams'
import productSetRoutes from '../productSets'
import serviceAreaRoutes from '../serviceAreas'
import monitorRoutes from '../monitor'
import dependencyRoutes from '../dependencies'
import productDependenciesRoutes from '../productDependencies'

import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import type { ApplicationInfo } from '../../applicationInfo'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  productId: 'product id',
  branchName: 'main',
}

export const flashProvider = jest.fn()

function appSetup(services: Services, production: boolean): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app, testAppInfo)
  app.use(cookieSession({ keys: [''] }))
  app.use((req, res, next) => {
    req.flash = flashProvider
    res.locals = {}
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use('/', indexRoutes(services))
  app.use('/products', productRoutes(services))
  app.use('/components', componentRoutes(services))
  app.use('/teams', teamRoutes(services))
  app.use('/product-sets', productSetRoutes(services))
  app.use('/service-areas', serviceAreaRoutes(services))
  app.use('/monitor', monitorRoutes(services))
  app.use('/dependencies', dependencyRoutes(services))
  app.use('/product-dependencies', productDependenciesRoutes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {},
}: {
  production?: boolean
  services?: Partial<Services>
}): Express {
  return appSetup(services as Services, production)
}
