import { Router } from 'express'
import type { Services } from '../services'
import { cookieService, fetchProductList } from '../services/cookieService'
import { sanitizeCookieInput } from '../services/sanitizeCookieInput'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const userNameCookie = 'user_name'
  const productCookie = 'product_name'

  router.get('/data', async (req, res) => {
    const products = await serviceCatalogueService.getProducts({})
    res.send(products)
  })

  // redirect route to stop CSRF middleware blocking redirect GET routes
  router.get('/user-dashboard', (req, res) => {
    return res.redirect('/dashboard')
  })

  // dashboard GET route for both users name and saved products
  router.get('/', async (req, res) => {
    const name = cookieService.getString(req.cookies, userNameCookie)
    const productsList = cookieService.getFavouritesFromCookie(req, productCookie)
    const error = req.query.error as string | undefined
    const attemptedProduct = req.query.value as string | undefined
    const allProducts = await fetchProductList()
    return res.render('pages/dashboard.njk', {
      name,
      productsList,
      error,
      attemptedProduct,
      allProducts,
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
    const header = cookieService.setStringHeader(userNameCookie, safeName)
    res.setHeader('Set-Cookie', header)
    res.redirect('/dashboard/user-dashboard')
  })

  // Route to add saved products
  router.post('/saved-products/add', async (req, res) => {
    const rawInput = req.body.product
    const product = sanitizeCookieInput(rawInput, {
      collapseWhitespace: false,
      defaultInput: '',
    })
    if (!product) {
      return res.redirect('/dashboard')
    }
    // Fetch full product list from API
    const allProducts = await fetchProductList()
    // Match
    const exists = allProducts.some(name => name.toLowerCase() === product.toLocaleLowerCase())
    if (!exists) {
      return res.redirect(`/dashboard?error=notfound&value=${encodeURIComponent(product)}`)
    }

    // Load users current saved product list
    const currentProductsList = await cookieService.getFavouritesFromCookie(req, productCookie)
    // Add new product
    currentProductsList.push(product)
    // Save to cookie
    const header = cookieService.setProductCookie(productCookie, currentProductsList)
    res.setHeader('Set-Cookie', header)
    return res.redirect('/dashboard/user-dashboard')
  })

  // Route to delete a saved product
  router.post('/saved-products/delete', async (req, res) => {
    const index = Number(req.query.index)
    const currentProductsList = await cookieService.getFavouritesFromCookie(req, productCookie)
    // Remove a product from current product list
    currentProductsList.splice(index, 1)
    // Save updated list to cookie
    const header = cookieService.setProductCookie(productCookie, currentProductsList)
    res.setHeader('Set-Cookie', header)
    res.redirect('/dashboard/user-dashboard')
  })

  return router
}
