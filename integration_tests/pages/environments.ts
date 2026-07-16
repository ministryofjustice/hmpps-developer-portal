import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
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

  environmentLinks(): Locator {
    return this.page.locator('[data-test="environment"]')
  }

  async searchEnvironment(term: string): Promise<void> {
    const input = this.page.getByPlaceholder('Environment (regex)', { exact: true })
    await input.click()
    await input.pressSequentially(term)
  }

  async clearEnvironmentSearch(): Promise<void> {
    const input = this.page.getByPlaceholder('Environment (regex)', { exact: true })
    await input.press('ControlOrMeta+a')
    await input.press('Backspace')
  }
}
