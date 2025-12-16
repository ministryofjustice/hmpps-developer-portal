import HomePage from '../pages/home'
import Page from '../pages/page'
import TrivyPage from '../pages/trivy'

context('Visit trivy scan page', () => {
  it('should load the home page and go to trivy scan page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.trivyLink()

    Page.verifyOnPage(TrivyPage)
  })
})
