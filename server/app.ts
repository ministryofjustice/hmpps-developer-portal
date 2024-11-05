import express from 'express'

import createError from 'http-errors'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'

import setUpCsrf from './middleware/setUpCsrf'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import indexRoutes from './routes'
import productRoutes from './routes/products'
import componentRoutes from './routes/components'
import reportRoutes from './routes/reports'
import teamRoutes from './routes/teams'
import productSetRoutes from './routes/productSets'
import productDependencyRoutes from './routes/productDependencies'
import serviceAreaRoutes from './routes/serviceAreas'
import monitorRoutes from './routes/monitor'
import dependencyRoutes from './routes/dependencies'
import driftRadiatorRoutes from './routes/driftRadiator'
import trivyRoutes from './routes/trivy'
import veracodeRoutes from './routes/veracode'
import teamHealthRoutes from './routes/teamHealth'
import missingFromCatalogueRoutes from './routes/missingFromCatalogue'
import namespacesRoutes from './routes/namespaces'
import formsRoutes from './routes/forms'

import type { Services } from './services'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services.applicationInfo)
  app.use(setUpCsrf())

  app.use('/', indexRoutes(services))
  app.use('/products', productRoutes(services))
  app.use('/components', componentRoutes(services))
  app.use('/reports', reportRoutes(services))
  app.use('/teams', teamRoutes(services))
  app.use('/product-sets', productSetRoutes(services))
  app.use('/service-areas', serviceAreaRoutes(services))
  app.use('/monitor', monitorRoutes(services))
  app.use('/dependencies', dependencyRoutes(services))
  app.use('/drift-radiator', driftRadiatorRoutes(services))
  app.use('/trivy', trivyRoutes(services))
  app.use('/veracode', veracodeRoutes(services))
  app.use('/team-health', teamHealthRoutes(services))
  app.use('/product-dependencies', productDependencyRoutes(services))
  app.use('/missing-from-catalogue', missingFromCatalogueRoutes(services))
  app.use('/namespaces', namespacesRoutes(services))
  app.use('/new-github-repo-request-form', formsRoutes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
