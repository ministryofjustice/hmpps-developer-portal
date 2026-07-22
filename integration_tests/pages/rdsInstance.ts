import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class RdsInstancePage extends Page {
  constructor(page: PlaywrightPage, rdsInstanceName: string) {
    super(page, rdsInstanceName)
  }
}
