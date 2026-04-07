import { Router } from 'express'

import type { Services } from '../services'
import { cookieService } from '../services/cookieService'
import config from '../config'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(service: Services): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    const usersCookiePrefs = cookieService.getString(req.cookies, config.cookieKeys.userPreferencesCookie)
    const hideCookies = req.cookies.hide_cookies === 'yes'
    res.render('pages/index', {
      usersCookiePrefs,
      hideCookies,
    })
  })

  // Route to add users cookie preferences
  router.post('/set-cookie-preference', (req, res) => {
    const rawInput = req.body.cookies.additional
    const header = cookieService.setStringHeader(config.cookieKeys.userPreferencesCookie, rawInput)
    const valueHeader = cookieService.removeEncodedQuotes(header)
    res.setHeader('Set-Cookie', [valueHeader, `${config.cookieKeys.hideCookies}=no; Path=/; SameSite=Lax`])
    res.redirect('/')
  })

  router.post('/hide-cookie-notice', (req, res) => {
    const rawInput = req.body.cookies.hide
    console.log(rawInput)
    const header = cookieService.setStringHeader(config.cookieKeys.hideCookies, rawInput)
    const valueHeader = cookieService.removeEncodedQuotes(header)
    console.log(valueHeader)
    res.setHeader('Set-Cookie', valueHeader)
    res.redirect('/')
  })

  return router
}
