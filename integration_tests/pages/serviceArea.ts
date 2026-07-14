import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ServiceAreaPage extends Page {
  constructor(page: PlaywrightPage, serviceAreaName: string) {
    super(page, serviceAreaName)
  }
}
