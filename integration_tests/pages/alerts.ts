import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class AlertsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Alerts')
  }

  alertRows(): Locator {
    return this.page.locator('#alertsTable tbody tr')
  }

  alertRow(alertname: string): Locator {
    return this.page.locator('#alertsTable tbody tr', { hasText: alertname })
  }

  async selectApplication(value: string): Promise<void> {
    await this.page.locator('#application').selectOption(value)
  }

  async applyApplicationFilter(): Promise<void> {
    await this.page.locator('#updateApplicationName').click()
  }

  async resetFilters(): Promise<void> {
    await this.page.locator('#resetFilters').click()
  }
}
