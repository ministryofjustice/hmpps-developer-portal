import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import ProductsPage from '../pages/products'
import ProductPage from '../pages/product'
import Page from '../pages/page'
import ComponentPage from '../pages/component'
import redis from '../mockApis/redis'

test.describe('visit the Service Catalogue product page', () => {
  test.beforeEach(async () => {
    await redis.seed()
  })

  test('should load the home page, go to the products page, click on the first link (service catalogue), and then go to the first component in the table (hmpps-component-dependencies)', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.productsLink()

    const productsPage = await Page.verifyOnPage(ProductsPage, page)
    await productsPage.idLink()

    const productPage = await Page.verifyOnPage(ProductPage, page, 'Service Catalogue')
    await productPage.componentLink()

    await Page.verifyOnPage(ComponentPage, page, 'hmpps-component-dependencies')
  })
})

test.describe('Products table', () => {
  test('should render all products when table loads', async ({ page }) => {
    await page.goto('/products')
    const productsPage = await Page.verifyOnPage(ProductsPage, page)

    await expect(productsPage.idLinks()).toHaveCount(2)
    await expect(page.locator('[data-test="id-links"][href="/products/service-catalogue"]')).toBeVisible()
    await expect(page.locator('[data-test="id-links"][href="/products/accredited-programmes"]')).toBeVisible()
  })

  test('should filter rows when typing in name column search', async ({ page }) => {
    await page.goto('/products')
    const productsPage = await Page.verifyOnPage(ProductsPage, page)
    await expect(productsPage.idLinks()).toHaveCount(2)

    await productsPage.searchName('Catalogue')

    await expect(productsPage.idLinks()).toHaveText(['DPS000'])

    await productsPage.clearNameSearch()
    await expect(productsPage.idLinks()).toHaveCount(2)
  })
})
