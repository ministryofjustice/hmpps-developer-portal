import HomePage from '../pages/home'
import TeamsPage from '../pages/teams'
import TeamOverviewPage from '../pages/teamOverview'
import Page from '../pages/page'

context('Visit team overview page for maintenance team', () => {
  it('should load the home page, go to teams page, expand links for the first team (row), and click on the link to the team overview page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.teamsLink()

    const teamsPage = Page.verifyOnPage(TeamsPage)
    teamsPage.allLinks()
    teamsPage.teamOverviewLink()

    const teamOverviewPage = Page.verifyOnPage(TeamOverviewPage)
  })
})
