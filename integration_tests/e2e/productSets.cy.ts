import HomePage from '../pages/home'
import Page from '../pages/page'
import ProductSetsPage from '../pages/productSets'
import ProductSetPage from '../pages/productSet'

context('Visit Product Sets Page', () => {
  it('should load the home page, go to Product Sets page, click the first product set link and visit that page', () => {
    cy.visit('/')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.productSetsLink()

    const productSetsPage = Page.verifyOnPage(ProductSetsPage)
    productSetsPage.productSetLink().then(productSetName => {
      Page.verifyOnPage(ProductSetPage, productSetName)
    })
  })
})
