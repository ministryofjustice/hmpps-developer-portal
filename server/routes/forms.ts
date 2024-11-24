import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { GithubRepoRequestRequest } from '../data/strapiApiTypes'
import { validateRequest } from '../middleware/setUpValidationMiddleware'
import { FieldValidationError } from '../@types/FieldValidationError'

export default function routes({ componentNameService, serviceCatalogueService, dataFilterService }: Services): Router {
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
    validateRequest(req, body => {
      const validationErrors: FieldValidationError[] = []

      if (!body.github_repo) {
        validationErrors.push({
          field: 'github_repo',
          message: 'Enter Repository Name',
          href: '#github_repo',
        })
      } else {
        const repoName = body.github_repo?.toString()
        // const repoExists = await componentNameService.checkComponentExists(repoName)
        // console.log('repoExists', repoExists)
        // if (repoExists) {
        //   validationErrors.push({
        //     field: 'github_repo',
        //     message: 'Repository name already exists in components collection, please choose a different name',
        //     href: '#github_repo',
        //   })
        // }
        if (!repoName.startsWith('hmpps')) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Repository name should start with "hmpps"',
            href: '#github_repo',
          })
        }
        if (repoName.length >= 100) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Repository name should be less than 100 characters',
            href: '#github_repo',
          })
        }
        if (!/^[a-zA-Z0-9-]+$/.test(repoName)) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Repository name should only contain alphanumeric characters and hyphens',
            href: '#github_repo',
          })
        }
      }
      if (!body.repo_description) {
        validationErrors.push({
          field: 'repo_description',
          message: 'Enter Repository Description',
          href: '#repo_description',
        })
      }
      if (!body.base_template) {
        validationErrors.push({
          field: 'base_template',
          message: 'Select a Base Template',
          href: '#base_template',
        })
      }
      if (!body.product) {
        validationErrors.push({
          field: 'product',
          message: 'Select a Product',
          href: '#product',
        })
      }
      if (!body.slack_channel_prod_release_notify) {
        validationErrors.push({
          field: 'slack_channel_prod_release_notify',
          message: 'Enter Slack Channel for Production Release Notifications',
          href: '#slack_channel_prod_release_notify',
        })
      }
      if (!body.slack_channel_nonprod_release_notify) {
        validationErrors.push({
          field: 'slack_channel_nonprod_release_notify',
          message: 'Enter Slack Channel for Non-Production Release Notifications',
          href: '#slack_channel_nonprod_release_notify',
        })
      }
      if (!body.slack_channel_security_scans_notify) {
        validationErrors.push({
          field: 'slack_channel_security_scans_notify',
          message: 'Enter Slack Channel for Pipeline Notifications',
          href: '#slack_channel_security_scans_notify',
        })
      }
      if (!body.prod_alerts_severity_label) {
        validationErrors.push({
          field: 'prod_alerts_severity_label',
          message: 'Enter Production Alerts Severity Label',
          href: '#prod_alerts_severity_label',
        })
      }
      if (!body.nonprod_alerts_severity_label) {
        validationErrors.push({
          field: 'nonprod_alerts_severity_label',
          message: 'Enter Non-Production Alerts Severity Label',
          href: '#nonprod_alerts_severity_label',
        })
      }
      if (!body.github_project_visibility) {
        validationErrors.push({
          field: 'github_project_visibility',
          message: 'Select Github Project Visibility',
          href: '#github_project_visibility',
        })
      }
      if (!body.github_project_teams_write) {
        validationErrors.push({
          field: 'github_project_teams_write',
          message: 'Enter Github Project Teams with Write Access',
          href: '#github_project_teams_write',
        })
      }
      if (!body.github_projects_teams_admin) {
        validationErrors.push({
          field: 'github_projects_teams_admin',
          message: 'Enter Github Project Teams with Admin Access',
          href: '#github_projects_teams_admin',
        })
      }
      if (!body.github_project_branch_protection_restricted_teams) {
        validationErrors.push({
          field: 'github_project_branch_protection_restricted_teams',
          message: 'Enter Github Project Branch Protection Restricted Teams',
          href: '#github_project_branch_protection_restricted_teams',
        })
      }
      if (!body.requester_name) {
        validationErrors.push({
          field: 'requester_name',
          message: 'Enter Requester Name',
          href: '#requester_name',
        })
      }
      if (!body.requester_email) {
        validationErrors.push({
          field: 'requester_email',
          message: 'Enter Requesters Email Address',
          href: '#requester_email',
        })
      } else {
        const requesterEmail = body.requester_email?.toString()
        if (!requesterEmail.endsWith('@digital.justice.gov.uk')) {
          validationErrors.push({
            field: 'requesterEmail',
            message: 'Valid email address is only with @digital.justice.gov.uk',
            href: '#requester_email',
          })
        }
      }
      if (!body.requester_team) {
        validationErrors.push({
          field: 'requester_team',
          message: 'Select Requesting Team',
          href: '#requester_team',
        })
      }
      return validationErrors
    })
    const requestFormData = buildFormData(formData)
    await serviceCatalogueService.postGithubRepoRequest(requestFormData)
    // return res.redirect('/forms/github-repo-request-form')
    return res.render('pages/githubRepoRequestConfirmation', {
      title: 'Github Repository Request Confirmation',
      repoName: formData.github_repo,
    })
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
