import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { UpdateGithubUsersRequestRequest } from '../data/strapiApiTypes'
import { validateRequest } from '../middleware/setUpValidationMiddleware'
import { FieldValidationError } from '../@types/FieldValidationError'
import { formatMonitorName, convertTeamsToArray } from '../utils/utils'

export default function routes({ componentNameService, serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/new', async (req, res) => {
    const [subTeamList, teamList, userList, githubTeamList] = await dataFilterService.getTeamsFormsLists({
      subTeamName: '',
      teamName: '',
      userName: '',
      useFormattedName: true,
    })
    return res.render('pages/githubUserRequestForm', {
      title: 'Github User Requst Form',
      teamList,
      githubTeamList,
    })
  })

  get('/', async (req, res) => {
    return res.render('pages/githubUserRequests')
  })

  get('/data', async (req, res) => {
    const userRequests = await serviceCatalogueService.getUpdateGithubUserRequests()

    res.send(userRequests)
  })

  get('/:github_username', async (req, res) => {
    const githubUserName = req.params.github_username
    const userRequest = await serviceCatalogueService.getUpdateGithubUserRequest({ githubUserName })
    const displayUser = {
      github_username: userRequest.github_username,
      full_name: userRequest.full_name,
      user_email: userRequest.user_email,
      github_teams: userRequest.github_teams,
      requester_name: userRequest.requester_name,
      requester_email: userRequest.requester_email,
      requester_team: userRequest.requester_team,
      request_github_pr_status: userRequest.request_github_pr_status,
      request_github_pr_number: userRequest.request_github_pr_number,
    }
    return res.render('pages/githubUserRequest', { userRequest: displayUser })
  })

  get('/:github_username/teams', async (req, res) => {
    const githubUserName = req.params.github_username
    const teamMembership = await serviceCatalogueService.getGithubUser({ githubUserName })

    res.send(teamMembership.github_teams || [])
  })

  post('/new', async (req, res): Promise<void> => {
    const formData = req.body
    const isAdd = formData.user_action === 'Add'
    const userRequestExists = formData.github_username
      ? await componentNameService.checkGithubUserRequestExists(formData.github_username)
      : false
    const userExists = formData.github_username ? await componentNameService.checkGithubUserExists(formData.github_username) : false
    validateRequest(req, body => {
      const validationErrors: FieldValidationError[] = []
      if (!body.github_username) {
        validationErrors.push({
          field: 'github_username',
          message: 'Please enter a Github User Login',
          href: '#github_username',
        })
      } else {
        const userName = formatMonitorName(body.github_username?.toString())
        if (userExists && isAdd) {
          validationErrors.push({
            field: 'github_username',
            message: 'This user already exists in github users - please choose a different name',
            href: '#github_username',
          })
        }
        if (userRequestExists && !isAdd) {
          validationErrors.push({
            field: 'github_username',
            message: 'A request for this user already exists in queue, please choose a different name',
            href: '#github_username',
          })
        }
      }
      if (!body.full_name && isAdd) {
        validationErrors.push({
          field: 'full_name',
          message: 'Please enter users full name',
          href: '#full_name',
        })
      }
      const user_email = body.user_email?.toString()
      if (!body.user_email && isAdd) {
        validationErrors.push({
          field: 'user_email',
          message: 'Please enter users email address',
          href: '#user_email',
        })
      }
      if (!user_email.endsWith('@digital.justice.gov.uk') && isAdd) {
        validationErrors.push({
          field: 'user_email',
          message: 'Valid email address is only with @digital.justice.gov.uk',
          href: '#user_email',
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
          field: 'requester_user',
          message: 'Select Requesting Team',
          href: '#requester_user',
        })
      }
      return validationErrors
    })
    const requestFormData = buildFormData(formData)
    try {
      await serviceCatalogueService.postUpdateGithubUserRequest(requestFormData)
      return res.render('pages/githubUserRequestConfirmation', {
        title: 'Github User Request Confirmation',
        githubUserName: formData.github_username,
      })
    } catch {
      const validationErrors: FieldValidationError[] = []
      validationErrors.push({
        field: 'form',
        message: 'There was an error submitting your request. Please try again later.',
        href: '',
      })
      return res.render('pages/githubUserRequestForm', {
        validationErrors,
        formData,
      })
    }
  })

  return router
}

const buildFormData = (formData: Record<string, unknown>): UpdateGithubUsersRequestRequest => {
  const sanitiseString = (str: string | undefined) => str?.replace(/[\s\r\n]+/g, ' ').trim()
  return {
    data: {
      github_username: sanitiseString(formatMonitorName(formData.github_username?.toString())),
      full_name: sanitiseString(formData.full_name?.toString()),
      user_email: sanitiseString(formData.user_email?.toString()),
      github_teams: convertTeamsToArray(formData.github_teams?.toString()),
      requester_name: sanitiseString(formData.requester_name?.toString()),
      requester_email: sanitiseString(formData.requester_email?.toString()),
      requester_team: formData.requester_team?.toString(),
      request_github_pr_status: 'Pending',
    },
  }
}
