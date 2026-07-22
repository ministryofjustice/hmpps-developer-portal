import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
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

  productSetLinks(): Locator {
    return this.page.locator('[data-test="product-set-link"]')
  }

  async searchName(term: string): Promise<void> {
    const input = this.page.getByPlaceholder('Name (regex)', { exact: true })
    await input.click()
    await input.pressSequentially(term)
  }

  async clearNameSearch(): Promise<void> {
    const input = this.page.getByPlaceholder('Name (regex)', { exact: true })
    await input.press('ControlOrMeta+a')
    await input.press('Backspace')
  }
}
