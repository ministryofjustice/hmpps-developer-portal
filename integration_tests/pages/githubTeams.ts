import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class GithubTeamsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'GitHub Teams')
  }

  teamLinks(): Locator {
    return this.page.locator('#githubTeamsTable tbody td:first-child a')
  }

  async searchTeamName(term: string): Promise<void> {
    const input = this.page.getByPlaceholder('Team Name (regex)', { exact: true })
    await input.click()
    await input.pressSequentially(term)
  }

  async clearTeamNameSearch(): Promise<void> {
    const input = this.page.getByPlaceholder('Team Name (regex)', { exact: true })
    await input.press('ControlOrMeta+a')
    await input.press('Backspace')
  }
}
