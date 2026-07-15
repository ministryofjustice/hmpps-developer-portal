import { test } from '@playwright/test'
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
