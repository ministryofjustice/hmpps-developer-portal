import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class MonitorPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Monitor')
  }

  tile(component: string, env: string): Locator {
    return this.page.locator(`#tile-${component}-${env}`)
  }

  async toggleEnvironment(env: string): Promise<void> {
    await this.page.locator(`#environment-${env}`).click()
  }
}
