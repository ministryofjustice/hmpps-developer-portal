import { test } from '@playwright/test'
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
