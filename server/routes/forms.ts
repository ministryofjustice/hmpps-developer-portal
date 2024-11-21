import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { GithubRepoRequestRequest } from '../data/strapiApiTypes'
import * as Validation from './formValidation'

export default function routes({ serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/github-repo-request-form', async (req, res) => {
    const [productList] = await dataFilterService.getOnlyProductLists({
      productName: '',
      useFormattedName: true,
    })
    return res.render('pages/githubRepoRequestForm', {
      title: 'Github Repository Requst Form',
      productList,
    })
  })

  post('/github-repo-request-form', async (req, res): Promise<void> => {
    const formData = req.body
    const formValidators: { [key: string]: Validation.Validator[] } = {
      github_repo: [
        {
          validatorType: Validation.ValidationType.NAMEVALIDATE,
          message: 'Repository Name should be Alphanumeric and only allowed special character is - (hyphen)',
        },
      ],
      github_description: [
        { validatorType: Validation.ValidationType.REQUIRED, message: 'Enter Github Repository Description' },
      ],
      // alerts_prod_slack_channel: [
      //   { validatorType: Validation.ValidationType.REQUIRED, message: 'Production Slack channel is required' }
      // ],
      // alerts_nonprod_slack_channel: [
      //     { validatorType: Validation.ValidationType.REQUIRED, message: 'Non-production Slack channel is required' }
      // ]
    }
    const validationResults = Validation.validateFormFields(formData, formValidators)
    console.log('formData', formData)
    console.log('validationResults', validationResults)
    const hasErrors = Object.values(validationResults).some(result => !result.valid)
    console.log('hasErrors', hasErrors)
    if (hasErrors) {
      return res.render('pages/githubRepoRequestForm', {
        formData,
        validationResults,
      })
    }

    const requestFormData = buildFormData(formData)
    await serviceCatalogueService.postGithubRepoRequest(requestFormData)

    // disable submit page, give confirmation and stay on page or redirect to new page with summary of requested data pushed to strapi
    return res.redirect('/forms/github-repo-request-form')
  })

  return router
}

const buildFormData = (formData: Record<string, unknown>): GithubRepoRequestRequest => {
  return {
    data: {
      github_repo: formData.github_repo?.toString(),
      // repo_description: formData.repo_description?.toString(),
      // base_template: formData.base_template?.toString(),
      // jira_project_keys: formData.jira_project_keys?.toString().split(','),
      // github_project_visibility: JSON.parse(formData.github_project_visibility.toString()),
      // product: formData.product?.toString(),
      // slack_channel_prod_release_notify: formData.slack_channel_prod_release_notify?.toString(),
      // slack_channel_pipeline_notify: formData.slack_channel_pipeline_notify?.toString(),
      // prod_alerts_severity_label: formData.prod_alerts_severity_label?.toString(),
      // nonprod_alerts_severity_label: formData.nonprod_alerts_severity_label?.toString(),
      // github_project_teams_write: formData.github_project_teams_write?.toString().split(','),
      // github_projects_teams_admin: formData.github_projects_teams_admin?.toString().split(','),
      // github_project_branch_protection_restricted_teams: formData.github_project_branch_protection_restricted_teams
      //   ?.toString()
      //   .split(','),
      // // alerts_prod_slack_channel: formData.alerts_prod_slack_channel?.toString(),
      // // alerts_nonprod_slack_channel: formData.alerts_nonprod_slack_channel?.toString(),
      // slack_channel_nonprod_release_notify: formData.slack_channel_nonprod_release_notify?.toString(),
    },
  }
}
