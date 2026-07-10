import HomePage from '../pages/home'
import Page from '../pages/page'
import MonitorPage from '../pages/monitor'

context('Visit health monitor page', () => {
  beforeEach(() => {
    cy.task('seedRedis')
  })

  it('should load the home page and go to health monitor page', () => {
    cy.visit('/')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.monitorLink()

    Page.verifyOnPage(MonitorPage)
  })
})
