import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const name = 'hmpps-github-teams-discovery'
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name })
    return res.render('pages/githubTeams', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: scheduledJobRequest.last_successful_run,
    })
  })

  get('/data', async (req, res) => {
    const githubTeams = await serviceCatalogueService.getGithubTeams()

    res.send(githubTeams)
  })

  get('/:github_team_name', async (req, res) => {
    const teamName = req.params.github_team_name
    const teamRequest = await serviceCatalogueService.getGithubTeam({ teamName })
    const allGithubTeams = await serviceCatalogueService.getGithubTeams()
    const subTeams = allGithubTeams
      .filter(team => team.attributes.parent_team_name === teamName)
      .map(team => team.attributes.team_name)

    const displayTeam = {
      github_team_name: teamRequest.team_name,
      team_description: teamRequest.team_desc,
      parent_team_name: teamRequest.parent_team_name,
      members: teamRequest.members,
    }
    return res.render('pages/githubTeam', { githubTeam: displayTeam, subTeams })
  })

  return router
}
