import { Router } from 'express'
import type { Services } from '../services'
import { getFormattedName, utcTimestampToUtcDateTime } from '../utils/utils'
import logger from '../../logger'
import config from '../config'

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

      const displayTeam = {
        name: team.name,
        encodedTeamName: encodeURIComponent(team.name),
        slackWorkspaceId: config.slack.workspaceId,
        slackChannelId: team.slack_channel_id,
        slackChannelName: team.slack_channel_name,
        alertSummary: teamAlertSummary,
        criticalAndHighTrivy,
        veryHighAndHighVeracode,
        channelRecommendations,
        channelTree,
        hasLegacyChannels,
      }

      // Example of fetching recommended dependency versions from Strapi template component and log comparisons
      try {
        const recommended = await recommendedVersionsService.getRecommendedVersions()

        // Helper parsers for current values from component.versions
        const parseValue = (raw: unknown): string | undefined => {
          if (raw === null || raw === undefined) return undefined
          if (typeof raw === 'string' || typeof raw === 'number') return String(raw)
          if (typeof raw === 'object') {
            const obj = raw as Record<string, unknown>
            return (obj.ref as string) || (obj.version as string) || undefined
          }
          return undefined
        }

        type Item = {
          componentName: string
          name: 'generic_prometheus_alerts' | 'generic_service' | 'hmpps_gradle_spring_boot'
          current?: string
          recommended?: string
          status: 'missing' | 'aligned' | 'needs-upgrade' | 'above-baseline'
        }

        const items: Item[] = []
        const components = products.flatMap(p => p.components || [])
        // Simple dotted numeric comparator (e.g. 1.2.3). Non-numeric parts are ignored.
        const compareVersions = (a: string, b: string): number => {
          const toParts = (v: string): number[] =>
            v
              .replace(/^v/i, '')
              .split('.')
              .map(s => {
                const m = s.match(/\d+/)
                return m ? parseInt(m[0], 10) : 0
              })
          const pa = toParts(a)
          const pb = toParts(b)
          const len = Math.max(pa.length, pb.length)
          for (let i = 0; i < len; i += 1) {
            const da = pa[i] ?? 0
            const db = pb[i] ?? 0
            if (da > db) return 1
            if (da < db) return -1
          }
          return 0
        }

        const classify = (current?: string, recommendedVal?: string): Item['status'] => {
          if (!current || !recommendedVal) return 'missing'
          const cmp = compareVersions(current, recommendedVal)
          if (cmp < 0) return 'needs-upgrade'
          if (cmp === 0) return 'aligned'
          return 'above-baseline'
        }

        components.forEach(component => {
          const versions = (component as unknown as { versions?: Record<string, unknown> }).versions || {}
          const helmDeps = (versions as Record<string, unknown>).helm_dependencies as Record<string, unknown>
          const helmLegacy = (versions as Record<string, unknown>).helm as Record<string, unknown>
          const gradle = (versions as Record<string, unknown>).gradle as Record<string, unknown>

          const currentGpa =
            parseValue(helmDeps?.generic_prometheus_alerts) ||
            parseValue(helmDeps?.['generic-prometheus-alerts'] as unknown) ||
            parseValue((helmLegacy?.dependencies as Record<string, unknown>)?.['generic-prometheus-alerts'])
          const currentGs =
            parseValue(helmDeps?.generic_service) ||
            parseValue(helmDeps?.['generic-service'] as unknown) ||
            parseValue((helmLegacy?.dependencies as Record<string, unknown>)?.['generic-service'])
          const currentHgsb =
            parseValue(gradle?.hmpps_gradle_spring_boot) || parseValue(gradle?.['hmpps-gradle-spring-boot'] as unknown)

          const pushItem = (name: Item['name'], current: string | undefined, recommendedVal: string | undefined) => {
            items.push({
              componentName: component.name,
              name,
              current,
              recommended: recommendedVal,
              status: classify(current, recommendedVal),
            })
          }

          pushItem('generic_prometheus_alerts', currentGpa, recommended.helm_dependencies.generic_prometheus_alerts)
          pushItem('generic_service', currentGs, recommended.helm_dependencies.generic_service)
          pushItem('hmpps_gradle_spring_boot', currentHgsb, recommended.gradle.hmpps_gradle_spring_boot)
        })

        const needsUpgradeOnly = items.filter(i => i.status === 'needs-upgrade')
        const compact = items
          .slice(0, 10)
          .map(
            i =>
              `${i.componentName}:${i.name}=(current: ${i.current || 'missing'}, recommended: ${
                i.recommended || 'missing'
              }) [${i.status}]`,
          )
          .join('; ')
        logger.info(
          `[DependencyRecs] Team=${team.name}, source=${recommended.metadata.source}, components=${
            new Set(items.map(i => i.componentName)).size
          }, items=${items.length}, needsUpgrade=${needsUpgradeOnly.length}; ${compact}`,
        )

        if (recommended.metadata.source === 'none') {
          logger.warn(
            `[DependencyRecs] Incomplete recommended versions for team=${team.name}. Source=${recommended.metadata.source}`,
          )
        }
      } catch (e) {
        logger.warn(`[DependencyRecs] Failed to compute dependency comparisons for team=${team.name}: ${String(e)}`)
      }
      // example ends here - this will be removed after confirmation.

      res.render('pages/teamOverview', { team: displayTeam })
    } catch (err) {
      logger.error(`Error calling getTeamAlertSummary for team '${teamSlug}':`, err)
    }
  })

  return router
}
