import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { FieldValidationError } from '../@types/FieldValidationError'
import config from '../config'
import type { AgentConfig } from '../config'

export default function routes({ dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/github-repo-request-form', async (req, res) => {
    console.log(`in get`)
    return res.render('pages/githubRepoRequestForm')
  })

  post('/github-repo-request-form', async (req, res): Promise<void> => {
    // const (github_repo,repo_description,base_template,github_project_visibility,jira_project_keys,product,github_projects_teams_admin,github_project_teams_writ,github_project_branch_protection_restricted_teams,slack_channel_release_notify,slack_channel_pipeline_notify,nonprod_alerts_severity_label,prod_alerts_severity_label) = req.body;
    const { github_repo } = req.body.github_repo
    // const { repo_description } = req.body.repo_description
    // const { base_template } = req.body.base_template
    // const { github_project_visibility } = req.body.github_project_visibility
    // const { jira_project_keys } = req.body.jira_project_keys
    // const { product } = req.body.product
    // const { github_projects_teams_admin } = req.body.github_projects_teams_admin
    // const { github_project_teams_write } = req.body
    // const { github_project_branch_protection_restricted_teams } = req.body.github_project_branch_protection_restricted_teams
    // const { slack_channel_release_notify } = req.body.slack_channel_release_notify
    // const { slack_channel_pipeline_notify } = req.body.slack_channel_pipeline_notify
    // const { nonprod_alerts_severity_label } = req.body.nonprod_alerts_severity_label
    // const prod_alerts_severity_label = req.body.nonprod_alerts_severity_label
    console.log(`in post `)
    console.log(github_repo)
    return res.render('pages/githubRepoRequestForm', {
      title: 'Github repository Name',
    })
  })


  return router
}
