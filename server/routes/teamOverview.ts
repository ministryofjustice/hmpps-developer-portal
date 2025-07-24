import { Router } from 'express'
import type { Services } from '../services'
import { getFormattedName } from '../utils/utils'
import logger from '../../logger'

export default function routes({ serviceCatalogueService, teamsSummaryCountService }: Services): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    res.render('pages/teamOverview')
  })

  router.get('/teams/:teamSlug', async (req, res) => {
    const teamSlug = getFormattedName(req, 'teamSlug')
    const team = await serviceCatalogueService.getTeam({ teamSlug })
    const products = team.products.map(product => product)

    try {
      const teamAlertSummary = await teamsSummaryCountService.getTeamAlertSummary(teamSlug)
      logger.info(`getTeamAlertSummary for team '${teamSlug}': ${JSON.stringify(teamAlertSummary, null, 2)}`)

      const teamTrivyScanSummary = await teamsSummaryCountService.getTeamTrivyVulnerabilityCounts(products)
      logger.info(`getTeamTrivyScanSummary for team '${teamSlug}': ${JSON.stringify(teamTrivyScanSummary, null, 2)}`)
      const criticalAndHighTrivy = teamTrivyScanSummary.critical + teamTrivyScanSummary.high

      const teamVeracodeScanSummary = await teamsSummaryCountService.getTeamVeracodeVulnerabilityCounts(products)
      logger.info(
        `getTeamVeracodeScanSummary for team '${teamSlug}': ${JSON.stringify(teamVeracodeScanSummary, null, 2)}`,
      )
      const veryHighAndHighVeracode = teamVeracodeScanSummary.veryHigh + teamVeracodeScanSummary.high

      function formatURL(teamName: string) {
        return teamName.replace(/[ &()]/g, (char: string) => {
          const replacements: Record<string, string> = { ' ': '+', '&': '%26', '(': '%28', ')': '%29' }
          return replacements[char] || char
        })
      }

      res.render('pages/teamOverview', {
        teamName: team.name,
        teamSlug: team.slug,
        teamAlertSummary,
        criticalAndHighTrivy,
        veryHighAndHighVeracode,
        formatURL,
      })
    } catch (err) {
      logger.error(`Error calling getTeamAlertSummary for team '${teamSlug}':`, err)
    }
  })
  return router
}
