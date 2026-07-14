import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ComponentDependenciesPage from '../pages/componentDependencies'

test.describe('Visit Component Dependencies page', () => {
  test('should load the home page and go to component dependencies page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.componentDependenciesLink()

    await Page.verifyOnPage(ComponentDependenciesPage, page)
  })
})
