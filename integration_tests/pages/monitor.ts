import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class MonitorPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Monitor')
  }
}
