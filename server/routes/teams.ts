import { Router } from 'express'
import type { Services } from '../services'
import {
  getComponentNamesForTeam,
  getComponentsForTeam,
  getFormattedName,
  getIpAllowListAndModSecurityStatus,
  utcTimestampToUtcDateTime,
} from '../utils/utils'
import logger from '../../logger'
import config from '../config'
import { DependencyComparisonResult, getDependencyComparison } from '../services/dependencyComparison'
import { IpAllowListAndModSecurityStatus } from '../data/modelTypes'

export default function routes({
  serviceCatalogueService,
  teamsSummaryCountService,
  monitoringChannelService,
  recommendedVersionsService,
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
      slug: teamSlug,
      products,
    }

    return res.render('pages/team', { team: displayTeam })
  })

  router.get('/team-overview/:teamSlug', async (req, res) => {
    const teamSlug = getFormattedName(req, 'teamSlug')
    const team = await serviceCatalogueService.getTeam({ teamSlug, withEnvironments: true })
    const products = team.products.map(product => product)
    const components = getComponentsForTeam(team)
    const componentNames = getComponentNamesForTeam(team)
    const componentList: string[] =
      componentNames && componentNames.length > 0 ? componentNames.map(component => component.componentName) : []
    const displayComponent = {}
    const fullTeamComparison: DependencyComparisonResult[] = []
    let upgradeNeeded = false
    const securityStatus: IpAllowListAndModSecurityStatus[] = []

    try {
      const teamAlertSummary = await teamsSummaryCountService.getTeamAlertSummary(teamSlug)
      const teamTrivyScanSummary = await teamsSummaryCountService.getTeamTrivyVulnerabilityCounts(products)
      const criticalAndHighTrivy = teamTrivyScanSummary.critical + teamTrivyScanSummary.high
      const teamVeracodeScanSummary = await teamsSummaryCountService.getTeamVeracodeVulnerabilityCounts(products)
      const veryHighAndHighVeracode = teamVeracodeScanSummary.veryHigh + teamVeracodeScanSummary.high

      // Generate monitoring channel recommendations
      const channelRecommendations = monitoringChannelService.generateChannelRecommendations(team)
      const channelTree = monitoringChannelService.generateChannelTree(channelRecommendations)

      // Check for legacy channels
      const legacyChannelCount = channelRecommendations.recommendations.filter(
        rec =>
          rec.currentChannels.dev === '#dps_alerts_non_prod' ||
          rec.currentChannels.preprod === '#dps_alerts_non_prod' ||
          rec.currentChannels.prod === '#dps_alerts',
      ).length

      // Dependency comparison for this team
      const dependencyComparisonPromise = await Promise.all(
        components.map(async component => {
          const comparison = await getDependencyComparison(component, recommendedVersionsService, displayComponent)
          return { component, comparison }
        }),
      )
      dependencyComparisonPromise.forEach(({ component, comparison }) => {
        if (!upgradeNeeded) {
          upgradeNeeded =
            component.language === 'Kotlin' &&
            (comparison.summary.needsAttention > 0 || comparison.summary.needsUpgrade > 0)
        }
        fullTeamComparison.push(comparison)
      })

      // List IP allowlist and MOD security enabled values or PROD only
      for (const component of components) {
        const prodOnlyEnv = component.envs.filter(environment => environment.type === 'prod')
        const secStatus: IpAllowListAndModSecurityStatus = getIpAllowListAndModSecurityStatus(prodOnlyEnv)
        securityStatus.push({
          componentName: component.name,
          status: {
            ipAllowListEnabled: secStatus.status.ipAllowListEnabled,
            modSecurityEnabled: secStatus.status.modSecurityEnabled,
          },
        })
      }

      const displayTeam = {
        name: team.name,
        componentList,
        encodedTeamName: encodeURIComponent(team.name),
        alertSummary: teamAlertSummary,
        criticalAndHighTrivy,
        veryHighAndHighVeracode,
        channelRecommendations,
        channelTree,
        hasLegacyChannels: legacyChannelCount > 0,
        legacyChannelCount,
        upgradeNeeded,
        fullTeamComparison,
        securityStatus,
      }

      res.render('pages/teamOverview', { team: displayTeam })
    } catch (err) {
      logger.error(`Error calling getTeamAlertSummary for team '${teamSlug}':`, err)
    }
  })

  return router
}
