import { expect, test } from '@playwright/test'
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

test.describe('RDS Instances table', () => {
  test('should render all rds instances when table loads', async ({ page }) => {
    await page.goto('/reports/rds')
    const rdsPage = await Page.verifyOnPage(RdsPage, page)

    await expect(rdsPage.rdsInstanceLinks()).toHaveText(['developer_portal_rds'])
    await expect(rdsPage.rdsInstanceLinks()).toHaveAttribute(
      'href',
      '/namespaces/hmpps-developer-portal-dev/rds-instance/developer_portal_rds',
    )
  })

  test('should filter rows when typing in label column search', async ({ page }) => {
    await page.goto('/reports/rds')
    const rdsPage = await Page.verifyOnPage(RdsPage, page)
    await expect(rdsPage.rdsInstanceLinks()).toHaveCount(1)

    await rdsPage.searchLabel('zzz-no-such-rds')

    await expect(rdsPage.rdsInstanceLinks()).toHaveCount(0)

    await rdsPage.clearLabelSearch()
    await expect(rdsPage.rdsInstanceLinks()).toHaveCount(1)
  })
})
