import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
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

  rdsInstanceLinks(): Locator {
    return this.page.locator('[data-test="rds-instance-link"]')
  }

  async searchLabel(term: string): Promise<void> {
    const input = this.page.getByPlaceholder('Label (regex)', { exact: true })
    await input.click()
    await input.pressSequentially(term)
  }

  async clearLabelSearch(): Promise<void> {
    const input = this.page.getByPlaceholder('Label (regex)', { exact: true })
    await input.press('ControlOrMeta+a')
    await input.press('Backspace')
  }
}
