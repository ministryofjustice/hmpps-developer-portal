import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ProductSetsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Product Sets')
  }

  async productSetLink(): Promise<string> {
    const link = this.page.locator('[data-test="product-set-link"]').first()
    const productSetName = (await link.textContent())?.trim() ?? ''
    await link.click()

    return productSetName
  }
}
