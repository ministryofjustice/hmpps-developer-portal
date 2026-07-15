import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class TeamOverviewPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Team Overview')
  }
}
