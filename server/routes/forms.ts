import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { FieldValidationError } from '../@types/FieldValidationError'
import config from '../config'
import type { AgentConfig } from '../config'
import { components } from '../@types/strapi-api'
import { GithubRepoRequestRequest } from '../data/strapiApiTypes'
// import { BadRequest } from 'http-errors'

export default function routes({ serviceCatalogueService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/github-repo-request-form', async (req, res) => {
    console.log(`in get`)
    return res.render('pages/githubRepoRequestForm')
  })

  post('/github-repo-request-form', async (req, res): Promise<void> => {
    const formData = req.body
    const github_repo =formData.github_repo
    // const repo_description = formdata.repo_description
    // const base_template=formdata.base_template
    // const github_project_visibility = formdata.github_project_visibility
    // const jira_project_keys =formdata.jira_project_keys
    // const product = formdata.product
    // const github_projects_teams_admin = formdata.github_projects_teams_admin
    // const github_project_teams_write = formdata.github_project_teams_write
    // const github_project_branch_protection_restricted_teams = formdata.github_project_branch_protection_restricted_teams
    // const slack_channel_release_notify = formdata.slack_channel_release_notify
    // const slack_channel_pipeline_notify = formdata.slack_channel_pipeline_notify
    // const nonprod_alerts_severity_label = formdata.nonprod_alerts_severity_label
    // const prod_alerts_severity_label = formdata.prod_alerts_severity_label
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
    const requestFormData = toCreateFormData(formData) 
    console.log(requestFormData)
    const components = await serviceCatalogueService.postGithubRepoRequest(requestFormData)
    // disable submit page 
    return res.redirect('/forms/github-repo-request-form')
  })

  return router
}

export const toCreateFormData= ( formData: Record<string, unknown> ): GithubRepoRequestRequest=> {
  return {
    data: {
      github_repo: formData.github_repo?.toString(),
    }    
  }
}
