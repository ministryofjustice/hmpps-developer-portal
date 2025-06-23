import { ClientClosedError, RedisClientPoolType, RedisFunctions, RedisModules, RedisScripts, RespVersions } from 'redis'

import logger from '../../logger'
import { RedisClient } from '../data/redisClient'
import { DependencyInfo } from '../data/dependencyInfoTypes'
import Dependencies from './Dependencies'

export type RedisStreamMessage = Awaited<ReturnType<RedisClient['xRead']>>
export type AsyncRedisStreamGenerator = AsyncGenerator<RedisStreamMessage, void, unknown>

export type VersionDetails = {
  component: string
  env: string
  version: string
  buildDate: Date
  build: string
  sha: string
  dateAdded: Date
}

export default class RedisService {
  constructor(
    private readonly redisClientPool: RedisClientPoolType<
      RedisModules,
      RedisFunctions,
      RedisScripts,
      RespVersions,
      object
    >,
  ) {}

  async handleErrorPool(error: Error, message: string): Promise<void> {
    if (error instanceof ClientClosedError) {
      logger.error(`${error.message} ...RECONNECTING`)
      await this.redisClientPool.connect
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
      const response = await this.redisClientPool.xRead(streamDetails)

      return response ? JSON.stringify(response) : '[]'
    } catch (error) {
      await this.handleErrorPool(error, 'Failed to xRead from Redis Stream')
      throw error
    }
  }

  async readLatest(redisKey: string): Promise<Record<string, Record<string, string>>> {
    try {
      const result = await this.redisClientPool.json.get(redisKey)
      const entries = Object.entries(result).map(
        ([key, value]) => [key.substring(key.indexOf(':') + 1), value] as [string, Record<string, string>],
      )
      return Object.fromEntries(entries)
    } catch (error) {
      await this.handleErrorPool(error, 'Failed to read latest')
      throw error
    }
  }

  async getAllDependencies(): Promise<Dependencies> {
    try {
      const result = (await this.redisClientPool.json.get('dependency:info')) as DependencyInfo
      return new Dependencies(result)
    } catch (error) {
      await this.handleErrorPool(error, 'Failed to get dependency info')
      throw error
    }
  }
}
