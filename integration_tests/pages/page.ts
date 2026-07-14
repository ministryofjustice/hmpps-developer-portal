import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page as PlaywrightPage } from '@playwright/test'
import axe from 'axe-core'
import logAccessibilityViolations from '../support/logAccessibilityViolations'

const axeSource = `${axe.source}
axe.configure({ rules: [
  // Known issue with skip link not in a landmark: https://design-system.service.gov.uk/components/skip-link/
  { id: 'region', selector: '*:not(.govuk-skip-link)' },

  // Known issue with radio conditional reveal: https://github.com/alphagov/govuk-frontend/issues/979
  { id: 'aria-allowed-attr', selector: '*:not(.govuk-radios__input[aria-expanded])' },
]})`

export default abstract class Page {
  static verifyOnPage<T extends Page>(Ctor: new (page: PlaywrightPage) => T, page: PlaywrightPage): Promise<T>

  static verifyOnPage<T extends Page>(
    Ctor: new (page: PlaywrightPage, title: string) => T,
    page: PlaywrightPage,
    title: string,
  ): Promise<T>

  static async verifyOnPage<T extends Page>(
    Ctor: new (page: PlaywrightPage, title?: string) => T,
    page: PlaywrightPage,
    title?: string,
  ): Promise<T> {
    const instance = new Ctor(page, title)
    await expect(page.locator('h1')).toContainText(instance.title)
    await instance.runAxe()

    return instance
  }

  protected constructor(
    protected readonly page: PlaywrightPage,
    private readonly title: string,
  ) {}

  private async runAxe(): Promise<void> {
    const { violations } = await new AxeBuilder({ page: this.page, axeSource }).analyze()

    if (violations.length > 0) {
      logAccessibilityViolations(violations)
    }

    expect(violations).toEqual([])
  }
}
