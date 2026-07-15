import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ServiceAreasPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Service Areas')
  }

  async serviceAreaNameLink(): Promise<void> {
    await this.page.locator('[data-test="service-area-name-link"]').first().click()
  }

  serviceAreaNameLinks(): Locator {
    return this.page.locator('[data-test="service-area-name-link"]')
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
