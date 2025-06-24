import { Router } from 'express'
import type { Services } from '../services'

export default function routes({ productDependenciesService, teamHealthService }: Services): Router {
  const router = Router()

  router.get('/', async (_, res) => {
    const componentsWithoutProducts = await productDependenciesService.getComponentsWithUnknownProducts()
    const hostNamesWithoutComponents = await productDependenciesService.getHostNamesMissingComponents()
    const componentsMissingTeams = await teamHealthService.getComponentsMissingTeams()
    const componentsWeCannotCalculateTeamHealthFor = await teamHealthService.getComponentsWeCannotCalculateHealthFor()
    return res.render('pages/missingFromCatalogue', {
      componentsWithoutProducts,
      hostNamesWithoutComponents,
      componentsMissingTeams,
      componentsWeCannotCalculateTeamHealthFor,
    })
  })

  return router
}
