import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { UpdateGithubTeamsRequestRequest } from '../data/strapiApiTypes'
import { validateRequest } from '../middleware/setUpValidationMiddleware'
import { FieldValidationError } from '../@types/FieldValidationError'
import { formatMonitorName, convertTeamsToArray } from '../utils/utils'

export default function routes({ componentNameService, serviceCatalogueService, dataFilterService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/new', async (req, res) => {
    const [subTeamList, teamList, userList] = await dataFilterService.getTeamsFormsLists({
      subTeamName: '',
      teamName: '',
      userName: '',
      useFormattedName: true,
    })
    return res.render('pages/githubTeamRequestForm', {
      title: 'Github Team Requst Form',
      subTeamList,
      teamList,
      userList,
    })
  })

  get('/', async (req, res) => {
    return res.render('pages/githubTeamRequests')
  })

  get('/data', async (req, res) => {
    const teamRequests = await serviceCatalogueService.getUpdateGithubTeamRequests()

    res.send(teamRequests)
  })

  get('/:github_team_name', async (req, res) => {
    const teamName = req.params.github_team_name
    const teamRequest = await serviceCatalogueService.getUpdateGithubTeamRequest({ teamName })
    const displayTeam = {
      github_team_name: teamRequest.team_name,
      team_description: teamRequest.team_desc,
      parent_team_name: teamRequest.parent_team_name,
      members: teamRequest.members,
      requester_name: teamRequest.requester_name,
      requester_email: teamRequest.requester_email,
      requester_team: teamRequest.requester_team,
      request_github_pr_status: teamRequest.request_github_pr_status,
      request_github_pr_number: teamRequest.request_github_pr_number,
    }
    return res.render('pages/githubTeamRequest', { teamRequest: displayTeam })
  })

  get('/:github_team_name/members', async (req, res) => {
    const teamName = req.params.github_team_name
    const memberList = await serviceCatalogueService.getTeamMembers({ teamName })

    res.send(memberList)
  })

  post('/new', async (req, res): Promise<void> => {
    const formData = req.body
    const teamRequestExists = formData.team_name
      ? await componentNameService.checkGithubTeamRequestExists(formData.team_name)
      : false
    const teamExists = formData.team_name ? await componentNameService.checkGithubTeamExists(formData.team_name) : false
    validateRequest(req, body => {
      const validationErrors: FieldValidationError[] = []
      if (!body.team_name) {
        validationErrors.push({
          field: 'team_name',
          message: 'Please enter a Team name',
          href: '#team_name',
        })
      } else {
        const teamName = formatMonitorName(body.team_name?.toString())
        if (teamExists) {
          validationErrors.push({
            field: 'team_name',
            message: 'This team already exists in github teams - please choose a different name',
            href: '#team_name',
          })
        }
        if (teamRequestExists) {
          validationErrors.push({
            field: 'team_name',
            message: 'A request for this team already exists in queue, please choose a different name',
            href: '#team_name',
          })
        }
        if (teamName.length >= 50) {
          validationErrors.push({
            field: 'team_name',
            message: 'The repository name must be less than 50 characters',
            href: '#team_name',
          })
        }
      }
      if (!body.team_description) {
        validationErrors.push({
          field: 'team_description',
          message: 'Please enter a team description',
          href: '#team_description',
        })
      }
      if (body.team_type === 'sub_team' && !body.parent_team_name) {
        validationErrors.push({
          field: 'parent_team_name',
          message: 'Please select a parent team name',
          href: '#tparent_team_name',
        })
      }
      if (!body.github_users) {
        validationErrors.push({
          field: 'github_users',
          message: 'Please select github users to add in the team',
          href: '#github_users',
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
      await serviceCatalogueService.postUpdateGithubTeamRequest(requestFormData)
      return res.render('pages/githubTeamRequestConfirmation', {
        title: 'Github Team Request Confirmation',
        teamName: formData.team_name,
      })
    } catch {
      const validationErrors: FieldValidationError[] = []
      validationErrors.push({
        field: 'form',
        message: 'There was an error submitting your request. Please try again later.',
        href: '',
      })
      return res.render('pages/githubTeamRequestForm', {
        validationErrors,
        formData,
      })
    }
  })

  return router
}

const buildFormData = (formData: Record<string, unknown>): UpdateGithubTeamsRequestRequest => {
  const sanitiseString = (str: string | undefined) => str?.replace(/[\s\r\n]+/g, ' ').trim()
  return {
    data: {
      team_name: sanitiseString(formatMonitorName(formData.team_name?.toString())),
      team_desc: sanitiseString(formData.team_description?.toString()),
      parent_team_name:
        formData.team_type?.toString() === 'parent_team' ? 'hmpps-developers' : formData.parent_team_name?.toString(),
      members: convertTeamsToArray(formData.github_users?.toString()),
      requester_name: sanitiseString(formData.requester_name?.toString()),
      requester_email: sanitiseString(formData.requester_email?.toString()),
      requester_team: formData.requester_team?.toString(),
      request_github_pr_status: 'Pending',
    },
  }
}
