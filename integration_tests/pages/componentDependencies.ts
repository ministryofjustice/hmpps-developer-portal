import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class ComponentDependenciesPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'Component Dependency Versions')
  }
}
