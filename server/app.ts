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
import setUpValidationMiddleware from './middleware/setUpValidationMiddleware'
import { appInsightsMiddleware } from './utils/azureAppInsights'

import indexRoutes from './routes'
import productRoutes from './routes/products'
import componentRoutes from './routes/components'
import environmentRoutes from './routes/environments'
import reportRoutes from './routes/reports'
import teamRoutes from './routes/teams'
import productSetRoutes from './routes/productSets'
import productDependencyRoutes from './routes/productDependencies'
import serviceAreaRoutes from './routes/serviceAreas'
import monitorRoutes from './routes/monitor'
import dependencyRoutes from './routes/dependencies'
import driftRadiatorRoutes from './routes/driftRadiator'
import trivyScansRoutes from './routes/trivyScans'
import veracodeRoutes from './routes/veracode'
import teamHealthRoutes from './routes/teamHealth'
import missingFromCatalogueRoutes from './routes/missingFromCatalogue'
import namespacesRoutes from './routes/namespaces'
import componentRequestRoutes from './routes/componentRequests'
import githubTeamsRoutes from './routes/githubTeams'
import scheduledJobsRoutes from './routes/scheduledJobs'
import alertsRoutes from './routes/alerts'

import type { Services } from './services'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(appInsightsMiddleware())
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
  app.use('/environments', environmentRoutes(services))
  app.use('/reports', reportRoutes(services))
  app.use('/teams', teamRoutes(services))
  app.use('/product-sets', productSetRoutes(services))
  app.use('/service-areas', serviceAreaRoutes(services))
  app.use('/monitor', monitorRoutes(services))
  app.use('/dependencies', dependencyRoutes(services))
  app.use('/drift-radiator', driftRadiatorRoutes(services))
  app.use('/veracode', veracodeRoutes(services))
  app.use('/team-health', teamHealthRoutes(services))
  app.use('/product-dependencies', productDependencyRoutes(services))
  app.use('/missing-from-catalogue', missingFromCatalogueRoutes(services))
  app.use('/namespaces', namespacesRoutes(services))
  app.use(setUpValidationMiddleware())
  app.use('/component-requests', componentRequestRoutes(services))
  app.use('/github-teams', githubTeamsRoutes(services))
  app.use('/scheduled-jobs', scheduledJobsRoutes(services))
  app.use('/alerts', alertsRoutes(services))
  app.use('/trivy-scans', trivyScansRoutes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
