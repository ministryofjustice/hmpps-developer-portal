import { expect, test } from '@playwright/test'
import Page from '../pages/page'
import ComponentRequestsPage from '../pages/componentRequests'

test.describe('Component Requests table', () => {
  test('should render all component requests when table loads', async ({ page }) => {
    await page.goto('/component-requests')
    const componentRequestsPage = await Page.verifyOnPage(ComponentRequestsPage, page)

    await expect(componentRequestsPage.componentRequestLinks()).toHaveCount(3)
    await expect(page.locator('[href="/component-requests/hmpps-synthetic-service/Add"]')).toBeVisible()
    await expect(page.locator('[href="/component-requests/hmpps-synthetic-worker/Archive"]')).toBeVisible()
  })

  test('should filter rows when typing in component name column search', async ({ page }) => {
    await page.goto('/component-requests')
    const componentRequestsPage = await Page.verifyOnPage(ComponentRequestsPage, page)
    await expect(componentRequestsPage.componentRequestLinks()).toHaveCount(3)

    await componentRequestsPage.searchComponentName('worker')

    await expect(componentRequestsPage.componentRequestLinks()).toHaveText(['hmpps-synthetic-worker'])

    await componentRequestsPage.clearComponentNameSearch()
    await expect(componentRequestsPage.componentRequestLinks()).toHaveCount(3)
  })
})
