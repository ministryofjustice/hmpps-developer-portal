import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class TeamsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Teams')
  }

  async allLinks(): Promise<void> {
    await this.page.locator('[data-test="all-links"]').first().click()
  }

  async teamOverviewLink(): Promise<void> {
    await this.page.locator('[data-test="team-overview-link"]').first().click()
  }

  async teamLink(): Promise<string> {
    const link = this.page.locator('[data-test="team-link"]').first()
    const teamName = (await link.textContent())?.trim() ?? ''
    await link.click()

    return teamName
  }
}
