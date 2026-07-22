import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ProductPage extends Page {
  constructor(page: PlaywrightPage, productName: string) {
    super(page, productName)
  }

  async componentLink(): Promise<void> {
    await this.page.locator('[data-test="component-link"]').first().click()
  }
}
