import { expect, test } from '@playwright/test'
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

test.describe('Product Sets table', () => {
  test('should render all product sets when table loads', async ({ page }) => {
    await page.goto('/product-sets')
    const productSetsPage = await Page.verifyOnPage(ProductSetsPage, page)

    await expect(productSetsPage.productSetLinks()).toHaveText(['Digital Products'])
    await expect(productSetsPage.productSetLinks()).toHaveAttribute('href', '/product-sets/psdocid0000000000000001')
  })

  test('should filter rows when typing in name column search', async ({ page }) => {
    await page.goto('/product-sets')
    const productSetsPage = await Page.verifyOnPage(ProductSetsPage, page)
    await expect(productSetsPage.productSetLinks()).toHaveCount(1)

    await productSetsPage.searchName('zzz-no-such-product-set')

    await expect(productSetsPage.productSetLinks()).toHaveCount(0)

    await productSetsPage.clearNameSearch()
    await expect(productSetsPage.productSetLinks()).toHaveCount(1)
  })
})
