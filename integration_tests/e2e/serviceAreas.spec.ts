import { expect, test } from '@playwright/test'
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

test.describe('Service Areas table', () => {
  test('should render all service areas when table loads', async ({ page }) => {
    await page.goto('/service-areas')
    const serviceAreasPage = await Page.verifyOnPage(ServiceAreasPage, page)

    await expect(serviceAreasPage.serviceAreaNameLinks()).toHaveText(['Accommodation & Interventions'])
    await expect(serviceAreasPage.serviceAreaNameLinks()).toHaveAttribute(
      'href',
      '/service-areas/accommodation-and-interventions',
    )
  })

  test('should filter rows when typing in name column search', async ({ page }) => {
    await page.goto('/service-areas')
    const serviceAreasPage = await Page.verifyOnPage(ServiceAreasPage, page)
    await expect(serviceAreasPage.serviceAreaNameLinks()).toHaveCount(1)

    await serviceAreasPage.searchName('zzz-no-such-service-area')

    await expect(serviceAreasPage.serviceAreaNameLinks()).toHaveCount(0)

    await serviceAreasPage.clearNameSearch()
    await expect(serviceAreasPage.serviceAreaNameLinks()).toHaveCount(1)
  })
})
