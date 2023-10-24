import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getNumericId } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/teams')
  })

  get('/data', async (req, res) => {
    const teams = await serviceCatalogueService.getTeams()

    return res.send(teams)
  })

  get('/:teamId', async (req, res) => {
    const teamId = getNumericId(req, 'teamId')
    const team = await serviceCatalogueService.getTeam({ teamId })
    const products = team.products?.data?.map(product => product)

    const displayTeam = {
      id: team.t_id,
      name: team.name,
      products,
    }

    return res.render('pages/team', { team: displayTeam })
  })

  return router
}
