import { type Locator, type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class EnvironmentPage extends Page {
  constructor(page: PlaywrightPage, environmentName: string) {
    super(page, environmentName)
  }

  statusTile(env: string): Locator {
    return this.page.locator(`#${env}_status`)
  }

  version(env: string): Locator {
    return this.page.locator(`#${env}_version`)
  }

  healthRaw(env: string): Locator {
    return this.page.locator(`#${env}_health_raw`)
  }

  healthChart(): Locator {
    return this.page.locator('#healthChart svg').first()
  }
}
