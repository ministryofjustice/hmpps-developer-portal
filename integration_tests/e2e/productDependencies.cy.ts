import HomePage from '../pages/home'
import Page from '../pages/page'
import ProductDependenciesPage from '../pages/productDependencies'

context('Visit Product Dependencies page', () => {
  it('should load the home page and go to Product Dependencies page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.productDependenciesLink()

    Page.verifyOnPage(ProductDependenciesPage)
  })
})
