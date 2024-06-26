import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ productDependenciesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (_, res) => {
    const componentsWithoutProducts = await productDependenciesService.getComponentsWithUnknownProducts()
    const hostNamesWithoutComponents = await productDependenciesService.getHostNamesMissingComponents()
    return res.render('pages/missingFromCatalogue', { componentsWithoutProducts, hostNamesWithoutComponents })
  })

  return router
}
