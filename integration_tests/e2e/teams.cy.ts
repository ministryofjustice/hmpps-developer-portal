import HomePage from '../pages/home'
import TeamsPage from '../pages/teams'
import TeamOverviewPage from '../pages/teamOverview'
import TeamPage from '../pages/team'
import Page from '../pages/page'

context('Visit Teams Page', () => {
  it('should load the home page, go to teams page, expand links for the first team (row), and click on the link to the team overview page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.teamsLink()

    const teamsPage = Page.verifyOnPage(TeamsPage)
    teamsPage.allLinks()
    teamsPage.teamOverviewLink()

    Page.verifyOnPage(TeamOverviewPage)
  })

  it('should load the home page, go to teams page, click the link of the first team, and visit that team page', () => {
    cy.visit('http://localhost:3000')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.teamsLink()

    const teamsPage = Page.verifyOnPage(TeamsPage)
    teamsPage.teamLink().then(teamName => {
      Page.verifyOnPage(TeamPage, teamName)
    })
  })
})
