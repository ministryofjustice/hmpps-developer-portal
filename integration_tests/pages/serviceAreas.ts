import Page, { PageElement } from './page'

export default class ServiceAreasPage extends Page {
  constructor() {
    super('Service Areas')
  }

  serviceAreaNameLink = (): PageElement => cy.get('[data-test="service-area-name-link"]').first().click()
}
