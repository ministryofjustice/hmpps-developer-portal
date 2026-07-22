import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import NamespacesPage from '../pages/namespaces'

test.describe('Visit Namespaces Page', () => {
  test('should load the home page and go to the namespaces page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.namespacesLink()

    await Page.verifyOnPage(NamespacesPage, page)
  })
})

test.describe('Namespaces table', () => {
  test('should render all namespaces when table loads', async ({ page }) => {
    await page.goto('/namespaces')
    const namespacesPage = await Page.verifyOnPage(NamespacesPage, page)

    await expect(namespacesPage.namespaceLinks()).toHaveText(['hmpps-developer-portal-dev'])
    await expect(namespacesPage.namespaceLinks()).toHaveAttribute('href', '/namespaces/hmpps-developer-portal-dev')
    await expect(
      page.locator('[href="/namespaces/hmpps-developer-portal-dev/rds-instance/developer_portal_rds"]'),
    ).toBeVisible()
  })

  test('should filter rows when typing in name column search', async ({ page }) => {
    await page.goto('/namespaces')
    const namespacesPage = await Page.verifyOnPage(NamespacesPage, page)
    await expect(namespacesPage.namespaceLinks()).toHaveCount(1)

    await namespacesPage.searchName('zzz-no-such-namespace')

    await expect(namespacesPage.namespaceLinks()).toHaveCount(0)

    await namespacesPage.clearNameSearch()
    await expect(namespacesPage.namespaceLinks()).toHaveCount(1)
  })
})
