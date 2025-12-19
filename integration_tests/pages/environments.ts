import Page from './page'

export default class EnvironmentsPage extends Page {
  constructor() {
    super('Environments')
  }

  environmentLink = (): Cypress.Chainable<string> =>
    cy
      .get('[data-test="environment"]')
      .first()
      .then($element => {
        const environmentName = $element.text().trim()
        cy.wrap($element).click()
        return cy.wrap(environmentName)
      })
}
