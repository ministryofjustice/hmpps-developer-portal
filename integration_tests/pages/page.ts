import logAccessibilityViolations from '../support/logAccessibilityViolations'

export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new (title?: string) => T, title?: string): T {
    return new constructor(title)
  }

  constructor(
    private readonly title: string,
    private readonly options: { axeTest?: boolean } = {
      axeTest: true,
    },
  ) {
    this.checkOnPage()

    if (options.axeTest) {
      this.runAxe()
    }
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  runAxe = (): void => {
    cy.injectAxe()

    cy.configureAxe({
      rules: [
        // Known issue with skip link not in a landmark: https://design-system.service.gov.uk/components/skip-link/
        { id: 'region', selector: '*:not(.govuk-skip-link)' },

        // Known issue with radio conditional reveal: https://github.com/alphagov/govuk-frontend/issues/979
        { id: 'aria-allowed-attr', selector: '*:not(.govuk-radios__input[aria-expanded])' },
      ],
    })

    cy.checkA11y(
      undefined,
      undefined,
      logAccessibilityViolations,
      false, // skipFailures
    )
  }
}
