import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class HomePage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Developer Portal')
  }

  async serviceAreasLink(): Promise<void> {
    await this.page.locator('[data-test="service-area-link"]').click()
  }

  async teamsLink(): Promise<void> {
    await this.page.locator('[data-test="teams-link"]').click()
  }

  async productSetsLink(): Promise<void> {
    await this.page.locator('[data-test="product-sets-link"]').click()
  }

  async productsLink(): Promise<void> {
    await this.page.locator('[data-test="products-link"]').click()
  }

  async componentsLink(): Promise<void> {
    await this.page.locator('[data-test="components-link"]').click()
  }

  async environmentsLink(): Promise<void> {
    await this.page.locator('[data-test="environments-link"]').click()
  }

  async alertsLink(): Promise<void> {
    await this.page.locator('[data-test="alerts-link"]').click()
  }

  async monitorLink(): Promise<void> {
    await this.page.locator('[data-test="monitor-link"]').click()
  }

  async componentDependenciesLink(): Promise<void> {
    await this.page.locator('[data-test="component-dependencies-link"]').click()
  }

  async productDependenciesLink(): Promise<void> {
    await this.page.locator('[data-test="product-dependencies-link"]').click()
  }

  async componentDriftLink(): Promise<void> {
    await this.page.locator('[data-test="component-drift-link"]').click()
  }

  async namespacesLink(): Promise<void> {
    await this.page.locator('[data-test="namespaces-link"]').click()
  }

  async githubTeamsLink(): Promise<void> {
    await this.page.locator('[data-test="github-teams-link"]').click()
  }

  async veracodeLink(): Promise<void> {
    await this.page.locator('[data-test="veracode-link"]').click()
  }

  async rdsLink(): Promise<void> {
    await this.page.locator('[data-test="rds-link"]').click()
  }

  async scheduledJobsLink(): Promise<void> {
    await this.page.locator('[data-test="scheduled-jobs-link"]').click()
  }
}
