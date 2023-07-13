import { type RequestHandler, type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

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
    const teamId = getTeamId(req)
    const team = await serviceCatalogueService.getTeam(teamId)
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

function getTeamId(req: Request): string {
  const { teamId } = req.params

  if (!Number.isInteger(Number.parseInt(teamId, 10))) {
    throw new BadRequest()
  }

  return teamId
}
