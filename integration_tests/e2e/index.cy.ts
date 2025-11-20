import Page from '../pages/page'
import IndexPage from '../pages'
import logAccessibilityViolations from '../support/logAccessibilityViolations'

context('Index Page', () => {
  // beforeEach(() => {
  //     cy.task('reset')
  //     // cy.visit('http://localhost:3000')
  // })

  it('should scan the index page', () => {
    cy.visit('http://localhost:3000/teams/team-overview/farsight-activity-management-team')
    cy.injectAxe()
    cy.configureAxe({
      rules: [
        // Known issue with skip link not in a landmark: https://design-system.service.gov.uk/components/skip-link/
        { id: 'region', selector: '*:not(.govuk-skip-link)' },

        // Known issue with radio conditional reveal: https://github.com/alphagov/govuk-frontend/issues/979
        { id: 'aria-allowed-attr', selector: '*:not(.govuk-radios__input[aria-expanded])' },

        // { id: 'color-contrast', enabled: true }
      ],
    })
    cy.checkA11y(null, null, logAccessibilityViolations)
    // const indexPage = Page.verifyOnPage(IndexPage)
    // indexPage.runAxe()
  })
})
