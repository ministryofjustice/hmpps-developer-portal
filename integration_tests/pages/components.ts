import Page, { PageElement } from './page'

export default class ComponentsPage extends Page {
  constructor() {
    super('Components')
  }

  componentLink = (): PageElement => cy.get('[data-test="component-links"]').first().click()
}
