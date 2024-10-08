import path from 'path'
import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration }

  Array.of(
    '/assets',
    '/assets/stylesheets',
    '/assets/js',
    '/node_modules/govuk-frontend/dist/govuk/assets',
    '/node_modules/govuk-frontend/dist',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
    '/node_modules/jquery/dist',
    '/node_modules/datatables.net',
    '/node_modules/datatables.net-buttons',
    '/node_modules/datatables.net-dt',
    // '/node_modules/datatables.net-searchpanes',
    '/node_modules/datatables.net-select',
    '/node_modules/datatables.net-buttons',
    '/node_modules/datatables.net-buttons-dt',
    '/node_modules/mermaid/dist',
    '/node_modules/svg-pan-zoom/dist',
  ).forEach(dir => {
    router.use('/assets', express.static(path.join(process.cwd(), dir), cacheControl))
  })

  Array.of('/node_modules/govuk_frontend_toolkit/images').forEach(dir => {
    router.use('/assets/images/icons', express.static(path.join(process.cwd(), dir), cacheControl))
  })

  Array.of('/node_modules/jquery/dist/jquery.min.js').forEach(dir => {
    router.use('/assets/js/jquery.min.js', express.static(path.join(process.cwd(), dir), cacheControl))
  })

  Array.of('/node_modules/dayjs/dayjs.min.js').forEach(dir => {
    router.use('/assets/js/dayjs/dayjs.min.js', express.static(path.join(process.cwd(), dir), cacheControl))
  })

  Array.of('/node_modules/dayjs/plugin/relativeTime.js').forEach(dir => {
    router.use('/assets/js/dayjs/plugin/relativeTime.js', express.static(path.join(process.cwd(), dir), cacheControl))
  })

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
