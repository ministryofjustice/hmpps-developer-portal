import HomePage from '../pages/home'
import ComponentPage from '../pages/component'
import ComponentsPage from '../pages/components'
import Page from '../pages/page'

context('visit the accredited programmes and delius component page', () => {
  it('should load the home page, go to the components page, click on the first link(accredited programmes and delius), and go to that page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.componentsLink()

    const componentsPage = Page.verifyOnPage(ComponentsPage)
    componentsPage.componentLink()

    Page.verifyOnPage(ComponentPage, 'accredited-programmes-and-delius')
  })
})
