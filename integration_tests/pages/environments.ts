import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class EnvironmentsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Environments')
  }

  async environmentLink(): Promise<string> {
    const link = this.page.locator('[data-test="environment"]').first()
    const environmentName = (await link.textContent())?.trim() ?? ''
    await link.click()

    return environmentName
  }
}
