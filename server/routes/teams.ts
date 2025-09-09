import { Router } from 'express'
import type { Services } from '../services'
import { getFormattedName, utcTimestampToUtcDateTime } from '../utils/utils'
import logger from '../../logger'

export default function routes({
  serviceCatalogueService,
  teamsSummaryCountService,
  monitoringChannelService,
}: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const scheduledJobRequest = await serviceCatalogueService.getScheduledJob({ name: 'hmpps-sharepoint-discovery' })
    return res.render('pages/teams', {
      jobName: scheduledJobRequest.name,
      lastSuccessfulRun: utcTimestampToUtcDateTime(scheduledJobRequest.last_successful_run),
    })
  })

  router.get('/data', async (req, res) => {
    const teams = await serviceCatalogueService.getTeams({})

    res.send(teams)
  })

  router.get('/:teamSlug', async (req, res) => {
    const teamSlug = getFormattedName(req, 'teamSlug')
    const team = await serviceCatalogueService.getTeam({ teamSlug })
    const products = team.products && team.products.length > 0 ? team.products.map(product => product) : null

    const displayTeam = {
      id: team.t_id,
      name: team.name,
      slackChannelId: team.slack_channel_id,
      slackChannelName: team.slack_channel_name,
      products,
    }

    return res.render('pages/team', { team: displayTeam })
  })

  router.get('/team-overview/:teamSlug', async (req, res) => {
    const teamSlug = getFormattedName(req, 'teamSlug')
    const team = await serviceCatalogueService.getTeam({ teamSlug, withEnvironments: true })
    const products = team.products.map(product => product)

    try {
      const teamAlertSummary = await teamsSummaryCountService.getTeamAlertSummary(teamSlug)
      logger.info(`getTeamAlertSummary for team '${teamSlug}': ${JSON.stringify(teamAlertSummary, null, 2)}`)

      const teamTrivyScanSummary = await teamsSummaryCountService.getTeamTrivyVulnerabilityCounts(products)
      logger.info(
        `getTeamTrivyScanSummary for team '${teamSlug}' (${team.name}): ${JSON.stringify(teamTrivyScanSummary, null, 2)}`,
      )
      const criticalAndHighTrivy = teamTrivyScanSummary.critical + teamTrivyScanSummary.high

      const teamVeracodeScanSummary = await teamsSummaryCountService.getTeamVeracodeVulnerabilityCounts(products)
      logger.info(
        `getTeamVeracodeScanSummary for team '${teamSlug}': ${JSON.stringify(teamVeracodeScanSummary, null, 2)}`,
      )
      const veryHighAndHighVeracode = teamVeracodeScanSummary.veryHigh + teamVeracodeScanSummary.high

      // Generate monitoring channel recommendations
      const channelRecommendations = monitoringChannelService.generateChannelRecommendations(team)
      const channelTree = monitoringChannelService.generateChannelTree(channelRecommendations)

      // Check for legacy channels
      const hasLegacyChannels = channelRecommendations.recommendations.some(
        rec =>
          rec.currentChannels.dev === '#dps_alerts_non_prod' ||
          rec.currentChannels.preprod === '#dps_alerts_non_prod' ||
          rec.currentChannels.prod === '#dps_alerts',
      )

      res.render('pages/teamOverview', {
        teamName: team.name,
        formatTeamNameURL: encodeURIComponent(team.name),
        teamSlug: team.slug,
        teamAlertSummary,
        criticalAndHighTrivy,
        veryHighAndHighVeracode,
        channelRecommendations,
        channelTree,
        hasLegacyChannels,
      })
    } catch (err) {
      logger.error(`Error calling getTeamAlertSummary for team '${teamSlug}':`, err)
    }
  })

  return router
}
