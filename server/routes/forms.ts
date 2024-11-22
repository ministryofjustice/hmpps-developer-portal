import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { GithubRepoRequestRequest } from '../data/strapiApiTypes'
import { validateRequest } from '../middleware/setUpValidationMiddleware'
import { FieldValidationError } from '../@types/FieldValidationError'

export default function routes({ serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/github-repo-request-form', async (req, res) => {
    const [teamList, productList] = await dataFilterService.getFormsDropdownLists({
      teamName: '',
      productName: '',
      useFormattedName: true,
    })
    return res.render('pages/githubRepoRequestForm', {
      title: 'Github Repository Requst Form',
      teamList,
      productList,
    })
  })

  post('/github-repo-request-form', async (req, res): Promise<void> => {
    const formData = req.body
    const requestFormData = buildFormData(formData)
    validateRequest(req, body => {
      const validationErrors: FieldValidationError[] = []
      if (!body.github_repo) {
        validationErrors.push({ field: 'optOutReason', message: 'Enter Repository Name' })
      } else {
        const repoName = body.github_repo?.toString()
        if (!repoName.startsWith('hmpps')) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Repository name should start with "hmpps"',
          })
        }
        if (repoName.length >= 100) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Repository name should be less than 100 characters',
          })
        }
        if (!/^[a-zA-Z0-9-]+$/.test(repoName)) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Repository name should only contain alphanumeric characters and hyphens',
          })
        }
      }
      if (!body.repo_description) {
        validationErrors.push({
          field: 'repo_description',
          message: 'Enter Repository Description',
        })
      }
      if (!body.base_template) {
        validationErrors.push({
          field: 'base_template',
          message: 'Select a Base Template',
        })
      }
      if (!body.product) {
        validationErrors.push({
          field: 'product',
          message: 'Select a Product',
        })
      }
      if (!body.slack_channel_prod_release_notify) {
        validationErrors.push({
          field: 'slack_channel_prod_release_notify',
          message: 'Enter Slack Channel for Production Release Notifications',
        })
      }
      if (!body.slack_channel_nonprod_release_notify) {
        validationErrors.push({
          field: 'slack_channel_nonprod_release_notify',
          message: 'Enter Slack Channel for Non-Production Release Notifications',
        })
      }
      if (!body.slack_channel_security_scans_notify) {
        validationErrors.push({
          field: 'slack_channel_security_scans_notify',
          message: 'Enter Slack Channel for Pipeline Notifications',
        })
      }
      if (!body.prod_alerts_severity_label) {
        validationErrors.push({
          field: 'prod_alerts_severity_label',
          message: 'Enter Production Alerts Severity Label',
        })
      }
      if (!body.nonprod_alerts_severity_label) {
        validationErrors.push({
          field: 'nonprod_alerts_severity_label',
          message: 'Enter Non-Production Alerts Severity Label',
        })
      }
      if (!body.github_project_visibility) {
        validationErrors.push({
          field: 'github_project_visibility',
          message: 'Select Github Project Visibility',
        })
      }
      if (!body.github_project_teams_write) {
        validationErrors.push({
          field: 'github_project_teams_write',
          message: 'Enter Github Project Teams with Write Access',
        })
      }
      if (!body.github_projects_teams_admin) {
        validationErrors.push({
          field: 'github_projects_teams_admin',
          message: 'Enter Github Project Teams with Admin Access',
        })
      }
      if (!body.github_project_branch_protection_restricted_teams) {
        validationErrors.push({
          field: 'github_project_branch_protection_restricted_teams',
          message: 'Enter Github Project Branch Protection Restricted Teams',
        })
      }
      if (!body.requester_name) {
        validationErrors.push({
          field: 'requester_name',
          message: 'Enter Requester Name',
        })
      }
      if (!body.requester_email) {
        validationErrors.push({
          field: 'requester_email',
          message: 'Enter Requesters Email Address',
        })
      } else {
        const requesterEmail = body.requester_email?.toString()
        if (!requesterEmail.endsWith('@digital.justice.gov.uk')) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Valid email address is only with @digital.justice.gov.uk',
          })
        }
      }
      if (!body.requester_team) {
        validationErrors.push({
          field: 'requester_team',
          message: 'Select Requesting Team',
        })
      }
      return validationErrors
    })
    await serviceCatalogueService.postGithubRepoRequest(requestFormData)

    return res.redirect('/forms/github-repo-request-form')
  })

  return router
}

const buildFormData = (formData: Record<string, unknown>): GithubRepoRequestRequest => {
  return {
    data: {
      github_repo: formData.github_repo?.toString(),
      repo_description: formData.repo_description?.toString(),
      base_template: formData.base_template?.toString(),
      jira_project_keys: formData.jira_project_keys?.toString().split(','),
      github_project_visibility: JSON.parse(formData.github_project_visibility.toString()),
      product: formData.product?.toString(),
      slack_channel_prod_release_notify: formData.slack_channel_prod_release_notify?.toString(),
      slack_channel_nonprod_release_notify: formData.slack_channel_nonprod_release_notify?.toString(),
      slack_channel_security_scans_notify: formData.slack_channel_security_scans_notify?.toString(),
      prod_alerts_severity_label: formData.prod_alerts_severity_label?.toString(),
      nonprod_alerts_severity_label: formData.nonprod_alerts_severity_label?.toString(),
      github_project_teams_write: formData.github_project_teams_write?.toString().split(','),
      github_projects_teams_admin: formData.github_projects_teams_admin?.toString().split(','),
      github_project_branch_protection_restricted_teams: formData.github_project_branch_protection_restricted_teams
        ?.toString()
        .split(','),
      requester_name: formData.requester_name?.toString(),
      requester_email: formData.requester_email?.toString(),
      requester_team: formData.requester_team?.toString(),
      request_processed_status: false,
    },
  }
}
