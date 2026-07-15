import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ProductSetsPage from '../pages/productSets'
import ProductSetPage from '../pages/productSet'

test.describe('Visit Product Sets Page', () => {
  test('should load the home page, go to Product Sets page, click the first product set link and visit that page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.productSetsLink()

    const productSetsPage = await Page.verifyOnPage(ProductSetsPage, page)
    const productSetName = await productSetsPage.productSetLink()
    await Page.verifyOnPage(ProductSetPage, page, productSetName)
  })
})
