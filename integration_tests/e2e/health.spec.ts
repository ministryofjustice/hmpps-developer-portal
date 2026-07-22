import { expect, test } from '@playwright/test'
import { resetStubs } from '../mockApis/wiremock'
import serviceCatalogue from '../mockApis/serviceCatalogue'
import alertManager from '../mockApis/alertManager'

type HealthResponse = {
  status: string
  components: Record<string, { status: string }>
}

type PingResponse = {
  status: string
}

test.describe('Healthcheck', () => {
  test.describe('All healthy', () => {
    test.beforeEach(async () => {
      await resetStubs()
      await serviceCatalogue.stubPing(204)
      await alertManager.stubPing(200)
    })

    test('Health check page is visible and UP', async ({ request }) => {
      const response = await request.get('/health')
      const body = (await response.json()) as HealthResponse

      expect(body.status).toBe('UP')
    })

    test('Health check page is visible and includes health of all services', async ({ request }) => {
      const response = await request.get('/health')
      const body = (await response.json()) as HealthResponse

      expect(Object.keys(body.components)).toHaveLength(2)
    })

    test('Health check page is visible and all services are UP', async ({ request }) => {
      const response = await request.get('/health')
      const body = (await response.json()) as HealthResponse

      expect(body.components.serviceCatalogue.status).toBe('UP')
      expect(body.components.alertManager.status).toBe('UP')
    })

    test('Ping is visible and UP', async ({ request }) => {
      const response = await request.get('/ping')
      const body = (await response.json()) as PingResponse

      expect(body.status).toBe('UP')
    })

    test('Info is visible', async ({ request }) => {
      const response = await request.get('/info')
      const body: unknown = await response.json()

      expect(body).toBeTruthy()
    })
  })

  test.describe('All unhealthy', () => {
    test.beforeEach(async () => {
      await resetStubs()
      await serviceCatalogue.stubPing(500)
      await alertManager.stubPing(500)
    })

    test('Health check page is visible and DOWN', async ({ request }) => {
      const response = await request.get('/health')
      const body = (await response.json()) as HealthResponse

      expect(body.status).toBe('DOWN')
    })

    test('Health check page is visible and all services are DOWN', async ({ request }) => {
      const response = await request.get('/health')
      const body = (await response.json()) as HealthResponse

      expect(body.components.serviceCatalogue.status).toBe('DOWN')
      expect(body.components.alertManager.status).toBe('DOWN')
    })

    test('Ping is visible and UP', async ({ request }) => {
      const response = await request.get('/ping')
      const body = (await response.json()) as PingResponse

      expect(body.status).toBe('UP')
    })

    test('Info is visible', async ({ request }) => {
      const response = await request.get('/info')
      const body: unknown = await response.json()

      expect(body).toBeTruthy()
    })
  })
})
