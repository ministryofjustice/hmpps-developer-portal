import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import RdsPage from '../pages/rds'
import RdsInstancePage from '../pages/rdsInstance'

test.describe('Visit RDS Page', () => {
  test('should load the home page, go to RDS page, click the first RDS instance link and visit that page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.rdsLink()

    const rdsPage = await Page.verifyOnPage(RdsPage, page)
    const rdsInstanceName = await rdsPage.rdsInstanceLink()
    await Page.verifyOnPage(RdsInstancePage, page, rdsInstanceName)
  })
})
