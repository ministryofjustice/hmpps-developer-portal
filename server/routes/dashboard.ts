import { Router } from 'express'
import type { Services } from '../services'
import { cookieService } from '../services/cookieService'
import { sanitizeNameInput } from '../services/sanitizeUsername'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const userNameCookie = 'user_name'

  router.get('/', async (req, res) => {
    return res.redirect('/dashboard/name')
  })

  router.get('/data', async (req, res) => {
    const products = await serviceCatalogueService.getProducts({})
    res.send(products)
  })

  router.post('/name', (req, res) => {
    const rawInput = req.body?.name
    const safeName = sanitizeNameInput(rawInput, {
      maxLength: 100,
      collapseWhitespace: true,
      defaultName: 'User',
    })

    const header = cookieService.setStringHeader(userNameCookie, safeName)
    res.setHeader('Set-Cookie', header)
    res.redirect('/dashboard/name')
  })

  router.get('/name', (req, res) => {
    const name = cookieService.getString(req.cookies, userNameCookie)
    res.render('pages/dashboard.njk', { name })
  })

  return router
}
