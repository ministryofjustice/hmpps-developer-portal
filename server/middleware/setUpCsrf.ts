import { Router } from 'express'
import { csrfSync } from 'csrf-sync'

const testMode = process.env.NODE_ENV === 'test'

export default function setUpCsrf(): Router {
  const router = Router({ mergeParams: true })

  // CSRF protection
  if (!testMode) {
    const {
      csrfSynchronisedProtection, // This is the default CSRF protection middleware.
    } = csrfSync({
      getTokenFromRequest: req => {
        // eslint-disable-next-line no-underscore-dangle
        return req.body._csrf || req.headers['x-csrf-token']
      },
    })

    router.use(csrfSynchronisedProtection)
  }

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
