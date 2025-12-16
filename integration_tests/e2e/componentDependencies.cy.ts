import HomePage from '../pages/home'
import Page from '../pages/page'
import ComponentDependenciesPage from '../pages/componentDependencies'

context('Visit Component Dependencies page', () => {
  it('should load the home page and go to component dependencies page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.componentDependenciesLink()

    Page.verifyOnPage(ComponentDependenciesPage)
  })
})
