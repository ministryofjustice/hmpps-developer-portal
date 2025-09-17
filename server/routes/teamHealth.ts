import { Router } from 'express'
import type { Services } from '../services'
import { isValidDropDown } from '../utils/utils'

export default function routes({ teamHealthService, componentNameService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    // console.log('req.query.updateServiceArea: ', req.query.updateServiceArea)
    // console.log('isValidDropDown: ', isValidDropDown(req, 'serviceArea'))

    if (req.query.updateServiceArea === '' && isValidDropDown(req, 'serviceArea')) {
      return res.redirect(`/team-health/service-areas/${req.query.serviceArea}`)
    }
    // console.log('req.query.updateTeam: ', req.query.updateTeam)
    // console.log('isValidDropDown: ', isValidDropDown(req, 'team'))
    if (req.query.updateTeam === '' && isValidDropDown(req, 'team')) {
      return res.redirect(`/team-health/teams/${req.query.team}`)
    }

    const components = await componentNameService.getAllDeployedComponents()
    // console.log('components: ', components)
    const teamHealth = await teamHealthService.getTeamHealth()
    //     console.log('teamHealth: ', teamHealth)

    // for (const key in teamHealth.drift) {
    //   if (teamHealth.drift.hasOwnProperty(key)) {
    //     const team = teamHealth.drift[key];
    //     console.log(`  teamSlug: ${team.teamSlug}`);
    //     console.log(`  stats:`, team.stats);
    //   }
    // }

    return res.render('pages/teamHealth', {
      title: 'Team health',
      components,
      teamHealth,
    })
  })

  return router
}
