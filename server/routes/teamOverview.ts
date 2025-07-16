import { Router, Response } from 'express'
import type { Services } from '../services'
import { convertToTitleCase, getFormattedName } from '../utils/utils'
import logger from '../../logger'

export default function routes({ serviceCatalogueService, teamsSummaryCountService }: Services): Router {
  const router = Router()

  // const get = (path: string, handler: RequestHandler) => router.get(path, handler)

  router.get('/', (req, res, next) => {
    res.render('pages/teamOverview')
  })

  //   router.get('/teams/:teamName', async (req, res) => {
  //     const { teamName } = req.params
  //     const formattedTeamName = convertToTitleCase(teamName)
  //     const formattedAgain = formattedTeamName.replace(/-/g, ' ')
  //     const teamSlug = getFormattedName(req, 'teamName')
  //     // const team = await serviceCatalogueService.getTeam({ teamSlug })
  //     // const realTeamSlug = team.slug
  //     console.log("NEW Team Slug:", teamSlug)
  //     console.log("NEW Team Name:", teamName)
  //     // console.log("NEW REAL Team Slug:", realTeamSlug)
  //     let teamAlertSummary: any = null
  //
  //     try {
  //       teamAlertSummary = await teamsSummaryCountService.getTeamAlertSummary(teamSlug)
  //       logger.info(`getTeamAlertSummary for team '${teamSlug}': ${JSON.stringify(teamAlertSummary, null, 2)}`)
  //
  //     } catch (err) {
  //       logger.error(`Error calling getTeamAlertSummary for team '${teamSlug}':`, err)
  //     }
  //   res.render('pages/teamOverview', { formattedAgain, teamAlertSummary })
  // })
  // return router
  // }

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

      res.render('pages/teamOverview', {
        teamName: team.name,
        teamAlertSummary,
        criticalAndHighTrivy,
        veryHighAndHighVeracode,
      })
    } catch (err) {
      logger.error(`Error calling getTeamAlertSummary for team '${teamSlug}':`, err)
    }
  })
  return router
}
