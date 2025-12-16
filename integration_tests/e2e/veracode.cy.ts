import HomePage from '../pages/home'
import Page from '../pages/page'
import VeracodePage from '../pages/veracode'

context('Visit veracode scan page', () => {
  it('should load the home page and go to veracode page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.veracodeLink()

    Page.verifyOnPage(VeracodePage)
  })
})
