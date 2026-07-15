import { test } from '@playwright/test'
import HomePage from '../pages/home'
import ServiceAreasPage from '../pages/serviceAreas'
import ServiceAreaPage from '../pages/serviceArea'
import Page from '../pages/page'

test.describe('Visit service area page for accommodation & interventions', () => {
  test('should load the home page, go to Service Areas, click on the top link for the Accommodation & Interventions page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.serviceAreasLink()

    const serviceAreasPage = await Page.verifyOnPage(ServiceAreasPage, page)
    await serviceAreasPage.serviceAreaNameLink()

    await Page.verifyOnPage(ServiceAreaPage, page, 'Accommodation & Interventions')
  })
})
