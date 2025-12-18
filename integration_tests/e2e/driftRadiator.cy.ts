import HomePage from '../pages/home'
import Page from '../pages/page'
import DriftRadiatorPage from '../pages/driftRadiator'

context('Visit Component Drift Page', () => {
  it('should load the home page and go to the drift radiator page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.componentDriftLink()

    Page.verifyOnPage(DriftRadiatorPage)
  })
})
