import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ServiceAreasPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Service Areas')
  }

  async serviceAreaNameLink(): Promise<void> {
    await this.page.locator('[data-test="service-area-name-link"]').first().click()
  }
}
