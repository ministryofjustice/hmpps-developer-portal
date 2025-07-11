import dayjs from 'dayjs'

import { startOfDay } from 'date-fns'
import {
  DateDifference,
  associateBy,
  differenceInDate,
  formatMonitorName,
  groupBy,
  median,
  utcTimestampToUtcDate,
} from '../utils/utils'
import RedisService from './redisService'
import ServiceCatalogueService from './serviceCatalogueService'
import { Component } from '../data/modelTypes'

export type VersionDetails = {
  component: string
  type: string
  version: string
  buildDate?: Date
  build?: string
  sha?: string
  dateAdded: Date
}

export type ComponentAndReason = {
  component: string
  reason: string
}

export type ComponentHealth = { name: string; staleness: DateDifference; drift: DateDifference }

type Stats = {
  avg: number
  median: number
  max: number
  maxComponent: unknown
  days: number[]
}

export type TeamWithComponentHealth = {
  name: string
  teamSlug: string
  serviceAreaSlug: string
  componentHealth: ComponentHealth[]
}

export type TeamWithHealthStats = {
  teamSlug: string
  serviceAreaSlug: string
  numberOfComponents: number
  stats: Stats
}

export type DriftData = Awaited<ReturnType<TeamHealthService['getDriftData']>>[0]

export default class TeamHealthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly serviceCatalogueService: ServiceCatalogueService,
  ) {}

  versionRegex = /\d{4}-\d{2}-\d{2}\.\d+\.\w+/

  private async getVersionDetailsByComponent(): Promise<Record<string, VersionDetails[]>> {
    const latestDetails = await this.redisService.readLatest('latest:versions')

    const versionDetails = Object.entries(latestDetails).map(([nameAndEnv, values]) => {
      const [component, type] = nameAndEnv.split(':')
      const { v: version, dateAdded } = values

      if (this.versionRegex.test(version)) {
        const [buildDate, build, sha] = version.split('.')
        return {
          component,
          type,
          version,
          dateAdded: dayjs(dateAdded, 'YYYY-MM-DD').toDate(),
          buildDate: dayjs(buildDate, 'YYYY-MM-DD').toDate(),
          build,
          sha,
        }
      }
      return {
        component,
        type,
        version,
        dateAdded: dayjs(dateAdded, 'YYYY-MM-DD').toDate(),
      }
    })
    return groupBy(versionDetails, details => details.component)
  }

  private getIncalculableReason(envs: { type: string; version: string; buildDate?: Date }[]): string {
    const envMissingVersion = envs.find(env => !env.buildDate)
    if (envMissingVersion) {
      return `Build Version in correct format: ${envMissingVersion.version}`
    }
    return undefined
  }

  async getComponentsWeCannotCalculateHealthFor(): Promise<ComponentAndReason[]> {
    const versionDetailsByComponent = await this.getVersionDetailsByComponent()
    const allComponents = await this.serviceCatalogueService.getComponents()

    const componentsMissingHealth = allComponents
      .filter(component => (component.api || component.frontend) && !versionDetailsByComponent[component.name])
      .map(component => ({
        component: component.name,
        reason: 'Missing version info in redis',
      }))

    const componentsWithReasons = Object.entries(versionDetailsByComponent).flatMap(([name, envs]) => {
      const reason = this.getIncalculableReason(envs)
      return reason
        ? [
            {
              component: name,
              reason,
            },
          ]
        : []
    })

    return componentsMissingHealth
      .concat(componentsWithReasons)
      .sort(({ component: c1 }, { component: c2 }) => c1.localeCompare(c2))
  }

  async getComponentsMissingTeams(): Promise<{ component: string; product: string }[]> {
    const allComponents = await this.serviceCatalogueService.getComponents(undefined, true)
    const componentsMissingTeams = allComponents
      .filter(component => !component?.product?.team)
      .map(component => ({
        product: component.product.name,
        productSlug: component.product.slug,
        component: component.name,
      }))

    return componentsMissingTeams.sort(({ product: p1, component: c1 }, { product: p2, component: c2 }) => {
      const productDiff = p1.localeCompare(p2)
      return productDiff !== 0 ? productDiff : c1.localeCompare(c2)
    })
  }

  async getDriftData(componentNames: string[], now?: Date) {
    const versionDetailsByComponent = await this.getVersionDetailsByComponent()
    const allComponents = await this.serviceCatalogueService.getComponents([], false, true)
    const components = allComponents
      .filter(component => componentNames.includes(component.name))
      .map(component => {
        const driftData = this.toComponentView(component, versionDetailsByComponent[component.name], now || new Date())
        return driftData
      })
    return components
  }

  async getTeamHealth(now?: Date) {
    const versionDetailsByComponent = await this.getVersionDetailsByComponent()
    const allComponents = await this.serviceCatalogueService.getComponents([], true)
    const components = allComponents
      .map(component => {
        const driftData = this.toComponentView(component, versionDetailsByComponent[component.name], now || new Date())
        return { driftData, component }
      })
      .filter(({ driftData }) => driftData?.environments.length)
    const teamsWithComponentHealth: Record<string, TeamWithComponentHealth> = components.reduce(
      (acc, { driftData, component }) => {
        const { product } = component
        const teamName = product?.team?.name
        const teamSlug = product?.team?.slug
        const serviceAreaSlug = product?.service_area?.slug
        const componentHealth = acc[teamName]?.componentHealth || ([] as ComponentHealth[])
        const { staleness, drift, name } = driftData
        componentHealth.push({ staleness, drift, name })
        acc[teamName] = {
          name: teamName,
          teamSlug,
          serviceAreaSlug,
          componentHealth,
        }
        return acc
      },
      {} as Record<string, TeamWithComponentHealth>,
    )

    teamsWithComponentHealth.All = {
      name: 'All',
      teamSlug: undefined as string,
      serviceAreaSlug: undefined as string,
      componentHealth: components.map(({ driftData }) => {
        const { staleness, drift, name } = driftData
        return { staleness, drift, name }
      }),
    }

    const drift: Record<string, TeamWithHealthStats> = Object.fromEntries(
      Object.entries(teamsWithComponentHealth)
        .map(([team, teamHealth]) => [
          team,
          {
            teamSlug: formatMonitorName(team),
            serviceAreaSlug: teamHealth.serviceAreaSlug,
            numberOfComponents: teamHealth.componentHealth.length,
            stats: this.getStats(teamHealth.componentHealth, componenent => componenent.drift.days),
          },
        ])
        .sort(this.sortTeamHealth),
    )
    const staleness = Object.fromEntries(
      Object.entries(teamsWithComponentHealth)
        .map(([team, teamHealth]): [team: string, team: TeamWithHealthStats] => [
          team,
          {
            teamSlug: formatMonitorName(team),
            serviceAreaSlug: teamHealth.serviceAreaSlug,
            numberOfComponents: teamHealth.componentHealth.length,
            stats: this.getStats(teamHealth.componentHealth, componenent => componenent.staleness.days),
          },
        ])
        .sort(this.sortTeamHealth),
    )

    return {
      drift,
      staleness,
    }
  }

  private getStats = (
    driftAndStaleness: ComponentHealth[],
    metricChooser: (element: ComponentHealth) => number,
  ): Stats => {
    const days = driftAndStaleness.map(metricChooser).sort((a, b) => a - b)
    const max = Math.max(...days)
    const maxComponent = driftAndStaleness.find(element => metricChooser(element) === max)
    const avg = days.reduce((acc, i) => acc + i) / driftAndStaleness.length

    return {
      avg,
      median: median(days),
      max,
      maxComponent,
      days,
    }
  }

  sortTeamHealth = (
    [teamA, healthA]: [team: string, teamHealth: TeamWithHealthStats],
    [teamB, healthB]: [team: string, teamHealth: TeamWithHealthStats],
  ) => {
    return healthA.stats.max === healthB.stats.max ? teamA.localeCompare(teamB) : healthB.stats.max - healthA.stats.max
  }

  toComponentView = (component: Component, versionDetails: VersionDetails[], now: Date) => {
    const versionDetailByEnv = associateBy(versionDetails, details => details.type)

    const environmentsWithVersions = component.envs
      .map(env => {
        if (!versionDetailByEnv[env.name]) {
          return undefined
        }
        const { buildDate, dateAdded, sha, version } = versionDetailByEnv[env.name]
        const daysSinceUpdated = differenceInDate(now, dateAdded).days
        return {
          name: env.name,
          buildDate,
          dateAdded,
          sha,
          version,
          type: env.type,
          daysSinceUpdated,
          componentName: component.name,
        }
      })
      .filter(env => env)

    const reason = this.getIncalculableReason(environmentsWithVersions)
    if (reason) {
      return undefined
    }

    const latestDevEnvironment = environmentsWithVersions
      .filter(env => env.type === 'dev')
      .sort((e1, e2) => e2.buildDate.getTime() - e1.buildDate.getTime())[0]

    const earliestProdEnvironment = environmentsWithVersions
      .filter(env => env.type === 'prod')
      .sort((e1, e2) => e1.buildDate.getTime() - e2.buildDate.getTime())[0]

    const commitDate = component.latest_commit?.date_time && startOfDay(new Date(component.latest_commit?.date_time))
    const commitSha = component.latest_commit?.sha?.slice(0, 7)

    const useLatestDevOverLastCommit = component.part_of_monorepo || latestDevEnvironment?.buildDate >= commitDate
    const baseDate = useLatestDevOverLastCommit ? latestDevEnvironment?.buildDate || commitDate : commitDate
    const baseSha = useLatestDevOverLastCommit ? latestDevEnvironment?.sha || commitSha : commitSha

    return {
      name: component.name,
      repo: component.github_repo,
      latestCommit: {
        date: utcTimestampToUtcDate(component.latest_commit?.date_time),
        sha: commitSha,
      },
      baseSha,
      prodEnvSha: earliestProdEnvironment?.sha,
      drift: differenceInDate(baseDate, earliestProdEnvironment?.buildDate),
      staleness: differenceInDate(startOfDay(now), baseDate),
      environments: environmentsWithVersions,
    }
  }
}
