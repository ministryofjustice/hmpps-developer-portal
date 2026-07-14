import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ProductDependenciesPage from '../pages/productDependencies'
import redis from '../mockApis/redis'

test.describe('Visit Product Dependencies page', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should load the home page and go to Product Dependencies page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.productDependenciesLink()

    await Page.verifyOnPage(ProductDependenciesPage, page)
  })
})
