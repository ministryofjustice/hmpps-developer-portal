import { ClientClosedError, commandOptions } from 'redis'
import logger from '../../logger'
import { RedisClient } from '../data/redisClient'

export type RedisStreamMessage = Awaited<ReturnType<RedisClient['xRead']>>[number]['messages'][number]
export type AsyncRedisStreamGenerator = AsyncGenerator<RedisStreamMessage, void, unknown>

export default class RedisService {
  private isAlive = true

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
}
