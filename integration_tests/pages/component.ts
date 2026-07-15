import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ComponentPage extends Page {
  constructor(page: PlaywrightPage, componentName: string) {
    super(page, componentName)
  }
}
