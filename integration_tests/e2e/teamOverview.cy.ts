import HomePage from '../pages/home'
import TeamsPage from '../pages/teams'
import TeamOverviewPage from '../pages/teamOverview'
import Page from '../pages/page'

context('Visit team overview page for maintenance team', () => {
  // it('should load and scan home page', () => {
  // cy.signIn()
  //     cy.visit('http://localhost:3000')
  //     const homePage = Page.verifyOnPage(HomePage)
  // })

  // it('should load the home page, go to teams and scan the teams page', () => {
  //     // cy.signIn()
  //     cy.visit('http://localhost:3000')
  //     const homePage = Page.verifyOnPage(HomePage)
  //     homePage.teamsLink()

  //     const teamsPage = Page.verifyOnPage(TeamsPage)
  // })

  it('should load home page, go to teams, click links, and go to team overview page for the activities team', () => {
    // cy.visit('http://localhost:3000/teams/team-overview/maintenance')
    // Page.verifyOnPage(TeamOverviewPage)
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.teamsLink()

    const teamsPage = Page.verifyOnPage(TeamsPage)
    teamsPage.allLinks()
    teamsPage.teamOverviewLink()

    const teamOverviewPage = Page.verifyOnPage(TeamOverviewPage)
  })
})
