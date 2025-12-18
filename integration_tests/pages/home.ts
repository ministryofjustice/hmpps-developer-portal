import Page, { PageElement } from './page'

export default class HomePage extends Page {
  constructor() {
    super('Developer Portal')
  }

  serviceAreasLink = (): PageElement => cy.get('[data-test="service-area-link"]').click()

  teamsLink = (): PageElement => cy.get('[data-test="teams-link"]').click()

  productSetsLink = (): PageElement => cy.get('[data-test="product-sets-link"]').click()

  productsLink = (): PageElement => cy.get('[data-test="products-link"]').click()

  componentsLink = (): PageElement => cy.get('[data-test="components-link"]').click()

  environmentsLink = (): PageElement => cy.get('[data-test="environments-link"]').click()

  alertsLink = (): PageElement => cy.get('[data-test="alerts-link"]').click()

  monitorLink = (): PageElement => cy.get('[data-test="monitor-link"]').click()

  componentDependenciesLink = (): PageElement => cy.get('[data-test="component-dependencies-link"]').click()

  productDependenciesLink = (): PageElement => cy.get('[data-test="product-dependencies-link"]').click()

  componentDriftLink = (): PageElement => cy.get('[data-test="component-drift-link"]').click()

  namespacesLink = (): PageElement => cy.get('[data-test="namespaces-link"]').click()

  githubTeamsLink = (): PageElement => cy.get('[data-test="github-teams-link"]').click()

  veracodeLink = (): PageElement => cy.get('[data-test="veracode-link"]').click()

  trivyLink = (): PageElement => cy.get('[data-test="trivy-link"]').click()

  rdsLink = (): PageElement => cy.get('[data-test="rds-link"]').click()

  scheduledJobsLink = (): PageElement => cy.get('[data-test="scheduled-jobs-link"]').click()
}
