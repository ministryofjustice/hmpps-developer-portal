import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { GithubRepoRequestRequest, GithubProjectVisibility } from '../data/strapiApiTypes'
import { validateRequest } from '../middleware/setUpValidationMiddleware'
import { FieldValidationError } from '../@types/FieldValidationError'

export default function routes({ componentNameService, serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/component-request-form', async (req, res) => {
    const [teamList, productList] = await dataFilterService.getFormsDropdownLists({
      teamName: '',
      productId: '',
      useFormattedName: true,
    })
    return res.render('pages/componentRequestForm', {
      title: 'Github Repository Requst Form',
      teamList,
      productList,
    })
  })

  get('/component-requests', async (req, res) => {
    return res.render('pages/componentRequests')
  })

  get('/component-requests/data', async (req, res) => {
    const componentRequests = await serviceCatalogueService.getGithubRepoRequests()

    res.send(componentRequests)
  })

  get('/component-requests/:repo_name', async (req, res) => {
    const repoName = req.params.repo_name
    const componentRequest = await serviceCatalogueService.getGithubRepoRequest({ repoName })
    const displayComponent = {
      github_repo: componentRequest.github_repo,
      repo_description: componentRequest.repo_description,
      base_template: componentRequest.base_template,
      jira_project_keys: componentRequest.jira_project_keys,
      github_project_visibility: componentRequest.github_project_visibility,
      product: componentRequest.product,
      slack_channel_prod_release_notify: componentRequest.slack_channel_prod_release_notify,
      slack_channel_nonprod_release_notify: componentRequest.slack_channel_nonprod_release_notify,
      slack_channel_security_scans_notify: componentRequest.slack_channel_security_scans_notify,
      prod_alerts_severity_label: componentRequest.prod_alerts_severity_label,
      nonprod_alerts_severity_label: componentRequest.nonprod_alerts_severity_label,
      github_project_teams_write: componentRequest.github_project_teams_write,
      github_projects_teams_admin: componentRequest.github_projects_teams_admin,
      github_project_branch_protection_restricted_teams:
        componentRequest.github_project_branch_protection_restricted_teams,
      requester_name: componentRequest.requester_name,
      requester_email: componentRequest.requester_email,
      requester_team: componentRequest.requester_team,
      request_github_pr_status: componentRequest.request_github_pr_status,
      request_github_pr_number: componentRequest.request_github_pr_number,
    }
    return res.render('pages/componentRequest', { componentRequest: displayComponent })
  })

  post('/component-request-form', async (req, res): Promise<void> => {
    const formData = req.body
    const repoExists = formData.github_repo
      ? await componentNameService.checkComponentExists(formData.github_repo)
      : false
    const repoRequestExists = formData.github_repo
      ? await componentNameService.checkComponentRequestExists(formData.github_repo)
      : false
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
        if (repoExists) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Repository name already exists in components collection, please choose a different name',
            href: '#github_repo',
          })
        }
        if (repoRequestExists) {
          validationErrors.push({
            field: 'github_repo',
            message: 'Request for this component already exists in queue, please choose a different name',
            href: '#github_repo',
          })
        }
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
      if (!body.github_projects_teams_admin) {
        validationErrors.push({
          field: 'github_projects_teams_admin',
          message: 'Enter Github Project Teams with Admin Access',
          href: '#github_projects_teams_admin',
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
    try {
      await serviceCatalogueService.postGithubRepoRequest(requestFormData)
      return res.render('pages/componentRequestConfirmation', {
        title: 'Github Repository Request Confirmation',
        repoName: formData.github_repo,
      })
    } catch {
      const validationErrors: FieldValidationError[] = []
      validationErrors.push({
        field: 'form',
        message: 'There was an error submitting your request. Please try again later.',
        href: '',
      })
      return res.render('pages/componentRequestForm', {
        validationErrors,
        formData,
      })
    }
  })

  return router
}

const buildFormData = (formData: Record<string, unknown>): GithubRepoRequestRequest => {
  const githubProjectTeamsWrite = formData.github_project_teams_write
    ? formData.github_project_teams_write.toString().split(',')
    : ''
  const githubProjectBranchProtectionRestrictedTeams = formData.github_project_branch_protection_restricted_teams
    ? formData.github_project_branch_protection_restricted_teams.toString().split(',')
    : ''
  const jiraProjectKeys = formData.jira_project_keys ? formData.jira_project_keys.toString().split(',') : ''
  return {
    data: {
      github_repo: formData.github_repo?.toString(),
      repo_description: formData.repo_description?.toString(),
      base_template: formData.base_template?.toString(),
      jira_project_keys: jiraProjectKeys,
      github_project_visibility: formData.github_project_visibility as GithubProjectVisibility,
      product: formData.product?.toString(),
      slack_channel_prod_release_notify: formData.slack_channel_prod_release_notify?.toString(),
      slack_channel_nonprod_release_notify: formData.slack_channel_nonprod_release_notify?.toString(),
      slack_channel_security_scans_notify: formData.slack_channel_security_scans_notify?.toString(),
      prod_alerts_severity_label: formData.prod_alerts_severity_label?.toString(),
      nonprod_alerts_severity_label: formData.nonprod_alerts_severity_label?.toString(),
      github_project_teams_write: githubProjectTeamsWrite,
      github_projects_teams_admin: formData.github_projects_teams_admin?.toString().split(','),
      github_project_branch_protection_restricted_teams: githubProjectBranchProtectionRestrictedTeams,
      requester_name: formData.requester_name?.toString(),
      requester_email: formData.requester_email?.toString(),
      requester_team: formData.requester_team?.toString(),
      request_github_pr_status: 'Pending',
    },
  }
}
