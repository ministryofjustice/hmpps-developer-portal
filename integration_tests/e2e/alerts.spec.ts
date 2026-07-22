import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import AlertsPage from '../pages/alerts'
import alertManager from '../mockApis/alertManager'
import { resetStubs } from '../mockApis/wiremock'

test.describe('Visit alerts scan page', () => {
  test('should load the home page and go to alerts page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.alertsLink()

    await Page.verifyOnPage(AlertsPage, page)
  })
})

test.describe('Alerts table', () => {
  test.beforeEach(async () => {
    await alertManager.stubAlerts(alertManager.buildAlerts())
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should render alert rows with status classes when data loads', async ({ page }) => {
    await page.goto('/alerts')
    const alertsPage = await Page.verifyOnPage(AlertsPage, page)

    const rows = alertsPage.alertRows()

    await expect(rows).toHaveCount(3)
    await expect(page.locator('#alertsTable tbody tr.active-alert')).toHaveCount(2)
    await expect(page.locator('#alertsTable tbody tr.silenced-alert')).toHaveCount(1)
    await expect(alertsPage.alertRow('HighCpuUsage').locator('td').nth(4)).toHaveText('#alpha-alerts')
    await expect(alertsPage.alertRow('DiskFull').locator('td').nth(4)).toHaveText('N/A')
  })

  test('should filter rows and update URL when application filter applied', async ({ page }) => {
    await page.goto('/alerts')
    const alertsPage = await Page.verifyOnPage(AlertsPage, page)
    await expect(alertsPage.alertRows()).toHaveCount(3)

    await alertsPage.selectApplication('app-alpha')
    await alertsPage.applyApplicationFilter()

    await expect(alertsPage.alertRows()).toHaveCount(1)
    await expect(alertsPage.alertRow('HighCpuUsage')).toBeVisible()
    await expect(page).toHaveURL(/application=app-alpha/)

    await alertsPage.resetFilters()
    await expect(alertsPage.alertRows()).toHaveCount(3)
    await expect(page).not.toHaveURL(/application=/)
  })

  test('should show new alert when five second poll refreshes', async ({ page }) => {
    await page.goto('/alerts')
    const alertsPage = await Page.verifyOnPage(AlertsPage, page)
    await expect(alertsPage.alertRows()).toHaveCount(3)

    await resetStubs()
    await alertManager.stubAlerts([
      ...alertManager.buildAlerts(),
      {
        startsAt: '2026-07-04T12:00:00.000Z',
        generatorURL: 'https://prometheus.example.gov.uk/alert/4',
        status: { state: 'active' },
        labels: {
          alertname: 'NewNetworkSpike',
          application: 'app-delta',
          environment: 'dev',
          namespace: 'ns-delta',
          severity: 'warning',
        },
        annotations: { message: 'Network spike detected' },
      },
    ])

    await expect(alertsPage.alertRow('NewNetworkSpike')).toBeVisible({ timeout: 10000 })
    await expect(alertsPage.alertRows()).toHaveCount(4)
  })
})
