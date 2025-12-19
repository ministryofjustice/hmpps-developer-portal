import HomePage from '../pages/home'
import Page from '../pages/page'
import EnvironmentsPage from '../pages/environments'
import EnvironmentPage from '../pages/environment'

context('Visit Environments Page', () => {
  it('should load the home page, go to environments page, click the first environment link and visit that page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.environmentsLink()

    const environmentsPage = Page.verifyOnPage(EnvironmentsPage)
    environmentsPage.environmentLink().then(environmentName => {
      Page.verifyOnPage(EnvironmentPage, environmentName)
    })
  })
})
