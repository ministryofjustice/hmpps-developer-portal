import { ClientClosedError, commandOptions } from 'redis'
import logger from '../../logger'
import { RedisClient } from '../data/redisClient'

export type RedisStreamMessage = Awaited<ReturnType<RedisClient['xRead']>>[number]['messages'][number]
export type AsyncRedisStreamGenerator = AsyncGenerator<RedisStreamMessage, void, unknown>

export default class RedisService {
  constructor(private readonly redisClient: RedisClient) {}

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
      if (error instanceof ClientClosedError) {
        logger.error(`${error.message} ...RECONNECTING`)
        await this.redisClient.connect
        return null
      }
      logger.error(`Failed to xRead from Redis Stream: ${error.message}`, error)
      return null
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
      if (error instanceof ClientClosedError) {
        logger.error(`${error.message} ...RECONNECTING`)
        await this.redisClient.connect
        return null
      }
      logger.error(`Failed to json.get: ${error.message}`, error)
      return null
    }
  }
}
