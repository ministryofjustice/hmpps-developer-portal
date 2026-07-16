import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ComponentRequestsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Component Requests')
  }

  componentRequestLinks(): Locator {
    return this.page.locator('#componentRequestsTable tbody td:first-child a')
  }

  async searchComponentName(term: string): Promise<void> {
    const input = this.page.getByPlaceholder('Component Name (regex)', { exact: true })
    await input.click()
    await input.pressSequentially(term)
  }

  async clearComponentNameSearch(): Promise<void> {
    const input = this.page.getByPlaceholder('Component Name (regex)', { exact: true })
    await input.press('ControlOrMeta+a')
    await input.press('Backspace')
  }
}
