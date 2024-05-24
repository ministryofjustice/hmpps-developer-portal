import { ClientClosedError, commandOptions } from 'redis'

import logger from '../../logger'
import { RedisClient } from '../data/redisClient'
import { DependencyInfo } from '../data/dependencyInfoTypes'

export type RedisStreamMessage = Awaited<ReturnType<RedisClient['xRead']>>[number]['messages'][number]
export type AsyncRedisStreamGenerator = AsyncGenerator<RedisStreamMessage, void, unknown>

export default class RedisService {
  constructor(private readonly redisClient: RedisClient) {}

  async handleError(error: Error, message: string): Promise<void> {
    if (error instanceof ClientClosedError) {
      logger.error(`${error.message} ...RECONNECTING`)
      await this.redisClient.connect
    }
    logger.error(`${message}: ${error.message}`, error)
  }

  async readStream(
    streamDetails: {
      key: string
      id: string
    }[],
  ): Promise<string> {
    try {
      const response = await this.redisClient.xRead(
        commandOptions({ isolated: true }), // uses new connection from pool not to block other redis calls
        streamDetails,
      )

      return response ? JSON.stringify(response) : '[]'
    } catch (error) {
      await this.handleError(error, 'Failed to xRead from Redis Stream')
      throw error
    }
  }

  async readLatest(redisKey: string): Promise<Record<string, Record<string, string>>> {
    try {
      const result = await this.redisClient.json.get(commandOptions({ isolated: true }), redisKey)
      const entries = Object.entries(result).map(
        ([key, value]) => [key.substring(key.indexOf(':') + 1), value] as [string, Record<string, string>],
      )
      return Object.fromEntries(entries)
    } catch (error) {
      await this.handleError(error, 'Failed to read latest')
      throw error
    }
  }

  async getDependencies(
    componentName: string,
  ): Promise<{ categories: string[]; dependencies: Record<string, boolean>; dependents: Record<string, boolean> }> {
    try {
      const result = (await this.redisClient.json.get(
        commandOptions({ isolated: true }),
        'dependency:info',
      )) as DependencyInfo

      const dependencyInfo = Object.values(result).flatMap(env =>
        env.componentDependencyInfo[componentName] ? [env.componentDependencyInfo[componentName]] : [],
      )

      const categories = dependencyInfo.flatMap(component => component.dependencies?.categories)
      const dependencies = dependencyInfo
        .flatMap(component => {
          const known = component.dependencies?.components ? component.dependencies.components.map(d => [d, true]) : []
          const unknown = (component.dependencies?.other || [])
            .filter(d => !d.name.toLowerCase().includes('localhost') && d.name !== 'Http')
            .map(d => [d.name, false])
          return known.concat(unknown) as [[name: string, known: boolean]]
        })
        .sort(([a], [b]) => a.localeCompare(b))

      const dependents = dependencyInfo
        .flatMap(component => component.dependents)
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce(
          (acc, component) => {
            acc[component.name] = acc[component.name] || component.isKnownComponent
            return acc
          },
          {} as Record<string, boolean>,
        )

      return {
        categories: Array.from(new Set(categories)),
        dependencies: Object.fromEntries(dependencies),
        dependents,
      }
    } catch (error) {
      await this.handleError(error, 'Failed to get dependency info')
      throw error
    }
  }
}
