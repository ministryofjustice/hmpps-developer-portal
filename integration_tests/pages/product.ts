import Page, { PageElement } from './page'

export default class ProductPage extends Page {
  constructor(productName: string) {
    super(`${productName}`)
  }

  componentLink = (): PageElement => cy.get('[data-test="component-link"]').first().click()
}
