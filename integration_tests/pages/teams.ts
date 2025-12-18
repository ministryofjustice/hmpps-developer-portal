import Page, { PageElement } from './page'

export default class TeamsPage extends Page {
  constructor() {
    super('Teams')
  }

  allLinks = (): PageElement => cy.get('[data-test="all-links"]').first().click()

  teamOverviewLink = (): PageElement => cy.get('[data-test="team-overview-link"]').first().click()

  teamLink = (): Cypress.Chainable<string> =>
    cy
      .get('[data-test="team-link"]')
      .first()
      .then($element => {
        const teamName = $element.text().trim()
        cy.wrap($element).click()
        return cy.wrap(teamName)
      })
}
