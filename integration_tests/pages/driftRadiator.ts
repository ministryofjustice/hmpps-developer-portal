import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class DriftRadiatorPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Deployment Drift Radiator')
  }
}
