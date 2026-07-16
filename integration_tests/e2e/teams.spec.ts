import { expect, test } from '@playwright/test'
import HomePage from '../pages/home'
import TeamsPage from '../pages/teams'
import TeamOverviewPage from '../pages/teamOverview'
import TeamPage from '../pages/team'
import Page from '../pages/page'

test.describe('Visit Teams Page', () => {
  test('should load the home page, go to teams page, expand links for the first team (row), and click on the link to the team overview page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.teamsLink()

    const teamsPage = await Page.verifyOnPage(TeamsPage, page)
    await teamsPage.allLinks()
    await teamsPage.teamOverviewLink()

    await Page.verifyOnPage(TeamOverviewPage, page)
  })

  test('should load the home page, go to teams page, click the link of the first team, and visit that team page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.teamsLink()

    const teamsPage = await Page.verifyOnPage(TeamsPage, page)
    const teamName = await teamsPage.teamLink()
    await Page.verifyOnPage(TeamPage, page, teamName)
  })
})

test.describe('Teams table', () => {
  test('should render all teams when table loads', async ({ page }) => {
    await page.goto('/teams')
    const teamsPage = await Page.verifyOnPage(TeamsPage, page)

    await expect(teamsPage.teamLinks()).toHaveText(['Developer Experience'])
    await expect(teamsPage.teamLinks()).toHaveAttribute('href', '/teams/developer-experience')
  })

  test('should filter rows when typing in name column search', async ({ page }) => {
    await page.goto('/teams')
    const teamsPage = await Page.verifyOnPage(TeamsPage, page)
    await expect(teamsPage.teamLinks()).toHaveCount(1)

    await teamsPage.searchName('zzz-no-such-team')

    await expect(teamsPage.teamLinks()).toHaveCount(0)

    await teamsPage.clearNameSearch()
    await expect(teamsPage.teamLinks()).toHaveCount(1)
  })
})
