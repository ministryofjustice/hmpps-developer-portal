import Page from './page'

export default class ScheduledJobsPage extends Page {
  constructor() {
    super('Scheduled Jobs')
  }

  scheduledJobLink = (): Cypress.Chainable<string> =>
    cy
      .get('[data-test="scheduled-job-link"]')
      .first()
      .then($element => {
        const scheduledJobName = $element.text().trim()
        cy.wrap($element).click()
        return cy.wrap(scheduledJobName)
      })
}
