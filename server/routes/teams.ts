import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { getFormattedName } from '../utils/utils'

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

  get('/:teamSlug', async (req, res) => {
    const teamSlug = getFormattedName(req, 'teamSlug')
    const team = await serviceCatalogueService.getTeam({ teamSlug })
    const products = team.products?.data?.map(product => product)

    const displayTeam = {
      id: team.t_id,
      name: team.name,
      slackChannelId: team.slack_channel_id,
      slackChannelName: team.slack_channel_name,
      products,
    }

    return res.render('pages/team', { team: displayTeam })
  })

  return router
}
