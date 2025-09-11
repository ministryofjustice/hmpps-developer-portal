import nock from 'nock'
import RestClient from './restClient'
import { AgentConfig } from '../config'

const restClient = new RestClient(
  'Test API',
  { url: 'http://localhost:8080', timeout: { response: 5000, deadline: 10000 }, agent: new AgentConfig(8000) },
  'test-token-123',
)

describe('RestClient Tests', () => {
  afterEach(() => {
    jest.resetAllMocks()
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('GET', () => {
    it('should return response body data only', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123', 'custom-header': 'value1' },
      })
        .get('/test?query1=value1')
        .reply(200, { success: true })

      const result = await restClient.get({
        path: '/test',
        query: 'query1=value1',
        headers: { 'custom-header': 'value1' },
      })

      expect(result).toEqual({ success: true })
    })

    it('should return raw response when raw flag is true', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .get('/test')
        .reply(200, { success: true })

      const result = await restClient.get({
        path: '/test',
        raw: true,
      })

      expect(result).toMatchObject({
        status: 200,
        text: '{"success":true}',
      })
    })

    it('should handle empty query string', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .get('/test')
        .reply(200, { data: 'test' })

      const result = await restClient.get({
        path: '/test',
        query: '',
      })

      expect(result).toEqual({ data: 'test' })
    })

    it('should throw error when bad response', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .get('/test')
        .reply(404, { error: 'Not found' })

      await expect(
        restClient.get({
          path: '/test',
        }),
      ).rejects.toMatchObject({
        status: 404,
        message: 'Not Found',
      })
    })

    it('should retry twice if request fails', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .get('/test')
        .reply(500, { failure: 'one' })
        .get('/test')
        .reply(500, { failure: 'two' })
        .get('/test')
        .reply(200, { success: true })

      const result = await restClient.get({
        path: '/test',
      })

      expect(result).toEqual({ success: true })
    })
  })

  describe('POST', () => {
    it('should return response body data only', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123', 'content-type': 'application/json' },
      })
        .post('/users', { name: 'John', email: 'john@example.com' })
        .reply(201, { id: 1, created: true })

      const result = await restClient.post({
        path: '/users',
        headers: { 'content-type': 'application/json' },
        data: { name: 'John', email: 'john@example.com' },
      })

      expect(result).toEqual({ id: 1, created: true })
    })

    it('should return raw response when raw flag is true', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .post('/users', { name: 'Jane' })
        .reply(201, { id: 2, created: true })

      const result = await restClient.post({
        path: '/users',
        data: { name: 'Jane' },
        raw: true,
      })

      expect(result).toMatchObject({
        status: 201,
        text: '{"id":2,"created":true}',
      })
    })

    it('should handle empty data object', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .post('/test', {})
        .reply(200, { success: true })

      const result = await restClient.post({
        path: '/test',
        data: {},
      })

      expect(result).toEqual({ success: true })
    })

    it('should throw error when bad response', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .post('/users', { name: 'Invalid' })
        .reply(400, { error: 'Validation failed' })

      await expect(
        restClient.post({
          path: '/users',
          data: { name: 'Invalid' },
        }),
      ).rejects.toMatchObject({
        status: 400,
        message: 'Bad Request',
      })
    })
  })

  describe('STREAM', () => {
    it('should throw error when bad response', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer test-token-123' },
      })
        .get('/stream')
        .reply(404, { error: 'Stream not found' })

      await expect(
        restClient.stream({
          path: '/stream',
        }),
      ).rejects.toMatchObject({
        status: 404,
        message: 'Not Found',
      })
    })
  })
})
