import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/githubUsers')
  })

  get('/data', async (req, res) => {
    const githubUsers = await serviceCatalogueService.getGithubUsers()

    res.send(githubUsers)
  })

  get('/:github_username', async (req, res) => {
    const githubUserName = req.params.github_username
    const githubUsersData = await serviceCatalogueService.getGithubUser({ githubUserName })
    const displayUser = {
      github_username: githubUsersData.github_username,
      full_name: githubUsersData.full_name,
      user_email: githubUsersData.user_email,
      github_teams: githubUsersData.github_teams,
    }
    return res.render('pages/githubUser', { githubUser: displayUser })
  })

  return router
}
