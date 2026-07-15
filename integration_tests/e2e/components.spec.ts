import { test } from '@playwright/test'
import HomePage from '../pages/home'
import ComponentPage from '../pages/component'
import ComponentsPage from '../pages/components'
import Page from '../pages/page'
import redis from '../mockApis/redis'

test.describe('visit the accredited programmes and delius component page', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should load the home page, go to the components page, click on the first link(accredited programmes and delius), and go to that page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.componentsLink()

    const componentsPage = await Page.verifyOnPage(ComponentsPage, page)
    await componentsPage.componentLink()

    await Page.verifyOnPage(ComponentPage, page, 'accredited-programmes-and-delius')
  })
})
