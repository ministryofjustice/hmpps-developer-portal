import { test } from '@playwright/test'
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
