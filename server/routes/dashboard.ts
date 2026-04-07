import { Router } from 'express'
import cookieParser from 'cookie-parser'
import type { Services } from '../services'
import { cookieService } from '../services/cookieService'
import { sanitizeCookieInput } from '../services/sanitizeCookieInput'
import { cookieKeys } from '../config'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.use(cookieParser())

  // dashboard GET route for both users name and saved products
  router.get('/', async (req, res) => {
    const name = cookieService.getString(req.cookies, cookieKeys.userNameCookie)
    const productsList = cookieService.getFavouritesFromCookie(req.cookies, cookieKeys.productNameCookie)
    const error = req.query.error as string | undefined
    const attemptedProduct = req.query.value as string | undefined
    const products = await serviceCatalogueService.getProducts({})
    return res.render('pages/dashboard.njk', {
      name,
      productsList,
      error,
      attemptedProduct,
      products,
    })
  })

  // Route to add users name
  router.post('/name', (req, res) => {
    const rawInput = req.body?.name
    const safeName = sanitizeCookieInput(rawInput, {
      maxLength: 30,
      collapseWhitespace: false,
      defaultInput: 'User',
    })
    const header = cookieService.setStringHeader(cookieKeys.userNameCookie, safeName)
    const nameHeader = cookieService.removeEncodedQuotes(header)
    res.setHeader('Set-Cookie', nameHeader)
    res.redirect('/dashboard')
  })

  // Route to add saved products
  router.post('/saved-products/add', async (req, res) => {
    const rawInput = req.body.product
    const productInput = sanitizeCookieInput(rawInput, {
      collapseWhitespace: false,
      defaultInput: '',
    })
    if (!productInput) {
      return res.redirect('/dashboard')
    }
    // Fetch full product list from API
    const products = await serviceCatalogueService.getProducts({})
    // Match
    const exists = products.some(product => product.name.toLowerCase() === productInput.toLowerCase())
    if (!exists) {
      return res.redirect(`/dashboard?error=notfound&value=${encodeURIComponent(productInput)}`)
    }

    // Load users current saved product list
    const currentProductsList: string[] = cookieService.getFavouritesFromCookie(
      req.cookies,
      cookieKeys.productNameCookie,
    )
    // Add new product if not already in array
    if (!currentProductsList.includes(productInput)) {
      currentProductsList.push(productInput)
    }
    // Save to cookie
    const header = cookieService.setStringHeader(cookieKeys.productNameCookie, currentProductsList)
    res.setHeader('Set-Cookie', header)
    return res.redirect('/dashboard')
  })

  // Route to delete a saved product
  router.post('/saved-products/delete', (req, res) => {
    const rawIndex = req.body.index
    const index = Number.parseInt(String(rawIndex), 10)
    const currentProductsList = cookieService.getFavouritesFromCookie(req.cookies, cookieKeys.productNameCookie)
    if (!Number.isInteger(index) || index < 0 || index >= currentProductsList.length) {
      return res.redirect(`/dashboard?error=notfound&value=${index}`)
    }
    // Remove a product from current product list
    currentProductsList.splice(index, 1)
    // Save updated list to cookie
    const header = cookieService.setStringHeader(cookieKeys.productNameCookie, currentProductsList)
    res.setHeader('Set-Cookie', header)
    return res.redirect('/dashboard')
  })

  return router
}
