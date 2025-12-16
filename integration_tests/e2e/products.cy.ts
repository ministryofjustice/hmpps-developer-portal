import HomePage from '../pages/home'
import ProductsPage from '../pages/products'
import ProductPage from '../pages/product'
import Page from '../pages/page'
import ComponentPage from '../pages/component'

context('visit the Service Catalogue product page', () => {
  it('should load the home page, go to the products page, click on the first link (service catalogue), and then go to the first component in the table (hmpps-component-dependencies)', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.productsLink()

    const productsPage = Page.verifyOnPage(ProductsPage)
    productsPage.idLink()

    const productPage = Page.verifyOnPage(ProductPage, 'Service Catalogue')
    productPage.componentLink()

    Page.verifyOnPage(ComponentPage, 'hmpps-component-dependencies')
  })
})
