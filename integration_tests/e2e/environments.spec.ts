import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import EnvironmentsPage from '../pages/environments'
import EnvironmentPage from '../pages/environment'
import redis from '../mockApis/redis'

test.describe('Visit Environments Page', () => {
  test('should load the home page, go to environments page, click the first environment link and visit that page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.environmentsLink()

    const environmentsPage = await Page.verifyOnPage(EnvironmentsPage, page)
    const environmentName = await environmentsPage.environmentLink()
    await Page.verifyOnPage(EnvironmentPage, page, environmentName)
  })
})

test.describe('Environments table', () => {
  test('should render all environment rows when table loads', async ({ page }) => {
    await page.goto('/environments')
    const environmentsPage = await Page.verifyOnPage(EnvironmentsPage, page)

    await expect(environmentsPage.environmentLinks()).toHaveCount(6)
    await expect(
      page.locator('[data-test="environment"][href="/components/hmpps-developer-portal/environment/dev"]'),
    ).toBeVisible()
    await expect(
      page.locator('[data-test="environment"][href="/components/hmpps-developer-portal/environment/prod"]'),
    ).toBeVisible()
  })

  test('should filter rows when typing in environment column search', async ({ page }) => {
    await page.goto('/environments')
    const environmentsPage = await Page.verifyOnPage(EnvironmentsPage, page)
    await expect(environmentsPage.environmentLinks()).toHaveCount(6)

    await environmentsPage.searchEnvironment('prod')

    await expect(environmentsPage.environmentLinks()).toHaveCount(3)

    await environmentsPage.clearEnvironmentSearch()
    await expect(environmentsPage.environmentLinks()).toHaveCount(6)
  })
})

test.describe('Environment page', () => {
  test.beforeEach(async () => {
    await redis.seedStreams('hmpps-developer-portal', 'dev')
  })

  test('should show status version and health when stream data loads', async ({ page }) => {
    await page.goto('/components/hmpps-developer-portal/environment/dev')
    const environmentPage = await Page.verifyOnPage(EnvironmentPage, page, 'hmpps-developer-portal')

    await expect(environmentPage.statusTile('dev')).toHaveClass(/statusTileUp/, { timeout: 30000 })
    await expect(environmentPage.version('dev')).toHaveText('2026-07-15.1.abcdef0')
    await expect(environmentPage.healthRaw('dev')).toContainText('"status": "UP"')
  })

  test('should render health chart when stream has recent events', async ({ page }) => {
    await page.goto('/components/hmpps-developer-portal/environment/dev')
    const environmentPage = await Page.verifyOnPage(EnvironmentPage, page, 'hmpps-developer-portal')

    await expect(environmentPage.healthChart()).toBeVisible({ timeout: 30000 })
  })

  test('should update status when next poll reads new stream entry', async ({ page }) => {
    await page.goto('/components/hmpps-developer-portal/environment/dev')
    const environmentPage = await Page.verifyOnPage(EnvironmentPage, page, 'hmpps-developer-portal')
    await expect(environmentPage.statusTile('dev')).toHaveClass(/statusTileUp/, { timeout: 30000 })

    await redis.addHealthStreamEntry('hmpps-developer-portal', 'dev', '500', 'DOWN')

    await expect(environmentPage.statusTile('dev')).toHaveClass(/statusTileDown/, { timeout: 20000 })
  })
})
