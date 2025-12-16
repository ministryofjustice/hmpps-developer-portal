import HomePage from '../pages/home'
import ServiceAreasPage from '../pages/serviceAreas'
import ServiceAreaPage from '../pages/serviceArea'
import Page from '../pages/page'

context('Visit service area page for accommodation & interventions', () => {
  it('should load the home page, go to Service Areas, click on the top link for the Accommodation & Interventions page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.serviceAreasLink()

    const serviceAreasPage = Page.verifyOnPage(ServiceAreasPage)
    serviceAreasPage.serviceAreaNameLink()

    Page.verifyOnPage(ServiceAreaPage, 'Accommodation & Interventions')
  })
})
