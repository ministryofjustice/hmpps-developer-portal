import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import GithubTeamsPage from '../pages/githubTeams'

test.describe('Visit GitHub Teams Page', () => {
  test('should load the home page and go to the GitHub teams page', async ({ page }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.githubTeamsLink()

    await Page.verifyOnPage(GithubTeamsPage, page)
  })
})

test.describe('GitHub Teams table', () => {
  test('should render all github teams when table loads', async ({ page }) => {
    await page.goto('/github-teams')
    const githubTeamsPage = await Page.verifyOnPage(GithubTeamsPage, page)

    await expect(githubTeamsPage.teamLinks()).toHaveCount(2)
    await expect(page.locator('#githubTeamsTable [href="/github-teams/developer-experience"]')).toBeVisible()
    await expect(page.locator('#githubTeamsTable [href="/github-teams/hmpps-developers"]').first()).toBeVisible()
  })

  test('should filter rows when typing in team name column search', async ({ page }) => {
    await page.goto('/github-teams')
    const githubTeamsPage = await Page.verifyOnPage(GithubTeamsPage, page)
    await expect(githubTeamsPage.teamLinks()).toHaveCount(2)

    await githubTeamsPage.searchTeamName('experience')

    await expect(githubTeamsPage.teamLinks()).toHaveText(['developer-experience'])

    await githubTeamsPage.clearTeamNameSearch()
    await expect(githubTeamsPage.teamLinks()).toHaveCount(2)
  })
})
