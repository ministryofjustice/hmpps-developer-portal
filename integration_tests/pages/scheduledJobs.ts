import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ScheduledJobsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Scheduled Jobs')
  }

  async scheduledJobLink(): Promise<string> {
    const link = this.page.locator('[data-test="scheduled-job-link"]').first()
    const scheduledJobName = (await link.textContent())?.trim() ?? ''
    await link.click()

    return scheduledJobName
  }

  scheduledJobLinks(): Locator {
    return this.page.locator('[data-test="scheduled-job-link"]')
  }

  async searchJobName(term: string): Promise<void> {
    const input = this.page.getByPlaceholder('Job Name (regex)', { exact: true })
    await input.click()
    await input.pressSequentially(term)
  }

  async clearJobNameSearch(): Promise<void> {
    const input = this.page.getByPlaceholder('Job Name (regex)', { exact: true })
    await input.press('ControlOrMeta+a')
    await input.press('Backspace')
  }
}
