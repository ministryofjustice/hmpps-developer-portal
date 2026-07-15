import { type Page as PlaywrightPage } from '@playwright/test'
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
}
