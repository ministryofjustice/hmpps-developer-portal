import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ScheduledJobPage extends Page {
  constructor(page: PlaywrightPage, scheduledJobName: string) {
    super(page, scheduledJobName)
  }
}
