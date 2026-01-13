context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubServiceCataloguePing')
      cy.task('stubAlertManagerPing')
    })

    it('Health check page is visible and UP', () => {
      cy.request('/health').its('body.status').should('equal', 'UP')
    })

    it('Health check page is visible and includes health of all services', () => {
      cy.request('/health').its('body.components').then(Object.keys).should('have.length', 2)
    })

    it('Health check page is visible and all services are UP', () => {
      cy.request('/health').its('body.components.serviceCatalogue.status').should('equal', 'UP')
      cy.request('/health').its('body.components.alertManager.status').should('equal', 'UP')
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })

    it('Info is visible', () => {
      cy.request('/info').its('body').should('exist')
    })
  })

  context('All unhealthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubServiceCataloguePing', 500)
      cy.task('stubAlertManagerPing', 500)
    })

    it('Health check page is visible and DOWN', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).its('body.status').should('equal', 'DOWN')
    })

    it('Health check page is visible and all services are DOWN', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false })
        .its('body.components.serviceCatalogue.status')
        .should('equal', 'DOWN')
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false })
        .its('body.components.alertManager.status')
        .should('equal', 'DOWN')
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })

    it('Info is visible', () => {
      cy.request('/info').its('body').should('exist')
    })
  })
})
