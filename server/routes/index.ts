import { Router } from 'express'

import type { Services } from '../services'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(service: Services): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    res.render('pages/index')
  })

  return router
}
