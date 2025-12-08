import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Developer Portal')
  }

  teamsLink = (): PageElement => cy.get('[data-test="teams-link"]').click()
}
