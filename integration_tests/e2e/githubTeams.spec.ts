import { test } from '@playwright/test'
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
