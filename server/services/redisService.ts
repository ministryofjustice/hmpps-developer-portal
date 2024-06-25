import { ClientClosedError, commandOptions } from 'redis'

import logger from '../../logger'
import { RedisClient } from '../data/redisClient'
import { DependencyInfo } from '../data/dependencyInfoTypes'
import Dependencies from './Dependencies'

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

  async getAllDependencies(): Promise<Dependencies> {
    try {
      const result = (await this.redisClient.json.get(
        commandOptions({ isolated: true }),
        'dependency:info',
      )) as DependencyInfo
      return new Dependencies(result)
    } catch (error) {
      await this.handleError(error, 'Failed to get dependency info')
      throw error
    }
  }
}
