import { test } from '@playwright/test'
import HomePage from '../pages/home'
import Page from '../pages/page'
import ScheduledJobPage from '../pages/scheduledJob'
import ScheduledJobsPage from '../pages/scheduledJobs'

test.describe('Visit Scheduled Jobs Page', () => {
  test('should load the home page, go to Scheduled Jobs page, click the first job link and visit that page', async ({
    page,
  }) => {
    await page.goto('/')
    const homePage = await Page.verifyOnPage(HomePage, page)
    await homePage.scheduledJobsLink()

    const scheduledJobsPage = await Page.verifyOnPage(ScheduledJobsPage, page)
    const scheduledJobName = await scheduledJobsPage.scheduledJobLink()
    await Page.verifyOnPage(ScheduledJobPage, page, scheduledJobName)
  })
})
