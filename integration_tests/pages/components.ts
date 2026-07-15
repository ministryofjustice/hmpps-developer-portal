import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ComponentsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Components')
  }

  async componentLink(): Promise<void> {
    await this.page.locator('[data-test="component-links"]').first().click()
  }
}
