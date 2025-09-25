import RedisService from '../services/redisService'
import { createRedisClient } from './redisClient'

const mockRedisClient = {
  xRead: jest.fn(),
  json: { get: jest.fn() },
}

jest.mock('./redisClient', () => ({
  createRedisClient: jest.fn(() => mockRedisClient),
}))

describe('RedisService Integration Tests', () => {
  let redisService: RedisService

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedisClient.xRead.mockReset()
    mockRedisClient.json.get.mockReset()

    redisService = new RedisService(createRedisClient())
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
  })

  describe('readLatest', () => {
    it('should successfully read latest version data', async () => {
      const mockRedisData = {
        'component:some-service:dev': { v: '2023-02-02.123.abc1234', dateAdded: '2023-02-11' },
        'component:some-service:prod': { v: '2023-01-15.120.abc1230', dateAdded: '2023-02-11' },
      }

      jest.mocked(mockRedisClient.json.get).mockResolvedValue(mockRedisData)

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
      jest.mocked(mockRedisClient.json.get).mockResolvedValue({})

      const result = await redisService.readLatest('empty-key')

      expect(result).toEqual({})
    })

    it('should handle Redis read errors', async () => {
      const error = new Error('Redis connection timeout')
      jest.mocked(mockRedisClient.json.get).mockRejectedValue(error)

      await expect(redisService.readLatest('failing-key')).rejects.toThrow('Redis connection timeout')
    })
  })

  describe('getAllDependencies', () => {
    it('should handle dependency retrieval errors', async () => {
      const error = new Error('Failed to fetch dependencies')
      jest.mocked(mockRedisClient.json.get).mockRejectedValue(error)

      await expect(redisService.getAllDependencies()).rejects.toThrow('Failed to fetch dependencies')
    })
  })
})
