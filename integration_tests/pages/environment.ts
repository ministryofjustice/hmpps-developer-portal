import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class EnvironmentPage extends Page {
  constructor(page: PlaywrightPage, environmentName: string) {
    super(page, environmentName)
  }
}
