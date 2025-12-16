import HomePage from '../pages/home'
import Page from '../pages/page'
import MonitorPage from '../pages/monitor'

context('Visit health monitor page', () => {
  it('should load the home page and go to health monitor page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.monitorLink()

    Page.verifyOnPage(MonitorPage)
  })
})
