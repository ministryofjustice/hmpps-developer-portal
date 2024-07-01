import dayjs from 'dayjs'
import { RedisClient } from '../data/redisClient'

import { associateBy, differenceInDate, groupBy } from '../utils/utils'
import RedisService from './redisService'
import ServiceCatalogueService from './serviceCatalogueService'
import { Component } from '../data/strapiApiTypes'

export type RedisStreamMessage = Awaited<ReturnType<RedisClient['xRead']>>[number]['messages'][number]
export type AsyncRedisStreamGenerator = AsyncGenerator<RedisStreamMessage, void, unknown>

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

  private getIncalcableReason(envs: { type: string; version: string; buildDate?: Date }[]): string {
    const envMissingVersion = envs.find(env => !env.buildDate)
    if (envMissingVersion) {
      return `Build Version in correct format: ${envMissingVersion.version}`
    }
    const missingDev = !envs.find(({ type }) => type === 'dev')
    if (missingDev) {
      return 'Missing Dev Environment'
    }
    return undefined
  }

  async getComponentsWeCannotCalculateHealthFor(): Promise<ComponentAndReason[]> {
    const versionDetailsByComponent = await this.getVersionDetailsByComponent()
    const allComponents = await this.serviceCatalogueService.getComponents()

    const componentsMissingHealth = allComponents
      .filter(
        component =>
          (component.attributes.api || component.attributes.frontend) &&
          !versionDetailsByComponent[component.attributes.name],
      )
      .map(component => ({
        component: component.attributes.name,
        reason: 'Missing version info in redis',
      }))

    const componentsWithReasons = Object.entries(versionDetailsByComponent).flatMap(([name, envs]) => {
      const reason = this.getIncalcableReason(envs)
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

  async getDriftData(componentNames: string[]) {
    const versionDetailsByComponent = await this.getVersionDetailsByComponent()
    const allComponents = await this.serviceCatalogueService.getComponents()
    const components = allComponents
      .filter(component => componentNames.includes(component.attributes.name))
      .map(component => {
        const driftData = this.toComponentView(
          component.attributes,
          versionDetailsByComponent[component.attributes.name],
        )
        return driftData
      })
      .filter(component => component?.environments.length)

    return components
  }

  toComponentView = (component: Component, versionDetails: VersionDetails[]) => {
    const versionDetailByEnv = associateBy(versionDetails, details => details.type)

    const environmentsWithVersions = component.environments
      .map(env => {
        if (!versionDetailByEnv[env.name]) {
          return undefined
        }
        const { buildDate, dateAdded, sha, version } = versionDetailByEnv[env.name]
        return {
          name: env.name,
          buildDate,
          dateAdded,
          sha,
          version,
          type: env.type,
          componentName: component.name,
        }
      })
      .filter(env => env)

    const reason = this.getIncalcableReason(environmentsWithVersions)
    if (reason) {
      return undefined
    }

    const latestDevEnvironment = environmentsWithVersions
      .filter(env => env.type === 'dev')
      .sort((e1, e2) => e2.buildDate.getTime() - e1.buildDate.getTime())[0]

    const earliestProdEnvironment = environmentsWithVersions
      .filter(env => env.type === 'prod')
      .sort((e1, e2) => e1.buildDate.getTime() - e2.buildDate.getTime())[0]

    return {
      name: component.name,
      devEnvSha: latestDevEnvironment?.sha,
      drift: differenceInDate(latestDevEnvironment?.buildDate, earliestProdEnvironment?.buildDate),
      staleness: differenceInDate(new Date(), latestDevEnvironment?.buildDate),
      environments: environmentsWithVersions,
    }
  }
}
