import { Router } from 'express'

import type { Services } from '../services'
import { cookieService } from '../services/cookieService'
import config from '../config'

export default function cookiesPageRoutes(service: Services): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    const usersCookiePrefs = cookieService.getString(req.cookies, config.cookieKeys.userPreferencesCookie)
    res.render('pages/cookies', {
      usersCookiePrefs,
      updated: false,
    })
  })

  // Route to update users cookie preferences
  router.post('/update-cookies', (req, res) => {
    const usersCookiePrefs = req.body.cookies.functional
    const rawHeader = cookieService.setStringHeader(config.cookieKeys.userPreferencesCookie, usersCookiePrefs)
    const userPreferenceValue = cookieService.removeEncodedQuotes(rawHeader)
    console.log(userPreferenceValue)
    res.setHeader('Set-Cookie', [userPreferenceValue, `${config.cookieKeys.hideCookies}=no; Path=/; SameSite=Lax`])
    res.render('pages/cookies', {
      usersCookiePrefs,
      updated: true,
    })
  })

  return router
}
