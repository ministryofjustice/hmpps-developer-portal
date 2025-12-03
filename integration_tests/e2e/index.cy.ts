import Page from '../pages/page'
import IndexPage from '../pages'
import logAccessibilityViolations from '../support/logAccessibilityViolations'

context('Team Overview Page - adj', () => {
  // beforeEach(() => {
  //     cy.task('reset')
  //     // cy.visit('http://localhost:3000')
  // })

  // beforeEach(() => {
  //   cy.visit('http://localhost:3000/teams/team-overview/maintenance')
  //   cy.injectAxe()
  //   cy.configureAxe({
  //     rules: [
  //       // Known issue with skip link not in a landmark: https://design-system.service.gov.uk/components/skip-link/
  //       { id: 'region', selector: '*:not(.govuk-skip-link)' },

  //       // Known issue with radio conditional reveal: https://github.com/alphagov/govuk-frontend/issues/979
  //       { id: 'aria-allowed-attr', selector: '*:not(.govuk-radios__input[aria-expanded])' },

  //       // { id: 'color-contrast', enabled: true }
  //     ],
  //   })
  // })

  it('should scan the team overview page for the adjudications team', () => {
    cy.visit('http://localhost:3000/teams/team-overview/adjudications')
    cy.injectAxe()
    // cy.configureAxe({
    //   rules: [
    //     // Known issue with skip link not in a landmark: https://design-system.service.gov.uk/components/skip-link/
    //     // { id: 'region', selector: '*:not(.govuk-skip-link)' },
    //     { id: 'region', enabled: false },
    //     // Known issue with radio conditional reveal: https://github.com/alphagov/govuk-frontend/issues/979

    //     // { id: 'color-contrast', enabled: true }
    //   ],
    // })
    // cy.configureAxe({
    //   rules: [
    //     // Known issue with skip link not in a landmark: https://design-system.service.gov.uk/components/skip-link/
    //     { id: 'region', selector: '*:not(.govuk-skip-link)' },

    //     // Known issue with radio conditional reveal: https://github.com/alphagov/govuk-frontend/issues/979
    //     { id: 'aria-allowed-attr', selector: '*:not(.govuk-radios__input[aria-expanded])' },

    //     // { id: 'color-contrast', enabled: true }
    //   ],
    // })
    cy.checkA11y(null, null, logAccessibilityViolations, false)
    // const indexPage = Page.verifyOnPage(IndexPage)
    // indexPage.runAxe()
  })
})
