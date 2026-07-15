import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import AlertsPage from '../pages/alerts'

test.describe('Visit alerts scan page', () => {
  test('should load the home page and go to alerts page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.alertsLink()

    await Page.verifyOnPage(AlertsPage, page)
  })
})
