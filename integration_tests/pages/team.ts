import { type Page as PlaywrightPage } from '@playwright/test'
import Page from './page'

export default class TeamPage extends Page {
  constructor(page: PlaywrightPage, teamName: string) {
    super(page, teamName)
  }
}
