import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import EnvironmentsPage from '../pages/environments'
import EnvironmentPage from '../pages/environment'

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
