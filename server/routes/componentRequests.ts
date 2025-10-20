import { Router } from 'express'
import type { Services } from '../services'
import { GithubProjectVisibility, GithubRepoRequestRequest } from '../data/modelTypes'
import { validateRequest } from '../middleware/setUpValidationMiddleware'
import { FieldValidationError } from '../@types/FieldValidationError'

export default function routes({ componentNameService, serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  router.get('/choice', async (req, res) => {
    return res.render('pages/componentRequestFormOption', {
      title: 'Github Repository Request Form Options',
    })
  })

  router.post('/choice', async (req, res): Promise<void> => {
    const formData = req.body
    const repoExists = formData.github_repo
      ? await componentNameService.checkComponentExists(formData.github_repo)
      : false
    const repoRequestExists = formData.github_repo
      ? await componentNameService.checkComponentRequestExists(formData.github_repo)
      : false
    const archiveRequestExists = formData.github_repo
      ? await componentNameService.checkComponentArchiveRequestExists(formData.github_repo)
      : false

    validateRequest(req, body => {
      const validationErrors: FieldValidationError[] = []
      const repoName = body.github_repo?.toString()
      if (!body.option) {
        validationErrors.push({
          field: 'option',
          message: 'Please select an option',
          href: '#option',
        })
      }
      if (!repoName) {
        validationErrors.push({
          field: 'github_repo',
          message: 'Please enter a repository name',
          href: '#github_repo',
        })
      } else if (formData.option === 'Archive') {
        if (!repoExists) {
          validationErrors.push({
            field: 'github_repo',
            message:
              'This repository name does not exist in components table in Service Catalogue, please enter existing repository name',
            href: '#github_repo',
          })
        }
        if (archiveRequestExists) {
          validationErrors.push({
            field: 'github_repo',
            message: 'An archive request for this component already exists in queue, please choose a different name',
            href: '#github_repo',
          })
        }
      } else if (formData.option === 'Add') {
        if (repoExists) {
          validationErrors.push({
            field: 'github_repo',
            message: 'This repository name already exists in components collection - please choose a different name',
            href: '#github_repo',
          })
        }
        if (repoRequestExists) {
          validationErrors.push({
            field: 'github_repo',
            message: 'A request for this component already exists in queue, please choose a different name',
            href: '#github_repo',
          })
        }
        if (!repoName.startsWith('hmpps')) {
          validationErrors.push({
            field: 'github_repo',
            message: 'The repository name must start with "hmpps"',
            href: '#github_repo',
          })
        }
        if (repoName.length >= 100) {
          validationErrors.push({
            field: 'github_repo',
            message: 'The repository name must be less than 100 characters',
            href: '#github_repo',
          })
        }
        if (!/^[a-zA-Z0-9-]+$/.test(repoName)) {
          validationErrors.push({
            field: 'github_repo',
            message: 'The repository name must only contain alphanumeric characters and hyphens',
            href: '#github_repo',
          })
        }
      } else {
        validationErrors.push({
          field: 'option',
          message: 'Please select a valid option',
          href: '#option',
        })
      }
      return validationErrors
    })
    try {
      const [, productList] = await dataFilterService.getFormsDropdownLists({
        teamName: '',
        productId: '',
        useFormattedName: true,
      })
      const filledData = { github_repo: formData.github_repo }
      if (formData.option === 'Archive') {
        return res.render('pages/componentArchiveRequestForm', {
          title: 'Github Repository Archive Request Form',
          submittedForm: filledData,
          ValidationErrors: [],
        })
      }
      return res.render('pages/componentRequestForm', {
        title: 'Github Repository Request Form',
        submittedForm: filledData,
        productList,
        ValidationErrors: [],
      })
    } catch {
      const validationErrors: FieldValidationError[] = []
      validationErrors.push({
        field: 'form',
        message: 'There was an error submitting your request. Please try again later.',
        href: '',
      })
      return res.render('pages/componentRequestFormOption', {
        validationErrors,
        formData,
      })
    }
  })

  router.get('/new', async (req, res) => {
    const [, productList] = await dataFilterService.getFormsDropdownLists({
      teamName: '',
      productId: '',
      useFormattedName: true,
    })
    return res.render('pages/componentRequestForm', {
      title: 'Github Repository Request Form',
      productList,
    })
  })

  router.get('/', async (req, res) => {
    return res.render('pages/componentRequests')
  })

  router.get('/data', async (req, res) => {
    const componentRequests = await serviceCatalogueService.getGithubRepoRequests()

    res.send(componentRequests)
  })

  router.get('/:repoName/:requestType', async (req, res) => {
    const { repoName } = req.params
    const requestType = req.params.requestType || 'Add'
    const componentRequest = await serviceCatalogueService.getGithubRepoRequest({ repoName }).then(data => {
      // Check if multiple records exist
      if (data.length > 1) {
        // Find the record that matches requestType
        const matchingRecord = data.find(item => item.request_type === requestType)
        // If no matching record, fallback to the record with request_type as null
        return matchingRecord || data.find(item => item.request_type === null)
      }
      // If only one record exists, return it
      return data[0]
    })
    return res.render('pages/componentRequest', { componentRequest })
  })

  router.post('/new', async (req, res): Promise<void> => {
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
          message: 'Please enter a repository name',
          href: '#github_repo',
        })
      } else {
        const repoName = body.github_repo?.toString()
        if (repoExists) {
          validationErrors.push({
            field: 'github_repo',
            message: 'This repository name already exists in components collection - please choose a different name',
            href: '#github_repo',
          })
        }
        if (repoRequestExists) {
          validationErrors.push({
            field: 'github_repo',
            message: 'A request for this component already exists in queue, please choose a different name',
            href: '#github_repo',
          })
        }
        if (!repoName.startsWith('hmpps')) {
          validationErrors.push({
            field: 'github_repo',
            message: 'The repository name must start with "hmpps"',
            href: '#github_repo',
          })
        }
        if (repoName.length >= 100) {
          validationErrors.push({
            field: 'github_repo',
            message: 'The repository name must be less than 100 characters',
            href: '#github_repo',
          })
        }
        if (!/^[a-zA-Z0-9-]+$/.test(repoName)) {
          validationErrors.push({
            field: 'github_repo',
            message: 'The repository name must only contain alphanumeric characters and hyphens',
            href: '#github_repo',
          })
        }
      }
      if (!body.repo_description) {
        validationErrors.push({
          field: 'repo_description',
          message: 'Please enter a repository description',
          href: '#repo_description',
        })
      }
      if (!body.base_template) {
        validationErrors.push({
          field: 'base_template',
          message: 'Please select a base template',
          href: '#base_template',
        })
      }
      if (!body.product) {
        validationErrors.push({
          field: 'product',
          message: 'Please select a product',
          href: '#product',
        })
      }
      if (!body.slack_channel_prod_release_notify) {
        validationErrors.push({
          field: 'slack_channel_prod_release_notify',
          message: 'Please enter a slack channel for production release notifications',
          href: '#slack_channel_prod_release_notify',
        })
      }
      if (!body.slack_channel_security_scans_notify) {
        validationErrors.push({
          field: 'slack_channel_security_scans_notify',
          message: 'Please enter a slack channel for security scans',
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
        if (!requesterEmail.endsWith('@digital.justice.gov.uk') && !requesterEmail.endsWith('@justice.gov.uk')) {
          validationErrors.push({
            field: 'requesterEmail',
            message: 'Valid email address is only with @digital.justice.gov.uk or @justice.gov.uk',
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

  router.get('/archive', async (req, res) => {
    return res.render('pages/componentArchiveRequestForm', {
      title: 'Github Repository Archive Request Form',
    })
  })

  router.post('/archive', async (req, res): Promise<void> => {
    const formData = req.body
    validateRequest(req, body => {
      const validationErrors: FieldValidationError[] = []
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
        if (!requesterEmail.endsWith('@justice.gov.uk')) {
          validationErrors.push({
            field: 'requesterEmail',
            message: 'Valid email address is only with @justice.gov.uk',
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
    try {
      const archiveData = {
        github_repo: formData.github_repo,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        requester_team: formData.requester_team,
        request_type: 'Archive',
        request_github_pr_status: 'Pending',
      }
      await serviceCatalogueService.postGithubRepoRequest({ data: archiveData })
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
      return res.render('pages/componentArchiveRequestForm', {
        validationErrors,
        formData,
      })
    }
  })
  return router
}

export const buildFormData = (formData: Record<string, unknown>): GithubRepoRequestRequest => {
  const sanitiseString = (str: string | undefined) => str?.replace(/[\s\r\n]+/g, ' ').trim()

  return {
    data: {
      github_repo: sanitiseString(formData.github_repo?.toString()),
      repo_description: sanitiseString(formData.repo_description?.toString()),
      base_template: sanitiseString(formData.base_template?.toString().replace('none', '')),
      ...(formData.jira_project_keys
        ? { jira_project_keys: sanitiseString(formData.jira_project_keys.toString()).split(',') }
        : {}),
      github_project_visibility: formData.github_project_visibility as GithubProjectVisibility,
      product: formData.product?.toString(),
      slack_channel_prod_release_notify: sanitiseString(
        formData.slack_channel_prod_release_notify?.toString().replace('#', ''),
      ),
      slack_channel_nonprod_release_notify: sanitiseString(
        formData.slack_channel_nonprod_release_notify?.toString().replace('#', ''),
      ),
      slack_channel_security_scans_notify: sanitiseString(
        formData.slack_channel_security_scans_notify?.toString().replace('#', ''),
      ),
      prod_alerts_severity_label: sanitiseString(formData.prod_alerts_severity_label?.toString()),
      nonprod_alerts_severity_label: sanitiseString(formData.nonprod_alerts_severity_label?.toString()),
      ...(formData.github_project_teams_write
        ? {
            github_project_teams_write: convertTeamsStringToArray(
              sanitiseString(formData.github_project_teams_write?.toString()),
            ),
          }
        : {}),
      github_projects_teams_admin: convertTeamsStringToArray(
        sanitiseString(formData.github_projects_teams_admin?.toString()),
      ),
      ...(formData.github_project_branch_protection_restricted_teams
        ? {
            github_project_branch_protection_restricted_teams: convertTeamsStringToArray(
              sanitiseString(formData.github_project_branch_protection_restricted_teams?.toString()),
            ),
          }
        : {}),
      requester_name: sanitiseString(formData.requester_name?.toString()),
      requester_email: sanitiseString(formData.requester_email?.toString()),
      requester_team: formData.requester_team?.toString(),
      request_github_pr_status: 'Pending',
      request_type: formData.request_type?.toString(),
    },
  }
}

export function convertTeamsStringToArray(teams: string): string[] {
  return teams
    .split(',')
    .map(team => team.trim())
    .filter(team => Boolean(team))
}
