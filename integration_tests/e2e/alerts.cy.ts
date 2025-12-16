import HomePage from '../pages/home'
import Page from '../pages/page'
import AlertsPage from '../pages/alerts'

context('Visit alerts scan page', () => {
  it('should load the home page and go to alerts page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.alertsLink()

    Page.verifyOnPage(AlertsPage)
  })
})
