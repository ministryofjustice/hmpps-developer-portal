import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class GithubTeamsPage extends Page {
  constructor(page: PlaywrightPage) {
    super(page, 'GitHub Teams')
  }
}
