import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ProductsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Products')
  }

  async idLink(): Promise<void> {
    await this.page.locator('[data-test="id-links"]').first().click()
  }
}
