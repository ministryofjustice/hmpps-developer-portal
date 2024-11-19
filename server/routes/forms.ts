import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { GithubRepoRequestRequest } from '../data/strapiApiTypes'

export default function routes({ serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/github-repo-request-form', async (req, res) => {
    const [productList] = await dataFilterService.getDropDownLists({
      productName: '',
      useFormattedName: true,
    })

    return res.render('pages/githubRepoRequestForm', {
      title: 'Github Repository Requst Form',
      productList,
    })
  })

  get('/products/:productName', async (req, res) => {
    const { productName } = req.params
    const [productList] = await dataFilterService.getDropDownLists({
      productName,
      useFormattedName: true,
    })

    return res.render('pages/githubRepoRequestForm', {
      title: 'Github Repository Requst Form',
      productList,
    })
  })

  post('/github-repo-request-form', async (req, res): Promise<void> => {
    const formData = req.body
    const requestFormData = toCreateFormData(formData)
    const response = await serviceCatalogueService.postGithubRepoRequest(requestFormData)

    // disable submit page, give confirmation and stay on page or redirect to new page with summary of requested data pushed to strapi
    return res.redirect('/forms/github-repo-request-form')
  })

  return router
}

export const toCreateFormData = (formData: Record<string, unknown>): GithubRepoRequestRequest => {
  return {
    data: {
      github_repo: formData.github_repo?.toString(),
      repo_description: formData.repo_description?.toString(),
      base_template: formData.base_template?.toString(),
      jira_project_keys: formData.jira_project_keys?.toString(),
      product: formData.product?.toString(),
      github_project_visibility: JSON.parse(formData.github_project_visibility.toString()),
      github_project_teams_write: formData.github_project_teams_write?.toString().split(','),
      github_projects_teams_admin: formData.github_projects_teams_admin?.toString().split(','),
      github_project_branch_protection_restricted_teams: formData.github_project_branch_protection_restricted_teams
        ?.toString()
        .split(','),
      slack_channel_nonprod_release_notify: formData.slack_channel_nonprod_release_notify?.toString(),
      slack_channel_pipeline_notify: formData.slack_channel_pipeline_notify?.toString(),
      prod_alerts_severity_label: formData.prod_alerts_severity_label?.toString(),
      nonprod_alerts_severity_label: formData.nonprod_alerts_severity_label?.toString(),
      alerts_prod_slack_channel: formData.alerts_prod_slack_channel?.toString(),
      alerts_nonprod_slack_channel: formData.alerts_nonprod_slack_channel?.toString(),
    },
  }
}
