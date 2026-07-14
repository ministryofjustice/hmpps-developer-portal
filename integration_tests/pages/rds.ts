import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class RdsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'RDS Instances')
  }

  async rdsInstanceLink(): Promise<string> {
    const link = this.page.locator('[data-test="rds-instance-link"]').first()
    const rdsInstanceName = (await link.textContent())?.trim() ?? ''
    await link.click()

    return rdsInstanceName
  }
}
