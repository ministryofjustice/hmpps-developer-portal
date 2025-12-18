import Page from './page'

export default class RdsPage extends Page {
  constructor() {
    super('RDS Instances')
  }

  rdsInstanceLink = (): Cypress.Chainable<string> =>
    cy
      .get('[data-test="rds-instance-link"]')
      .first()
      .then($element => {
        const rdsInstanceName = $element.text().trim()
        cy.wrap($element).click()
        return cy.wrap(rdsInstanceName)
      })
}
