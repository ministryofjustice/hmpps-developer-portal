import Page, { PageElement } from './page'

export default class ProductsPage extends Page {
  constructor() {
    super('Products')
  }

  idLink = (): PageElement => cy.get('[data-test="id-links"]').first().click()
}
