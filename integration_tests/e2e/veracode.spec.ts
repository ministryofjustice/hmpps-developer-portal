import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import VeracodePage from '../pages/veracode'

test.describe('Visit veracode scan page', () => {
  test('should load the home page and go to veracode page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.veracodeLink()

    await Page.verifyOnPage(VeracodePage, page)
  })
})
