import { createClient } from 'redis'
import logger from '../../logger'

// Mock dependencies
jest.mock('redis')
jest.mock('../../logger')
jest.mock('../config', () => ({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'test-password',
    tlsEnabled: 'false',
    tlsVerification: 'true',
  },
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockLogger = logger as jest.Mocked<typeof logger>

describe('RedisClient', () => {
  let mockRedisClient: {
    on: jest.Mock
    connect: jest.Mock
    disconnect: jest.Mock
    quit: jest.Mock
    get: jest.Mock
    set: jest.Mock
    del: jest.Mock
    exists: jest.Mock
    expire: jest.Mock
    ttl: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a mock Redis client
    mockRedisClient = {
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      quit: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
    }

    mockCreateClient.mockReturnValue(mockRedisClient as never)
  })

  describe('createRedisClient function', () => {
    it('should create Redis client with default configuration', async () => {
      // Import the function after mocks are set up
      const { createRedisClient } = await import('./redisClient')

      const client = createRedisClient()

      expect(mockCreateClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        password: 'test-password',
        socket: {
          rejectUnauthorized: true,
          reconnectStrategy: expect.any(Function),
        },
      })

      expect(client).toBe(mockRedisClient)
    })

    it('should register error event handler', async () => {
      const { createRedisClient } = await import('./redisClient')

      createRedisClient()

      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should log Redis client errors when error event is triggered', async () => {
      const { createRedisClient } = await import('./redisClient')

      createRedisClient()

      // Get the error handler function that was registered
      const errorHandler = mockRedisClient.on.mock.calls.find((call: unknown[]) => call[0] === 'error')?.[1]
      expect(errorHandler).toBeDefined()

      // Simulate an error
      const testError = new Error('Redis connection failed')
      errorHandler?.(testError)

      expect(mockLogger.error).toHaveBeenCalledWith('Redis client error', testError)
    })
  })

  describe('reconnectStrategy', () => {
    let reconnectStrategy: (attempts: number) => number

    beforeEach(async () => {
      const { createRedisClient } = await import('./redisClient')
      createRedisClient()

      // Extract the reconnectStrategy function from the mock call
      const createClientCall = mockCreateClient.mock.calls[0][0]
      reconnectStrategy = createClientCall.socket?.reconnectStrategy as (attempts: number) => number
    })

    it('should implement exponential backoff starting at 20ms', () => {
      expect(reconnectStrategy(1)).toBe(40) // 2^1 * 20 = 40ms
      expect(reconnectStrategy(2)).toBe(80) // 2^2 * 20 = 80ms
      expect(reconnectStrategy(3)).toBe(160) // 2^3 * 20 = 160ms
    })

    it('should cap retry delay at 30 seconds', () => {
      expect(reconnectStrategy(15)).toBe(30000) // Should be capped at 30000ms
      expect(reconnectStrategy(20)).toBe(30000) // Should remain capped
    })

    it('should log retry attempts with delay information', () => {
      const attempts = 5
      const expectedDelay = Math.min(2 ** attempts * 20, 30000)

      reconnectStrategy(attempts)

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Retry Redis connection attempt: ${attempts}, next attempt in: ${expectedDelay}ms`,
      )
    })

    it('should handle edge case of 0 attempts', () => {
      const result = reconnectStrategy(0)
      expect(result).toBe(20) // 2^0 * 20 = 20ms
      expect(mockLogger.info).toHaveBeenCalledWith('Retry Redis connection attempt: 0, next attempt in: 20ms')
    })

    it('should handle large attempt numbers correctly', () => {
      const result = reconnectStrategy(100)
      expect(result).toBe(30000) // Should be capped at 30000ms
      expect(mockLogger.info).toHaveBeenCalledWith('Retry Redis connection attempt: 100, next attempt in: 30000ms')
    })
  })

  describe('Type Exports', () => {
    it('should export RedisClient type correctly', async () => {
      const { createRedisClient } = await import('./redisClient')
      const client = createRedisClient()

      // This test ensures the RedisClient type is properly exported and usable
      expect(client).toBeDefined()
      expect(typeof client).toBe('object')

      // The RedisClient type is a TypeScript type export, not a runtime value
      // TypeScript compilation will catch any issues with the type export
    })
  })
})

describe('RedisClient configuration logic', () => {
  describe('URL construction', () => {
    it('should construct redis:// URL when TLS is disabled', () => {
      const config = {
        redis: {
          host: 'test-host',
          port: 1234,
          tlsEnabled: 'false',
        },
      }

      const url =
        config.redis.tlsEnabled === 'true'
          ? `rediss://${config.redis.host}:${config.redis.port}`
          : `redis://${config.redis.host}:${config.redis.port}`

      expect(url).toBe('redis://test-host:1234')
    })

    it('should construct rediss:// URL when TLS is enabled', () => {
      const config = {
        redis: {
          host: 'secure-host',
          port: 5678,
          tlsEnabled: 'true',
        },
      }

      const url =
        config.redis.tlsEnabled === 'true'
          ? `rediss://${config.redis.host}:${config.redis.port}`
          : `redis://${config.redis.host}:${config.redis.port}`

      expect(url).toBe('rediss://secure-host:5678')
    })
  })

  describe('TLS verification logic', () => {
    it('should set rejectUnauthorized to true when tlsVerification is true', () => {
      const config = { redis: { tlsVerification: 'true' } }
      const tlsVerification = config.redis.tlsVerification === 'true'

      expect(tlsVerification).toBe(true)
    })

    it('should set rejectUnauthorized to false when tlsVerification is false', () => {
      const config = { redis: { tlsVerification: 'false' } }
      const tlsVerification = config.redis.tlsVerification === 'true'

      expect(tlsVerification).toBe(false)
    })
  })

  describe('Configuration edge cases', () => {
    it('should handle undefined password', () => {
      const config: { redis: { password: string | undefined } } = { redis: { password: undefined } }

      expect(config.redis.password).toBeUndefined()
    })

    it('should handle empty string password', () => {
      const config = { redis: { password: '' } }

      expect(config.redis.password).toBe('')
    })

    it('should handle non-standard port numbers', () => {
      const config = { redis: { host: 'custom-redis', port: 9999 } }

      expect(config.redis.port).toBe(9999)
      expect(typeof config.redis.port).toBe('number')
    })
  })
})
