import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ComponentsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Components')
  }

  async componentLink(): Promise<void> {
    await this.page.locator('[data-test="component-links"]').first().click()
  }

  componentLinks(): Locator {
    return this.page.locator('[data-test="component-links"]')
  }

  githubRepoLinks(): Locator {
    return this.page.locator('[data-test="github-repo"]')
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

  emptyMessage(): Locator {
    return this.page.locator('#componentsTable td.dt-empty')
  }
}
