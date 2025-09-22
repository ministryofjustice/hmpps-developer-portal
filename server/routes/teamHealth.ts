import { Router } from 'express'
import type { Services } from '../services'
import { isValidDropDown } from '../utils/utils'

export default function routes({ teamHealthService, componentNameService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    if (req.query.updateServiceArea === '' && isValidDropDown(req, 'serviceArea')) {
      return res.redirect(`/team-health/service-areas/${req.query.serviceArea}`)
    }
    if (req.query.updateTeam === '' && isValidDropDown(req, 'team')) {
      return res.redirect(`/team-health/teams/${req.query.team}`)
    }

    const components = await componentNameService.getAllDeployedComponents()
    const teamHealth = await teamHealthService.getTeamHealth()

    return res.render('pages/teamHealth', {
      title: 'Team health',
      components,
      teamHealth,
    })
  })

  return router
}
