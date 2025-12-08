import Page, { PageElement } from './page'

export default class TeamsPage extends Page {
  constructor() {
    super('Teams')
  }

  allLinks = (): PageElement => cy.get('[data-test="all-links"]').first().click()

  teamOverviewLink = (): PageElement => cy.get('[data-test="team-overview-link"]').first().click()
}
