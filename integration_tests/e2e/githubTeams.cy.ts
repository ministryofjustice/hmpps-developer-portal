import HomePage from '../pages/home'
import Page from '../pages/page'
import GithubTeamsPage from '../pages/githubTeams'

context('Visit GitHub Teams Page', () => {
  it('should load the home page and go to the GitHub teams page', () => {
    cy.visit('/')
    const homePage = Page.verifyOnPage(HomePage)
    homePage.githubTeamsLink()

    Page.verifyOnPage(GithubTeamsPage)
  })
})
