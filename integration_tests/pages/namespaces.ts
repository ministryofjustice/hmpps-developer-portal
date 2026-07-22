import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class NamespacesPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Namespaces')
  }

  namespaceLinks(): Locator {
    return this.page.locator('#namespacesTable tbody td:first-child a')
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
