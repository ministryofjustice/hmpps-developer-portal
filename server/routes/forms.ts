import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ componentNameService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const [productList] = await dataFilterService.getDropDownLists({
      productName: '',
      useFormattedName: true,
    })

    return res.render('pages/githubreporequestform', {
      title: 'Github repository Name',
      productList,
    })
  })

  get('/products/:productName', async (req, res) => {
    const { productName } = req.params
    const [productList] = await dataFilterService.getDropDownLists({
      productName,
      useFormattedName: true,
    })

    return res.render('pages/githubreporequestform', {
      title: `Github repository Name for ${productName}`,
      productList,
    })
  })

  return router
}
