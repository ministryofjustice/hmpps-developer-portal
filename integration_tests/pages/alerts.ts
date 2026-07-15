import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class AlertsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Alerts')
  }
}
