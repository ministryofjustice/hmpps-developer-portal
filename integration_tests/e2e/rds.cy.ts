import HomePage from '../pages/home'
import Page from '../pages/page'
import RdsPage from '../pages/rds'
import RdsInstancePage from '../pages/rdsInstance'

context('Visit RDS Page', () => {
  it('should load the home page, go to RDS page, click the first RDS instance link and visit that page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.rdsLink()

    const rdsPage = Page.verifyOnPage(RdsPage)
    rdsPage.rdsInstanceLink().then(rdsInstanceName => {
      Page.verifyOnPage(RdsInstancePage, rdsInstanceName)
    })
  })
})
