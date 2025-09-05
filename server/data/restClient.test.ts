import { Readable } from 'stream'
import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import RestClient from './restClient'
import logger from '../../logger'
import sanitiseError from '../sanitisedError'
import { AgentConfig } from '../config'

// Mock dependencies
jest.mock('superagent')
jest.mock('agentkeepalive')
jest.mock('../../logger')
jest.mock('../sanitisedError')

const mockSuperagent = superagent as jest.Mocked<typeof superagent>
const mockAgent = Agent as jest.MockedClass<typeof Agent>
const mockHttpsAgent = HttpsAgent as jest.MockedClass<typeof HttpsAgent>
const mockLogger = logger as jest.Mocked<typeof logger>
const mockSanitiseError = sanitiseError as jest.MockedFunction<typeof sanitiseError>

interface MockRequest {
  get: jest.Mock
  post: jest.Mock
  send: jest.Mock
  agent: jest.Mock
  retry: jest.Mock
  query: jest.Mock
  auth: jest.Mock
  set: jest.Mock
  responseType: jest.Mock
  timeout: jest.Mock
  end: jest.Mock
  then: jest.Mock
  catch: jest.Mock
  mockResolvedValue: jest.Mock
  mockRejectedValue: jest.Mock
  mockResponse: unknown
  mockError: unknown
}

describe('RestClient', () => {
  let restClient: RestClient
  let mockAgentInstance: Agent
  let mockRequest: MockRequest

  const mockConfig = {
    url: 'https://api.example.com',
    timeout: { response: 5000, deadline: 10000 },
    agent: new AgentConfig(8000),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock agent instances
    mockAgentInstance = {
      destroy: jest.fn(),
    } as unknown as Agent

    mockAgent.mockImplementation(() => mockAgentInstance)
    mockHttpsAgent.mockImplementation(() => mockAgentInstance as never)

    // Create a chainable mock that can also be used as a Promise
    mockRequest = {
      get: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      agent: jest.fn().mockReturnThis(),
      retry: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      auth: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      responseType: jest.fn().mockReturnThis(),
      timeout: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(resolve => {
        // Call resolve immediately with the mock response
        return Promise.resolve().then(() => resolve(mockRequest.mockResponse || {}))
      }),
      catch: jest.fn().mockImplementation(() => Promise.resolve()),
      mockResolvedValue: jest.fn().mockImplementation(value => {
        mockRequest.mockResponse = value
        return mockRequest
      }),
      mockRejectedValue: jest.fn().mockImplementation(error => {
        mockRequest.mockError = error
        mockRequest.then = jest.fn().mockImplementation((resolve, reject) => {
          return Promise.resolve().then(() => reject && reject(error))
        })
        return mockRequest
      }),
      mockResponse: null,
      mockError: null,
    }

    mockSuperagent.get = jest.fn().mockReturnValue(mockRequest)
    mockSuperagent.post = jest.fn().mockReturnValue(mockRequest)

    restClient = new RestClient('test-api', mockConfig, 'test-token')
  })

  describe('constructor', () => {
    it('should create HTTPS agent for HTTPS URLs', () => {
      const httpsConfig = { ...mockConfig, url: 'https://secure.example.com' }
      const secureClient = new RestClient('secure-api', httpsConfig, 'token')
      expect(secureClient).toBeDefined()

      expect(mockHttpsAgent).toHaveBeenCalledWith(mockConfig.agent)
    })

    it('should create HTTP agent for HTTP URLs', () => {
      const httpConfig = { ...mockConfig, url: 'http://insecure.example.com' }
      const insecureClient = new RestClient('insecure-api', httpConfig, 'token')
      expect(insecureClient).toBeDefined()

      expect(mockAgent).toHaveBeenCalledWith(mockConfig.agent)
    })
  })

  describe('get method', () => {
    it('should make GET request with default parameters', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await restClient.get({ path: '/test' })

      expect(mockSuperagent.get).toHaveBeenCalledWith('https://api.example.com/test')
      expect(mockRequest.agent).toHaveBeenCalledWith(mockAgentInstance)
      expect(mockRequest.retry).toHaveBeenCalledWith(2, expect.any(Function))
      expect(mockRequest.query).toHaveBeenCalledWith('')
      expect(mockRequest.auth).toHaveBeenCalledWith('test-token', { type: 'bearer' })
      expect(mockRequest.set).toHaveBeenCalledWith({})
      expect(mockRequest.responseType).toHaveBeenCalledWith('')
      expect(mockRequest.timeout).toHaveBeenCalledWith(mockConfig.timeout)
      expect(result).toEqual({ data: 'test' })
    })

    it('should make GET request with custom parameters', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      const requestParams = {
        path: '/users',
        query: 'limit=10&offset=0',
        headers: { 'Custom-Header': 'value' },
        responseType: 'json',
      }

      await restClient.get(requestParams)

      expect(mockSuperagent.get).toHaveBeenCalledWith('https://api.example.com/users')
      expect(mockRequest.query).toHaveBeenCalledWith('limit=10&offset=0')
      expect(mockRequest.set).toHaveBeenCalledWith({ 'Custom-Header': 'value' })
      expect(mockRequest.responseType).toHaveBeenCalledWith('json')
    })

    it('should return raw response when raw flag is true', async () => {
      const mockResponse = { body: { data: 'test' }, status: 200, headers: {} }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await restClient.get({ path: '/test', raw: true })

      expect(result).toBe(mockResponse)
    })

    it('should log the request', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.get({ path: '/test', query: 'param=value' })

      expect(mockLogger.info).toHaveBeenCalledWith('Get calling test-api: /test param=value')
    })

    it('should handle and log errors', async () => {
      const error = new Error('Network error')
      const sanitisedError = { message: 'Sanitised error', status: 500, stack: 'error stack' }
      mockRequest.mockRejectedValue(error)
      mockSanitiseError.mockReturnValue(sanitisedError)

      await expect(restClient.get({ path: '/test', query: 'param=value' })).rejects.toEqual(sanitisedError)

      expect(mockSanitiseError).toHaveBeenCalledWith(error)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { ...sanitisedError, query: 'param=value' },
        "Error calling test-api, path: '/test', verb: 'GET'",
      )
    })

    it('should configure retry handler correctly', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.get({ path: '/test' })

      // Get the retry handler function
      const retryHandler = mockRequest.retry.mock.calls[0][1]

      // Test retry handler with error
      const retryError = { code: 'ECONNRESET', message: 'Connection reset' }
      const result = retryHandler(retryError, null)

      expect(mockLogger.info).toHaveBeenCalledWith('Retry handler found API error with ECONNRESET Connection reset')
      expect(result).toBeUndefined()
    })

    it('should handle null path correctly', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.get({ path: null })

      expect(mockSuperagent.get).toHaveBeenCalledWith('https://api.example.comnull')
    })
  })

  describe('post method', () => {
    it('should make POST request with default parameters', async () => {
      const mockResponse = { body: { id: 1, created: true } }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await restClient.post()

      expect(mockSuperagent.post).toHaveBeenCalledWith('https://api.example.comnull')
      expect(mockRequest.send).toHaveBeenCalledWith({})
      expect(mockRequest.agent).toHaveBeenCalledWith(mockAgentInstance)
      expect(mockRequest.retry).toHaveBeenCalledWith(2, expect.any(Function))
      expect(mockRequest.auth).toHaveBeenCalledWith('test-token', { type: 'bearer' })
      expect(mockRequest.set).toHaveBeenCalledWith({})
      expect(mockRequest.responseType).toHaveBeenCalledWith('')
      expect(mockRequest.timeout).toHaveBeenCalledWith(mockConfig.timeout)
      expect(result).toEqual({ id: 1, created: true })
    })

    it('should make POST request with custom parameters', async () => {
      const mockResponse = { body: { id: 1, created: true } }
      mockRequest.mockResolvedValue(mockResponse)

      const requestParams = {
        path: '/users',
        headers: { 'Content-Type': 'application/json' },
        responseType: 'json',
        data: { name: 'John', email: 'john@example.com' },
      }

      await restClient.post(requestParams)

      expect(mockSuperagent.post).toHaveBeenCalledWith('https://api.example.com/users')
      expect(mockRequest.send).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' })
      expect(mockRequest.set).toHaveBeenCalledWith({ 'Content-Type': 'application/json' })
      expect(mockRequest.responseType).toHaveBeenCalledWith('json')
    })

    it('should return raw response when raw flag is true', async () => {
      const mockResponse = { body: { id: 1 }, status: 201, headers: {} }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await restClient.post({ raw: true })

      expect(result).toBe(mockResponse)
    })

    it('should log the request', async () => {
      const mockResponse = { body: { id: 1 } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.post({ path: '/users' })

      expect(mockLogger.info).toHaveBeenCalledWith('Post calling test-api: /users')
    })

    it('should handle and log errors', async () => {
      const error = new Error('Validation error')
      const sanitisedError = { message: 'Sanitised validation error', status: 400, stack: 'error stack' }
      mockRequest.mockRejectedValue(error)
      mockSanitiseError.mockReturnValue(sanitisedError)

      await expect(restClient.post({ path: '/users' })).rejects.toEqual(sanitisedError)

      expect(mockSanitiseError).toHaveBeenCalledWith(error)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        sanitisedError,
        "Error calling test-api, path: '/users', verb: 'POST'",
      )
    })

    it('should configure retry handler correctly', async () => {
      const mockResponse = { body: { id: 1 } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.post({ path: '/users' })

      // Get the retry handler function
      const retryHandler = mockRequest.retry.mock.calls[0][1]

      // Test retry handler with error
      const retryError = { code: 'ETIMEDOUT', message: 'Request timeout' }
      const result = retryHandler(retryError, null)

      expect(mockLogger.info).toHaveBeenCalledWith('Retry handler found API error with ETIMEDOUT Request timeout')
      expect(result).toBeUndefined()
    })
  })

  describe('stream method', () => {
    it('should create a stream for successful response', async () => {
      const mockResponseBody = 'streaming data content'

      // Mock the end callback to simulate successful response
      mockRequest.end.mockImplementation((callback: (error: unknown, response: unknown) => void) => {
        callback(null, { body: mockResponseBody })
      })

      const result = await restClient.stream({ path: '/download' })

      expect(mockSuperagent.get).toHaveBeenCalledWith('https://api.example.com/download')
      expect(mockRequest.agent).toHaveBeenCalledWith(mockAgentInstance)
      expect(mockRequest.auth).toHaveBeenCalledWith('test-token', { type: 'bearer' })
      expect(mockRequest.retry).toHaveBeenCalledWith(2, expect.any(Function))
      expect(mockRequest.timeout).toHaveBeenCalledWith(mockConfig.timeout)
      expect(mockRequest.set).toHaveBeenCalledWith({})

      // Verify it returns a Readable stream
      expect(result).toBeInstanceOf(Readable)
    })

    it('should handle streaming with custom headers', async () => {
      const mockResponseBody = 'streaming data'

      mockRequest.end.mockImplementation((callback: (error: unknown, response: unknown) => void) => {
        callback(null, { body: mockResponseBody })
      })

      await restClient.stream({
        path: '/export',
        headers: { Accept: 'application/octet-stream' },
      })

      expect(mockRequest.set).toHaveBeenCalledWith({ Accept: 'application/octet-stream' })
    })

    it('should log the streaming request', async () => {
      mockRequest.end.mockImplementation((callback: (error: unknown, response: unknown) => void) => {
        callback(null, { body: 'data' })
      })

      await restClient.stream({ path: '/stream' })

      expect(mockLogger.info).toHaveBeenCalledWith('Stream calling test-api: /stream')
    })

    it('should handle and log streaming errors', async () => {
      const error = new Error('Stream error')
      const sanitisedError = { message: 'Sanitised stream error', status: 500, stack: 'error stack' }
      mockSanitiseError.mockReturnValue(sanitisedError)

      mockRequest.end.mockImplementation((callback: (error: unknown, response: unknown) => void) => {
        callback(error, null)
      })

      await expect(restClient.stream({ path: '/stream' })).rejects.toEqual(error)

      expect(mockSanitiseError).toHaveBeenCalledWith(error)
      expect(mockLogger.warn).toHaveBeenCalledWith(sanitisedError, 'Error calling test-api')
    })

    it('should configure retry handler for streaming', async () => {
      mockRequest.end.mockImplementation((callback: (error: unknown, response: unknown) => void) => {
        callback(null, { body: 'data' })
      })

      await restClient.stream({ path: '/stream' })

      // Get the retry handler function
      const retryHandler = mockRequest.retry.mock.calls[0][1]

      // Test retry handler with error
      const retryError = { code: 'ENOTFOUND', message: 'Host not found' }
      const result = retryHandler(retryError, null)

      expect(mockLogger.info).toHaveBeenCalledWith('Retry handler found API error with ENOTFOUND Host not found')
      expect(result).toBeUndefined()
    })

    it('should handle null path in stream request', async () => {
      mockRequest.end.mockImplementation((callback: (error: unknown, response: unknown) => void) => {
        callback(null, { body: 'data' })
      })

      await restClient.stream({ path: null })

      expect(mockSuperagent.get).toHaveBeenCalledWith('https://api.example.comnull')
    })

    it('should handle empty response body in stream', async () => {
      mockRequest.end.mockImplementation((callback: (error: unknown, response: unknown) => void) => {
        callback(null, { body: null })
      })

      const result = await restClient.stream({ path: '/empty' })

      expect(result).toBeInstanceOf(Readable)
    })
  })

  describe('private methods', () => {
    it('should return correct API URL', () => {
      // Access private method through type assertion for testing
      const apiUrl = (restClient as unknown as { apiUrl: () => string }).apiUrl()
      expect(apiUrl).toBe('https://api.example.com')
    })

    it('should return correct timeout configuration', () => {
      // Access private method through type assertion for testing
      const timeoutConfig = (
        restClient as unknown as { timeoutConfig: () => { response: number; deadline: number } }
      ).timeoutConfig()
      expect(timeoutConfig).toEqual({ response: 5000, deadline: 10000 })
    })
  })

  describe('edge cases and error scenarios', () => {
    it('should handle retry handler without error', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.get({ path: '/test' })

      // Get the retry handler function
      const retryHandler = mockRequest.retry.mock.calls[0][1]

      // Test retry handler without error
      const result = retryHandler(null, null)

      expect(result).toBeUndefined()
      expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Retry handler found API error'))
    })

    it('should handle different agent configurations', () => {
      const agentConfig = new AgentConfig(5000)
      const customConfig = { ...mockConfig, agent: agentConfig }
      const customClient = new RestClient('custom-agent-api', customConfig, 'token')
      expect(customClient).toBeDefined()
      // Since mockConfig uses HTTPS URL, it should use HttpsAgent
      expect(mockHttpsAgent).toHaveBeenCalledWith(agentConfig)
    })

    it('should handle empty query string', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.get({ path: '/test', query: '' })

      expect(mockRequest.query).toHaveBeenCalledWith('')
    })

    it('should handle empty headers object', async () => {
      const mockResponse = { body: { data: 'test' } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.get({ path: '/test', headers: {} })

      expect(mockRequest.set).toHaveBeenCalledWith({})
    })

    it('should handle empty data object in POST', async () => {
      const mockResponse = { body: { id: 1 } }
      mockRequest.mockResolvedValue(mockResponse)

      await restClient.post({ path: '/test', data: {} })

      expect(mockRequest.send).toHaveBeenCalledWith({})
    })
  })
})
