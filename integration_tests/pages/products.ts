import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ProductsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Products')
  }

  async idLink(): Promise<void> {
    await this.page.locator('[data-test="id-links"]').first().click()
  }

  idLinks(): Locator {
    return this.page.locator('[data-test="id-links"]')
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
