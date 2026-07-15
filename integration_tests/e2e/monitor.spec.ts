import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import MonitorPage from '../pages/monitor'
import redis from '../mockApis/redis'

test.describe('Visit health monitor page', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should load the home page and go to health monitor page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.monitorLink()

    await Page.verifyOnPage(MonitorPage, page)
  })
})
