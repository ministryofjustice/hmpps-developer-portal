import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import DriftRadiatorPage from '../pages/driftRadiator'
import redis from '../mockApis/redis'

test.describe('Visit Component Drift Page', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should load the home page and go to the drift radiator page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.componentDriftLink()

    await Page.verifyOnPage(DriftRadiatorPage, page)
  })
})
