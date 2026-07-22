import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class VeracodePage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Veracode Scan Results')
  }
}
