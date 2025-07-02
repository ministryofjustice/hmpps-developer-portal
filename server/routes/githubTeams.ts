import { Router } from 'express'
import type { Services } from '../services'
import { utcTimestampToUtcDateTime } from '../utils/utils'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-github-teams-discovery' })
    return res.render('pages/githubTeams', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const githubTeams = await serviceCatalogueService.getGithubTeams()
    res.send(githubTeams)
  })

  router.get('/:github_team_name', async (req, res) => {
    const teamName = req.params.github_team_name
    const teamRequest = await serviceCatalogueService.getGithubTeam({ teamName })
    const githubSubTeams = await serviceCatalogueService.getGithubSubTeams({ parentTeamName: teamName })
    const subTeams = Array.from(
      new Set(githubSubTeams.filter(team => team.parent_team_name === teamName).map(team => team.team_name)),
    )
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
