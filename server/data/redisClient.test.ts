import { ClientClosedError } from 'redis'
import RedisService from '../services/redisService'

// Define only the Redis client methods we need for testing
interface MockableRedisClient {
  connect: jest.Mock
  disconnect: jest.Mock
  quit: jest.Mock
  on: jest.Mock
  xRead: jest.Mock
  json: {
    get: jest.Mock
  }
}

describe('RedisService Integration Tests', () => {
  let redisService: RedisService
  let mockRedisClient: jest.Mocked<MockableRedisClient>

  beforeEach(() => {
    jest.clearAllMocks()

    mockRedisClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
      xRead: jest.fn(),
      json: {
        get: jest.fn(),
      },
    } as jest.Mocked<MockableRedisClient>

    redisService = new RedisService(mockRedisClient as never)
  })

  describe('readStream', () => {
    it('should successfully read from Redis stream', async () => {
      const mockStreamData = [
        {
          name: 'test-stream',
          messages: [
            {
              id: '1234567890-0',
              message: { field1: 'value1', field2: 'value2' },
            },
          ],
        },
      ]

      mockRedisClient.xRead.mockResolvedValue(mockStreamData)

      const result = await redisService.readStream([{ key: 'test-stream', id: '0' }])

      expect(mockRedisClient.xRead).toHaveBeenCalledWith(expect.objectContaining({ isolated: true }), [
        { key: 'test-stream', id: '0' },
      ])
      expect(result).toBe(JSON.stringify(mockStreamData))
    })

    it('should return empty array when no stream data available', async () => {
      mockRedisClient.xRead.mockResolvedValue(null)

      const result = await redisService.readStream([{ key: 'empty-stream', id: '0' }])

      expect(result).toBe('[]')
    })

    it('should handle Redis stream read errors', async () => {
      const error = new Error('Stream read failed')
      mockRedisClient.xRead.mockRejectedValue(error)

      await expect(redisService.readStream([{ key: 'failing-stream', id: '0' }])).rejects.toThrow('Stream read failed')
    })

    it('should handle ClientClosedError and attempt reconnection', async () => {
      const clientClosedError = new ClientClosedError()
      mockRedisClient.xRead.mockRejectedValue(clientClosedError)

      await expect(redisService.readStream([{ key: 'test-stream', id: '0' }])).rejects.toThrow()
    })
  })

  describe('readLatest', () => {
    it('should successfully read latest version data', async () => {
      const mockRedisData = {
        'component:some-service:dev': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'component:some-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
      }

      mockRedisClient.json.get.mockResolvedValue(mockRedisData)

      const result = await redisService.readLatest('component:latest')

      expect(mockRedisClient.json.get).toHaveBeenCalledWith(
        expect.objectContaining({ isolated: true }),
        'component:latest',
      )
      expect(result).toEqual({
        'some-service:dev': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'some-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
      })
    })

    it('should handle empty Redis response', async () => {
      mockRedisClient.json.get.mockResolvedValue({})

      const result = await redisService.readLatest('empty-key')

      expect(result).toEqual({})
    })

    it('should handle Redis read errors', async () => {
      const error = new Error('Redis connection timeout')
      mockRedisClient.json.get.mockRejectedValue(error)

      await expect(redisService.readLatest('failing-key')).rejects.toThrow('Redis connection timeout')
    })
  })

  describe('getAllDependencies', () => {
    it('should successfully retrieve dependency information', async () => {
      const mockDependencyInfo = {
        components: {
          'service-a': {
            dependencies: ['service-b', 'database-x'],
            dependents: ['service-c'],
          },
          'service-b': {
            dependencies: ['database-y'],
            dependents: ['service-a'],
          },
        },
      }

      mockRedisClient.json.get.mockResolvedValue(mockDependencyInfo)

      const result = await redisService.getAllDependencies()

      expect(mockRedisClient.json.get).toHaveBeenCalledWith(
        expect.objectContaining({ isolated: true }),
        'dependency:info',
      )
      expect(result).toBeDefined()
      // Dependencies class constructor is called with the mock data
    })

    it('should handle dependency retrieval errors', async () => {
      const error = new Error('Failed to fetch dependencies')
      mockRedisClient.json.get.mockRejectedValue(error)

      await expect(redisService.getAllDependencies()).rejects.toThrow('Failed to fetch dependencies')
    })
  })

  describe('handleError', () => {
    it('should handle ClientClosedError specifically', async () => {
      const clientClosedError = new ClientClosedError()

      await redisService.handleError(clientClosedError, 'Test operation failed')
    })

    it('should handle generic errors', async () => {
      const genericError = new Error('Generic Redis error')

      await redisService.handleError(genericError, 'Generic operation failed')
    })
  })

  describe('Real-world usage scenarios', () => {
    it('should handle version data parsing correctly', async () => {
      const realVersionData = {
        'component:hmpps-auth:dev': { v: '2023-12-01.456.def5678', dateAdded: '2023-12-01T10:30:00Z' },
        'component:hmpps-auth:preprod': { v: '2023-12-01.456.def5678', dateAdded: '2023-12-01T10:30:00Z' },
        'component:hmpps-auth:prod': { v: '2023-11-28.450.abc1234', dateAdded: '2023-11-28T14:22:00Z' },
      }

      mockRedisClient.json.get.mockResolvedValue(realVersionData)

      const result = await redisService.readLatest('component:latest')

      expect(result).toEqual({
        'hmpps-auth:dev': { v: '2023-12-01.456.def5678', dateAdded: '2023-12-01T10:30:00Z' },
        'hmpps-auth:preprod': { v: '2023-12-01.456.def5678', dateAdded: '2023-12-01T10:30:00Z' },
        'hmpps-auth:prod': { v: '2023-11-28.450.abc1234', dateAdded: '2023-11-28T14:22:00Z' },
      })
    })
  })
})
