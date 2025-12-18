import HomePage from '../pages/home'
import Page from '../pages/page'
import NamespacesPage from '../pages/namespaces'

context('Visit Namespaces Page', () => {
  it('should load the home page and go to the namespaces page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.namespacesLink()

    Page.verifyOnPage(NamespacesPage)
  })
})
