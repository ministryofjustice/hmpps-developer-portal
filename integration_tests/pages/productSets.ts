import Page from './page'

export default class ProductSetsPage extends Page {
  constructor() {
    super('Product Sets')
  }

  productSetLink = (): Cypress.Chainable<string> =>
    cy
      .get('[data-test="product-set-link"]')
      .first()
      .then($element => {
        const productSetName = $element.text().trim()
        cy.wrap($element).click()
        return cy.wrap(productSetName)
      })
}
