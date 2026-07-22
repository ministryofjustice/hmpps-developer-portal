import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ProductSetPage extends Page {
  constructor(page: PlaywrightPage, productSetName: string) {
    super(page, productSetName)
  }
}
